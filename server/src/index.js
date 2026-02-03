import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting middleware - prevent Ollama overload
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true, // Allow cookies
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'StudyForge server is running' });
});

// Routes
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import chatRoutes from './routes/chat.js';
import generateRoutes from './routes/generate.js';
import progressRoutes from './routes/progress.js';
import teacherRoutes from './routes/teacher.js';
import subjectsRoutes from './routes/subjects.js';
import quizzesRoutes from './routes/quizzes.js';
import flashcardsRoutes from './routes/flashcards.js';

app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/quizzes', quizzesRoutes);
app.use('/api/flashcards', flashcardsRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      path: req.path,
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🔨 StudyForge server running on http://localhost:${PORT}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 Ollama URL: ${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}`);
});

export default app;
