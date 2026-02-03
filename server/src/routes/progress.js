import express from 'express';
import { z } from 'zod';

const router = express.Router();

// In-memory storage for now (Harsh will replace with database)
const progressStore = new Map();

// Schema for saving progress
const ProgressSchema = z.object({
  documentId: z.string().uuid(),
  type: z.enum(['quiz', 'flashcard']),
  score: z.number().int().min(0),
  total: z.number().int().min(1),
  metadata: z.object({
    timeSpent: z.number().optional(), // seconds
    difficulty: z.string().optional(),
    wrongAnswers: z.array(z.number()).optional(),
  }).optional(),
});

/**
 * POST /api/progress/save - Save study progress
 */
router.post('/save', async (req, res, next) => {
  try {
    const data = ProgressSchema.parse(req.body);
    
    const progressEntry = {
      ...data,
      timestamp: new Date().toISOString(),
      id: `${data.documentId}_${data.type}_${Date.now()}`,
    };

    // Store progress
    if (!progressStore.has(data.documentId)) {
      progressStore.set(data.documentId, []);
    }
    progressStore.get(data.documentId).push(progressEntry);

    console.log(`💾 Progress saved: ${data.type} - ${data.score}/${data.total}`);

    res.json({
      success: true,
      message: 'Progress saved successfully',
      data: progressEntry,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: { message: 'Invalid progress data', details: error.errors },
      });
    }
    next(error);
  }
});

/**
 * GET /api/progress/:documentId - Get all progress for a document
 */
router.get('/:documentId', async (req, res, next) => {
  try {
    const { documentId } = req.params;

    const progress = progressStore.get(documentId) || [];

    // Calculate statistics
    const quizProgress = progress.filter(p => p.type === 'quiz');
    const flashcardProgress = progress.filter(p => p.type === 'flashcard');

    const stats = {
      documentId,
      totalSessions: progress.length,
      quiz: {
        sessions: quizProgress.length,
        averageScore: quizProgress.length > 0
          ? (quizProgress.reduce((sum, p) => sum + (p.score / p.total), 0) / quizProgress.length * 100).toFixed(1)
          : 0,
        totalQuestions: quizProgress.reduce((sum, p) => sum + p.total, 0),
        correctAnswers: quizProgress.reduce((sum, p) => sum + p.score, 0),
      },
      flashcard: {
        sessions: flashcardProgress.length,
        totalCards: flashcardProgress.reduce((sum, p) => sum + p.total, 0),
        knownCards: flashcardProgress.reduce((sum, p) => sum + p.score, 0),
      },
      history: progress.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      ).slice(0, 10), // Last 10 sessions
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/progress/stats/overall - Get overall statistics across all documents
 */
router.get('/stats/overall', async (req, res, next) => {
  try {
    let allProgress = [];
    for (const progress of progressStore.values()) {
      allProgress = allProgress.concat(progress);
    }

    const totalQuizzes = allProgress.filter(p => p.type === 'quiz').length;
    const totalFlashcards = allProgress.filter(p => p.type === 'flashcard').length;
    const totalTimeSpent = allProgress.reduce((sum, p) => 
      sum + (p.metadata?.timeSpent || 0), 0
    );

    const stats = {
      totalDocuments: progressStore.size,
      totalSessions: allProgress.length,
      totalQuizzes,
      totalFlashcards,
      totalTimeSpent: Math.round(totalTimeSpent / 60), // minutes
      recentActivity: allProgress
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5),
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/progress/:documentId - Clear progress for a document
 */
router.delete('/:documentId', async (req, res, next) => {
  try {
    const { documentId } = req.params;
    
    if (progressStore.has(documentId)) {
      progressStore.delete(documentId);
      console.log(`🗑️  Progress cleared for document: ${documentId}`);
      res.json({ success: true, message: 'Progress cleared successfully' });
    } else {
      res.status(404).json({ error: { message: 'Document not found' } });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
