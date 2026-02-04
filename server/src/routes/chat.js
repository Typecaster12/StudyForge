import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Ollama } from '@langchain/ollama';
import Groq from 'groq-sdk';
import { retrieveContext } from '../services/rag.js';
import { getSettings } from '../services/generator.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize AI providers lazily
let geminiModel = null;
let ollamaLLM = null;
let groqClient = null;

function getAIProvider() {
  const settings = getSettings();
  if (settings.localOnlyMode) return 'ollama';
  return settings.aiProvider || process.env.AI_PROVIDER || 'groq';
}

function initializeChat() {
  const AI_PROVIDER = getAIProvider();
  
  if (AI_PROVIDER === 'gemini' && !geminiModel) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });
  } else if (AI_PROVIDER === 'groq' && !groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  } else if (AI_PROVIDER === 'ollama' && !ollamaLLM) {
    ollamaLLM = new Ollama({
      model: 'qwen3:8b',
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      temperature: 0.7,
    });
  }
}

async function generateChatResponse(documentContent, question, chatHistory = [], ragContext = null) {
  initializeChat();
  const AI_PROVIDER = getAIProvider();
  
  // Build context from chat history
  const historyContext = chatHistory
    .slice(-6) // Last 6 messages for context
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n');

  // Include RAG context if available
  const ragSection = ragContext && ragContext.length > 0
    ? `\nRELEVANT EXCERPTS FROM NOTES:\n${ragContext.map((c, i) => `[${i + 1}] ${c.text}`).join('\n\n')}\n`
    : '';

  const prompt = `You are a helpful AI study assistant. Answer questions based on the provided document content.

DOCUMENT CONTENT:
${documentContent.substring(0, 8000)}
${ragSection}
${historyContext ? `CONVERSATION HISTORY:\n${historyContext}\n` : ''}
USER QUESTION: ${question}

INSTRUCTIONS:
- Answer based primarily on the document content${ragContext ? ' and relevant excerpts' : ''}
- Be concise but thorough
- If the answer isn't in the document, say so but try to help
- Use markdown formatting for better readability
- Be encouraging and supportive

ANSWER:`;

  if (AI_PROVIDER === 'gemini') {
    const result = await geminiModel.generateContent(prompt);
    return result.response.text();
  } else if (AI_PROVIDER === 'groq') {
    const completion = await groqClient.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'groq/compound',
      temperature: 0.7,
      max_completion_tokens: 2048,
    });
    return completion.choices[0]?.message?.content || '';
  } else {
    return await ollamaLLM.invoke(prompt);
  }
}

// POST /api/chat - Chat with document
router.post('/', async (req, res, next) => {
  try {
    const { content, question, history = [], documentId, useRAG = false } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: { message: 'Document content is required' }
      });
    }

    if (!question || question.trim().length === 0) {
      return res.status(400).json({
        error: { message: 'Question is required' }
      });
    }

    console.log(`💬 Chat question: "${question.substring(0, 50)}..."`);
    
    // Retrieve RAG context if enabled and documentId provided
    let ragContext = null;
    if (useRAG && documentId) {
      try {
        ragContext = await retrieveContext(documentId, question, 3);
        console.log(`📚 Retrieved ${ragContext.length} RAG chunks`);
      } catch (ragError) {
        console.warn('RAG retrieval failed:', ragError.message);
      }
    }
    
    const response = await generateChatResponse(content, question, history, ragContext);
    
    console.log('✅ Chat response generated');
    
    res.json({ 
      success: true, 
      data: { 
        response,
        ragUsed: ragContext !== null && ragContext.length > 0,
        timestamp: new Date().toISOString()
      } 
    });
  } catch (error) {
    console.error('Chat error:', error.message);
    next(error);
  }
});

// POST /api/chat/rag - Chat with RAG (answer from notes only)
router.post('/rag', async (req, res, next) => {
  try {
    const { documentId, question, history = [] } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: { message: 'Document ID is required for RAG chat' } });
    }

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ error: { message: 'Question is required' } });
    }

    console.log(`🔍 RAG chat for document ${documentId}: "${question.substring(0, 50)}..."`);
    
    // Retrieve relevant context
    const ragContext = await retrieveContext(documentId, question, 5);
    
    if (!ragContext || ragContext.length === 0) {
      return res.json({
        success: true,
        data: {
          response: "I couldn't find relevant information in your notes for this question. Try rephrasing or ask about a different topic.",
          ragUsed: true,
          chunksFound: 0
        }
      });
    }

    const contextText = ragContext.map(c => c.text).join('\n\n');
    
    initializeChat();
    const AI_PROVIDER = getAIProvider();
    
    const prompt = `You are a study assistant. Answer ONLY using the provided notes. If the answer isn't in the notes, say so.

NOTES FROM STUDENT'S DOCUMENT:
${contextText}

QUESTION: ${question}

INSTRUCTIONS:
- Answer ONLY from the provided notes
- Quote relevant parts when helpful
- If not found in notes, clearly state that
- Be helpful and educational

ANSWER:`;

    let response;
    if (AI_PROVIDER === 'gemini') {
      const result = await geminiModel.generateContent(prompt);
      response = result.response.text();
    } else {
      response = await ollamaLLM.invoke(prompt);
    }
    
    res.json({ 
      success: true, 
      data: { 
        response,
        ragUsed: true,
        chunksFound: ragContext.length,
        relevance: ragContext[0]?.similarity?.toFixed(3)
      } 
    });
  } catch (error) {
    console.error('RAG chat error:', error.message);
    next(error);
  }
});

export default router;
