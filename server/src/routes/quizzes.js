import express from 'express';
import jwt from 'jsonwebtoken';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../services/storage.js';
import * as schema from '../db/schema.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to get user from token
async function getUserFromToken(req) {
  const token = req.cookies?.auth_token;
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, decoded.userId))
      .limit(1);
    return user;
  } catch {
    return null;
  }
}

/**
 * GET /api/quizzes - Get all quizzes for current user
 */
router.get('/', async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    const userQuizzes = await db
      .select()
      .from(schema.quizzes)
      .where(eq(schema.quizzes.userId, user.id))
      .orderBy(desc(schema.quizzes.createdAt));

    res.json({
      success: true,
      data: userQuizzes,
    });
  } catch (error) {
    console.error('Get quizzes error:', error);
    next(error);
  }
});

/**
 * GET /api/quizzes/:id - Get a single quiz
 */
router.get('/:id', async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    const [quiz] = await db
      .select()
      .from(schema.quizzes)
      .where(and(
        eq(schema.quizzes.id, req.params.id),
        eq(schema.quizzes.userId, user.id)
      ))
      .limit(1);

    if (!quiz) {
      return res.status(404).json({ error: { message: 'Quiz not found' } });
    }

    res.json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    next(error);
  }
});

/**
 * POST /api/quizzes - Save a new quiz
 */
router.post('/', async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    const { title, subjectId, topicId, difficulty, questions } = req.body;

    if (!title || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: { message: 'Title and questions are required' } });
    }

    const [newQuiz] = await db
      .insert(schema.quizzes)
      .values({
        userId: user.id,
        subjectId: subjectId || null,
        topicId: topicId || null,
        title,
        difficulty: difficulty || 'medium',
        questions,
        totalQuestions: questions.length,
      })
      .returning();

    console.log(`📝 New quiz saved: ${title} for user ${user.email}`);

    res.status(201).json({
      success: true,
      data: newQuiz,
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    next(error);
  }
});

/**
 * DELETE /api/quizzes/:id - Delete a quiz
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    const [existingQuiz] = await db
      .select()
      .from(schema.quizzes)
      .where(and(
        eq(schema.quizzes.id, req.params.id),
        eq(schema.quizzes.userId, user.id)
      ))
      .limit(1);

    if (!existingQuiz) {
      return res.status(404).json({ error: { message: 'Quiz not found' } });
    }

    await db
      .delete(schema.quizzes)
      .where(eq(schema.quizzes.id, req.params.id));

    res.json({
      success: true,
      message: 'Quiz deleted successfully',
    });
  } catch (error) {
    console.error('Delete quiz error:', error);
    next(error);
  }
});

/**
 * POST /api/quizzes/:id/results - Save quiz results
 */
router.post('/:id/results', async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    const { score, totalQuestions, timeTaken, answers } = req.body;

    // Verify quiz exists and belongs to user
    const [quiz] = await db
      .select()
      .from(schema.quizzes)
      .where(and(
        eq(schema.quizzes.id, req.params.id),
        eq(schema.quizzes.userId, user.id)
      ))
      .limit(1);

    if (!quiz) {
      return res.status(404).json({ error: { message: 'Quiz not found' } });
    }

    const percentage = (score / totalQuestions) * 100;

    const [result] = await db
      .insert(schema.quizResults)
      .values({
        userId: user.id,
        quizId: req.params.id,
        score,
        totalQuestions,
        percentage,
        timeTaken,
        answers,
      })
      .returning();

    // Track weak topics if score is below 70%
    if (percentage < 70 && quiz.topicId) {
      const [topic] = await db
        .select()
        .from(schema.topics)
        .where(eq(schema.topics.id, quiz.topicId))
        .limit(1);

      if (topic) {
        // Check if weak topic already exists
        const [existingWeakTopic] = await db
          .select()
          .from(schema.weakTopics)
          .where(and(
            eq(schema.weakTopics.userId, user.id),
            eq(schema.weakTopics.topicId, quiz.topicId),
            eq(schema.weakTopics.isResolved, false)
          ))
          .limit(1);

        if (existingWeakTopic) {
          await db
            .update(schema.weakTopics)
            .set({ 
              incorrectCount: existingWeakTopic.incorrectCount + 1,
              lastIncorrect: new Date()
            })
            .where(eq(schema.weakTopics.id, existingWeakTopic.id));
        } else {
          await db
            .insert(schema.weakTopics)
            .values({
              userId: user.id,
              subjectId: quiz.subjectId,
              topicId: quiz.topicId,
              topicName: topic.title,
            });
        }
      }
    }

    console.log(`✅ Quiz result saved: ${score}/${totalQuestions} (${percentage.toFixed(1)}%)`);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Save quiz result error:', error);
    next(error);
  }
});

/**
 * GET /api/quizzes/results/history - Get quiz result history
 */
router.get('/results/history', async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    const results = await db
      .select()
      .from(schema.quizResults)
      .where(eq(schema.quizResults.userId, user.id))
      .orderBy(desc(schema.quizResults.createdAt))
      .limit(50);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Get quiz history error:', error);
    next(error);
  }
});

export default router;
