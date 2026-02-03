import express from 'express';
import { saveProgress, getStats } from '../controllers/progress.js';

const router = express.Router();

// POST /api/progress - Save study progress
router.post('/', saveProgress);

// GET /api/progress/:docId - Get all progress for a document
router.get('/:docId', getStats);

export default router;
