import express from 'express';
import jwt from 'jsonwebtoken';
import { eq, and, desc, sql, count, avg, gt } from 'drizzle-orm';
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

// Middleware to verify teacher role
async function requireTeacher(req, res, next) {
  const user = await getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ error: { message: 'Not authenticated' } });
  }
  if (user.role !== 'teacher') {
    return res.status(403).json({ error: { message: 'Teacher access required' } });
  }
  req.user = user;
  next();
}

/**
 * GET /api/teacher/students - Get all students (for teacher view)
 */
router.get('/students', requireTeacher, async (req, res, next) => {
  try {
    // Get all students (users with role 'student')
    const students = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        avatarUrl: schema.users.avatarUrl,
        lastLogin: schema.users.lastLogin,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(eq(schema.users.role, 'student'))
      .orderBy(desc(schema.users.lastLogin));

    // Get stats for each student
    const studentsWithStats = await Promise.all(students.map(async (student) => {
      // Count subjects
      const [subjectsResult] = await db
        .select({ count: count() })
        .from(schema.subjects)
        .where(eq(schema.subjects.userId, student.id));

      // Count quizzes taken
      const [quizzesResult] = await db
        .select({ count: count() })
        .from(schema.quizResults)
        .where(eq(schema.quizResults.userId, student.id));

      // Average quiz score
      const [avgResult] = await db
        .select({ avgScore: avg(schema.quizResults.percentage) })
        .from(schema.quizResults)
        .where(eq(schema.quizResults.userId, student.id));

      // Count completed topics
      const [topicsResult] = await db
        .select({ 
          total: count(),
          completed: sql`count(*) filter (where ${schema.topics.status} = 'completed')`
        })
        .from(schema.topics)
        .innerJoin(schema.subjects, eq(schema.topics.subjectId, schema.subjects.id))
        .where(eq(schema.subjects.userId, student.id));

      return {
        ...student,
        stats: {
          subjectsCount: Number(subjectsResult?.count || 0),
          quizzesCompleted: Number(quizzesResult?.count || 0),
          averageScore: Math.round(Number(avgResult?.avgScore || 0)),
          topicsTotal: Number(topicsResult?.total || 0),
          topicsCompleted: Number(topicsResult?.completed || 0),
          progressPercentage: topicsResult?.total > 0 
            ? Math.round((Number(topicsResult.completed) / Number(topicsResult.total)) * 100)
            : 0,
        }
      };
    }));

    res.json({ success: true, data: studentsWithStats });
  } catch (error) {
    console.error('Get students error:', error);
    next(error);
  }
});

/**
 * GET /api/teacher/student/:studentId - Get detailed info for one student
 */
router.get('/student/:studentId', requireTeacher, async (req, res, next) => {
  try {
    const { studentId } = req.params;

    // Get student info
    const [student] = await db
      .select()
      .from(schema.users)
      .where(and(
        eq(schema.users.id, studentId),
        eq(schema.users.role, 'student')
      ))
      .limit(1);

    if (!student) {
      return res.status(404).json({ error: { message: 'Student not found' } });
    }

    // Get subjects with topics
    const studentSubjects = await db
      .select()
      .from(schema.subjects)
      .where(eq(schema.subjects.userId, studentId))
      .orderBy(desc(schema.subjects.updatedAt));

    // Get quiz results
    const quizResults = await db
      .select()
      .from(schema.quizResults)
      .innerJoin(schema.quizzes, eq(schema.quizResults.quizId, schema.quizzes.id))
      .where(eq(schema.quizResults.userId, studentId))
      .orderBy(desc(schema.quizResults.createdAt))
      .limit(20);

    // Get weak topics
    const weakTopics = await db
      .select()
      .from(schema.weakTopics)
      .where(and(
        eq(schema.weakTopics.userId, studentId),
        eq(schema.weakTopics.isResolved, false)
      ))
      .orderBy(desc(schema.weakTopics.incorrectCount))
      .limit(10);

    res.json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
          avatarUrl: student.avatarUrl,
          lastLogin: student.lastLogin,
          createdAt: student.createdAt,
        },
        subjects: studentSubjects,
        recentQuizzes: quizResults.map(r => ({
          id: r.quiz_results.id,
          quizTitle: r.quizzes.title,
          score: r.quiz_results.score,
          total: r.quiz_results.totalQuestions,
          percentage: r.quiz_results.percentage,
          date: r.quiz_results.createdAt,
        })),
        weakTopics: weakTopics.map(t => ({
          id: t.id,
          topicName: t.topicName,
          incorrectCount: t.incorrectCount,
          lastIncorrect: t.lastIncorrect,
        })),
      },
    });
  } catch (error) {
    console.error('Get student details error:', error);
    next(error);
  }
});

