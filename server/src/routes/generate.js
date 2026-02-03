import express from 'express';
import { generateSyllabus, generateQuiz, generateFlashcards } from '../services/generator.js';

const router = express.Router();

// POST /api/generate/syllabus - Generate syllabus from document
router.post('/syllabus', async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: { message: 'Content is required' }
      });
    }

    const syllabus = await generateSyllabus(content);
    res.json({ success: true, data: syllabus });
  } catch (error) {
    next(error);
  }
});

// POST /api/generate/quiz - Generate quiz from document
router.post('/quiz', async (req, res, next) => {
  try {
    const { content, topic, difficulty = 'medium', questionCount = 5 } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: { message: 'Content is required' }
      });
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({
        error: { message: 'Difficulty must be easy, medium, or hard' }
      });
    }

    const quiz = await generateQuiz(content, topic, difficulty, questionCount);
    res.json({ success: true, data: quiz });
  } catch (error) {
    next(error);
  }
});

// POST /api/generate/flashcards - Generate flashcards from document
router.post('/flashcards', async (req, res, next) => {
  try {
    const { content, cardCount = 10 } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: { message: 'Content is required' }
      });
    }

    const flashcards = await generateFlashcards(content, cardCount);
    res.json({ success: true, data: flashcards });
  } catch (error) {
    next(error);
  }
});

export default router;
