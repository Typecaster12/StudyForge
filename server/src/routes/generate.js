import express from 'express';
import { db } from '../services/storage.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { generateSyllabus, generateQuiz, generateFlashcards } from '../services/generator.js';

const router = express.Router();

/**
 * Helper to get document content for context.
 */
async function getDocContext(docId) {
  const chunks = await db.select()
    .from(schema.embeddings)
    .where(eq(schema.embeddings.docId, docId))
    .limit(10); // Take first 10 chunks as context for generation

  return chunks.map(c => c.content).join('\n\n');
}

// POST /api/generate/syllabus - Generate syllabus from document
router.post('/syllabus', async (req, res, next) => {
  try {
    const { docId } = req.body;
    if (!docId) return res.status(400).json({ error: { message: 'docId is required' } });

    const context = await getDocContext(docId);
    if (!context) return res.status(404).json({ error: { message: 'Document content not found' } });

    const syllabus = await generateSyllabus(docId, context);
    res.json({ success: true, data: syllabus });
  } catch (error) {
    next(error);
  }
});

// POST /api/generate/quiz - Generate quiz from document
router.post('/quiz', async (req, res, next) => {
  try {
    const { docId, difficulty = 'medium', questionCount = 5 } = req.body;
    if (!docId) return res.status(400).json({ error: { message: 'docId is required' } });

    const context = await getDocContext(docId);
    if (!context) return res.status(404).json({ error: { message: 'Document content not found' } });

    const quiz = await generateQuiz(docId, context, difficulty, questionCount);
    res.json({ success: true, data: quiz });
  } catch (error) {
    next(error);
  }
});

// POST /api/generate/flashcards - Generate flashcards from document
router.post('/flashcards', async (req, res, next) => {
  try {
    const { docId, cardCount = 10 } = req.body;
    if (!docId) return res.status(400).json({ error: { message: 'docId is required' } });

    const context = await getDocContext(docId);
    if (!context) return res.status(404).json({ error: { message: 'Document content not found' } });

    const flashcards = await generateFlashcards(docId, context, cardCount);
    res.json({ success: true, data: flashcards });
  } catch (error) {
    next(error);
  }
});

export default router;
