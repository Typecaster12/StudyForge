import express from 'express';
import { handleChat } from '../controllers/chat.js';

const router = express.Router();

// POST /api/chat - Chat with document (RAG)
router.post('/', handleChat);

export default router;
