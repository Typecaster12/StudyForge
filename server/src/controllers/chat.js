import { ChatOllama } from '@langchain/ollama';
import { getEmbeddings } from '../services/ai.js';
import { searchContext } from '../services/storage.js';
import dotenv from 'dotenv';

dotenv.config();

const chatModel = new ChatOllama({
    model: 'llama3',
    baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
    temperature: 0.1,
});

/**
 * Handles the RAG chat flow.
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
export async function handleChat(req, res) {
    try {
        const { message, docId } = req.body;

        if (!message || !docId) {
            return res.status(400).json({ error: 'Message and docId are required' });
        }

        console.log(`Generating embedding for query: "${message}"`);
        const queryEmbedding = await getEmbeddings(message);

        console.log(`Searching context for document: ${docId}`);
        const contextChunks = await searchContext(queryEmbedding, docId);
        const contextText = contextChunks.join('\n\n---\n\n');

        const prompt = `
            Answer the user's question using ONLY the provided context from the document.
            If the answer is not in the context, say "I don't have enough information from the document to answer that."
            Do not use your own knowledge outside of the document context.
            
            ### CONTEXT:
            ${contextText}
            
            ### USER QUESTION:
            ${message}
            
            ### ANSWER:
        `;

        // Set headers for streaming
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        console.log('Generating streaming response...');
        const stream = await chatModel.stream(prompt);

        for await (const chunk of stream) {
            res.write(chunk.content);
        }

        res.end();
    } catch (error) {
        console.error('Chat error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate response', details: error.message });
        } else {
            res.end('\n[Error occurred during generation]');
        }
    }
}
