import { ChatOllama } from '@langchain/ollama';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { db } from './storage.js';
import * as schema from '../db/schema.js';
import dotenv from 'dotenv';

dotenv.config();

// Lazily initialize providers
let model;
let initialized = false;

function initializeProvider() {
  if (initialized) return;

  const AI_PROVIDER = process.env.AI_PROVIDER || 'ollama';
  const OLLAMA_URL = process.env.OLLAMA_URL || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (AI_PROVIDER === 'gemini') {
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not found');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    console.log('🤖 Using Gemini 2.0 Flash for generation');
  } else {
    model = new ChatOllama({
      model: 'llama3',
      baseUrl: OLLAMA_URL,
      temperature: 0.3,
    });
    console.log('🤖 Using Ollama (llama3) for generation');
  }
  initialized = true;
}

// --- Schemas ---

const syllabusSchema = z.object({
  chapters: z.array(z.object({
    title: z.string(),
    topics: z.array(z.string()),
    summary: z.string()
  }))
});

const quizSchema = z.object({
  questions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()).length(4),
    correctAnswer: z.string(),
    explanation: z.string()
  }))
});

const flashcardSchema = z.object({
  cards: z.array(z.object({
    term: z.string(),
    definition: z.string()
  }))
});

const syllabusParser = StructuredOutputParser.fromZodSchema(syllabusSchema);
const quizParser = StructuredOutputParser.fromZodSchema(quizSchema);
const flashcardParser = StructuredOutputParser.fromZodSchema(flashcardSchema);

// --- Core Helper ---

async function generateWithParser(promptTemplate, context, parser, docId, type, extraVars = {}) {
  initializeProvider();

  const prompt = new PromptTemplate({
    template: promptTemplate,
    inputVariables: ["context", ...Object.keys(extraVars)],
    partialVariables: { format_instructions: parser.getFormatInstructions() },
  });

  const input = await prompt.format({ context, ...extraVars });

  let content;
  if (process.env.AI_PROVIDER === 'gemini') {
    const result = await model.generateContent(input);
    content = result.response.text();
  } else {
    const response = await model.invoke(input);
    content = response.content;
  }

  const result = await parser.parse(content);
  await saveGeneratedContent(docId, type, result);
  return result;
}

// --- Functions ---

export async function generateSyllabus(docId, context) {
  return generateWithParser(
    "Analyze the following document context and create a structured study syllabus.\n{format_instructions}\nContext:\n{context}",
    context,
    syllabusParser,
    docId,
    'syllabus'
  );
}

export async function generateQuiz(docId, context, difficulty = 'medium', questionCount = 5) {
  return generateWithParser(
    "Based on the following document context, generate a multiple-choice quiz with {questionCount} questions at {difficulty} difficulty.\n{format_instructions}\nContext:\n{context}",
    context,
    quizParser,
    docId,
    'quiz',
    { difficulty, questionCount }
  );
}

export async function generateFlashcards(docId, context, cardCount = 10) {
  return generateWithParser(
    "Extract {cardCount} key terms and their definitions from the following document context into flashcards.\n{format_instructions}\nContext:\n{context}",
    context,
    flashcardParser,
    docId,
    'flashcards',
    { cardCount }
  );
}

async function saveGeneratedContent(docId, type, content) {
  await db.insert(schema.generatedContent).values({
    docId,
    type,
    content,
  });
}
