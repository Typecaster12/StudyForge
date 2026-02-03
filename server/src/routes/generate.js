import express from 'express';
import {
  generateSyllabus,
  generateQuiz,
  generateFlashcards,
  generateSyllabusStream,
  generateSyllabusFromPDF,
  generateExamRevision,
  generateRapidQuiz,
  generateYouTubeQueries,
  generateStudyPlan,
  getSettings,
  updateSettings
} from '../services/generator.js';
import { cacheMiddleware } from '../services/cache.js';

const router = express.Router();

// GET /api/generate/settings - Get current settings
router.get('/settings', (req, res) => {
  const settings = getSettings();
  res.json({ success: true, data: settings });
});

// POST /api/generate/settings - Update settings
router.post('/settings', (req, res) => {
  const updates = req.body;
  const settings = updateSettings(updates);
  res.json({ success: true, data: settings });
});

// POST /api/generate/syllabus - Generate syllabus from document
router.post('/syllabus', cacheMiddleware(3600), async (req, res, next) => {
  try {
    const { content, stream = false } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: { message: 'Content is required' }
      });
    }

    // Handle streaming request
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const syllabus = await generateSyllabusStream(content, (chunk) => {
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
      });

      res.write(`data: ${JSON.stringify({ type: 'done', data: syllabus })}\n\n`);
      res.end();
    } else {
      const syllabus = await generateSyllabus(content);
      res.json({ success: true, data: syllabus });
    }
  } catch (error) {
    if (req.body.stream) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
      res.end();
    } else {
      next(error);
    }
  }
});

// POST /api/generate/syllabus-from-pdf - Generate enriched syllabus from PDF
router.post('/syllabus-from-pdf', async (req, res, next) => {
  try {
    const { content, subjectName } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: { message: 'Content is required' }
      });
    }

    console.log(`📚 Generating syllabus from PDF for: ${subjectName || 'Unknown Subject'}`);
    const syllabus = await generateSyllabusFromPDF(content, subjectName);
    res.json({ success: true, data: syllabus });
  } catch (error) {
    next(error);
  }
});

// POST /api/generate/quiz - Generate quiz from document
router.post('/quiz', cacheMiddleware(3600), async (req, res, next) => {
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

// POST /api/generate/rapid-quiz - Generate harder quiz for exam prep
router.post('/rapid-quiz', async (req, res, next) => {
  try {
    const { topics, content, questionCount = 10 } = req.body;

    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({
        error: { message: 'Topics array is required' }
      });
    }

    console.log(`⚡ Generating rapid quiz for ${topics.length} topics`);
    const quiz = await generateRapidQuiz(topics, content, questionCount);
    res.json({ success: true, data: quiz });
  } catch (error) {
    next(error);
  }
});

// POST /api/generate/flashcards - Generate flashcards from document
router.post('/flashcards', cacheMiddleware(3600), async (req, res, next) => {
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

// POST /api/generate/exam-revision - Generate compressed exam revision
router.post('/exam-revision', async (req, res, next) => {
  try {
    const { topics, content, timeAvailable = 60 } = req.body;

    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({
        error: { message: 'Topics array is required' }
      });
    }

    console.log(`📝 Generating exam revision for ${topics.length} topics, ${timeAvailable} mins available`);
    const revision = await generateExamRevision(topics, content, timeAvailable);
    res.json({ success: true, data: revision });
  } catch (error) {
    next(error);
  }
});

// POST /api/generate/youtube-queries - Generate YouTube search queries
router.post('/youtube-queries', async (req, res, next) => {
  try {
    const { topics, subject } = req.body;

    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({
        error: { message: 'Topics array is required' }
      });
    }

    console.log(`🎬 Generating YouTube queries for ${topics.length} topics`);
    const queries = await generateYouTubeQueries(topics, subject);
    res.json({ success: true, data: queries });
  } catch (error) {
    next(error);
  }
});

// POST /api/generate/study-plan - Generate personalized study plan
router.post('/study-plan', async (req, res, next) => {
  try {
    const { topics, examDate, dailyStudyHours = 3, weakTopics = [] } = req.body;

    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({
        error: { message: 'Topics array is required' }
      });
    }

    if (!examDate) {
      return res.status(400).json({
        error: { message: 'Exam date is required' }
      });
    }

    console.log(`📅 Generating study plan for ${topics.length} topics, exam on ${examDate}`);
    const plan = await generateStudyPlan(topics, examDate, dailyStudyHours, weakTopics);
    res.json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
});

export default router;
