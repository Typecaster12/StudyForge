import express from 'express';

const router = express.Router();

// POST /api/chat - Chat with document
router.post('/', async (req, res, next) => {
  try {
    // TODO: Implement chat logic (Harsh's task)
    res.json({ message: 'Chat endpoint - to be implemented' });
  } catch (error) {
    next(error);
  }
});

export default router;