/**
 * GET /api/teacher/analytics - Get class-wide analytics
 */
router.get('/analytics', requireTeacher, async (req, res, next) => {
  try {
    // Total students
    const [studentsResult] = await db
      .select({ count: count() })
      .from(schema.users)
      .where(eq(schema.users.role, 'student'));

    // Active students (logged in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const [activeResult] = await db
      .select({ count: count() })
      .from(schema.users)
      .where(and(
        eq(schema.users.role, 'student'),
        gt(schema.users.lastLogin, sevenDaysAgo)
      ));

    // Average quiz score across all students
    const [avgScoreResult] = await db
      .select({ avgScore: avg(schema.quizResults.percentage) })
      .from(schema.quizResults)
      .innerJoin(schema.users, eq(schema.quizResults.userId, schema.users.id))
      .where(eq(schema.users.role, 'student'));

    // Total quizzes completed
    const [quizzesResult] = await db
      .select({ count: count() })
      .from(schema.quizResults)
      .innerJoin(schema.users, eq(schema.quizResults.userId, schema.users.id))
      .where(eq(schema.users.role, 'student'));

    // Subject distribution
    const subjects = await db
      .select({
        name: schema.subjects.name,
        count: count(),
      })
      .from(schema.subjects)
      .innerJoin(schema.users, eq(schema.subjects.userId, schema.users.id))
      .where(eq(schema.users.role, 'student'))
      .groupBy(schema.subjects.name)
      .orderBy(desc(count()))
      .limit(10);

    res.json({
      success: true,
      data: {
        totalStudents: Number(studentsResult?.count || 0),
        activeStudents: Number(activeResult?.count || 0),
        averageScore: Math.round(Number(avgScoreResult?.avgScore || 0)),
        totalQuizzes: Number(quizzesResult?.count || 0),
        subjectDistribution: subjects.map(s => ({
          name: s.name,
          studentCount: Number(s.count),
        })),
      },
    });
  } catch (error) {
    console.error('Get teacher analytics error:', error);
    next(error);
  }
});

/**
 * POST /api/teacher/create-subject - Create a subject for all students
 */
router.post('/create-subject', requireTeacher, async (req, res, next) => {
  try {
    const { name, description, color, icon } = req.body;

    if (!name) {
      return res.status(400).json({ error: { message: 'Subject name is required' } });
    }

    // Get all students
    const students = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.role, 'student'));

    if (students.length === 0) {
      return res.status(400).json({ error: { message: 'No students found' } });
    }

    // Create subject for each student
    const subjectsToCreate = students.map(student => ({
      userId: student.id,
      name: name,
      description: description || '',
      color: color || '#3B82F6',
      icon: icon || '📚',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const createdSubjects = await db
      .insert(schema.subjects)
      .values(subjectsToCreate)
      .returning();

    res.json({
      success: true,
      message: `Subject "${name}" created for ${students.length} students`,
      data: {
        studentsCount: students.length,
        subjectsCreated: createdSubjects.length,
      },
    });
  } catch (error) {
    console.error('Create subject for all students error:', error);
    next(error);
  }
});

export default router;
