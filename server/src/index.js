import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'StudyForge server is running' });
});

// Routes will be added here
import uploadRoutes from './routes/upload.js';
import chatRoutes from './routes/chat.js';
import generateRoutes from './routes/generate.js';

app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/generate', generateRoutes);

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
