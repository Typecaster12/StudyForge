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
 * GET /api/flashcards/decks - Get all flashcard decks for current user
 */
router.get('/decks', async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    const userDecks = await db
      .select()
      .from(schema.flashcardDecks)
      .where(eq(schema.flashcardDecks.userId, user.id))
      .orderBy(desc(schema.flashcardDecks.createdAt));

    res.json({
      success: true,
      data: userDecks,
    });
  } catch (error) {
    console.error('Get flashcard decks error:', error);
    next(error);
  }
});

/**
 * GET /api/flashcards/decks/:id - Get a deck with its cards
 */
router.get('/decks/:id', async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    const [deck] = await db
      .select()
      .from(schema.flashcardDecks)
      .where(and(
        eq(schema.flashcardDecks.id, req.params.id),
        eq(schema.flashcardDecks.userId, user.id)
      ))
      .limit(1);

    if (!deck) {
      return res.status(404).json({ error: { message: 'Deck not found' } });
    }

    // Get cards in this deck
    const cards = await db
      .select()
      .from(schema.flashcards)
      .where(eq(schema.flashcards.deckId, deck.id))
      .orderBy(schema.flashcards.createdAt);

    res.json({
      success: true,
      data: {
        ...deck,
        cards,
      },
    });
  } catch (error) {
    console.error('Get deck error:', error);
    next(error);
  }
});

/**
 * POST /api/flashcards/decks - Create a new deck with cards
 */
router.post('/decks', async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    const { title, description, subjectId, topicId, cards } = req.body;

    if (!title) {
      return res.status(400).json({ error: { message: 'Title is required' } });
    }

    const [newDeck] = await db
      .insert(schema.flashcardDecks)
      .values({
        userId: user.id,
        subjectId: subjectId || null,
        topicId: topicId || null,
        title,
        description,
        totalCards: cards?.length || 0,
      })
      .returning();

    // Insert cards if provided
    if (cards && Array.isArray(cards) && cards.length > 0) {
      const cardsToInsert = cards.map(card => ({
        deckId: newDeck.id,
        front: card.front || card.term || card.question,
        back: card.back || card.definition || card.answer,
        hint: card.hint || card.example,
        difficulty: card.difficulty || 'medium',
      }));

      await db.insert(schema.flashcards).values(cardsToInsert);
    }

    console.log(`🃏 New flashcard deck saved: ${title} with ${cards?.length || 0} cards`);

    res.status(201).json({
      success: true,
      data: newDeck,
    });
  } catch (error) {
    console.error('Create deck error:', error);
    next(error);
  }
});

/**
 * DELETE /api/flashcards/decks/:id - Delete a deck
 */
router.delete('/decks/:id', async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    const [existingDeck] = await db
      .select()
      .from(schema.flashcardDecks)
      .where(and(
        eq(schema.flashcardDecks.id, req.params.id),
        eq(schema.flashcardDecks.userId, user.id)
      ))
      .limit(1);

    if (!existingDeck) {
      return res.status(404).json({ error: { message: 'Deck not found' } });
    }

    await db
      .delete(schema.flashcardDecks)
      .where(eq(schema.flashcardDecks.id, req.params.id));

    res.json({
      success: true,
      message: 'Deck deleted successfully',
    });
  } catch (error) {
    console.error('Delete deck error:', error);
    next(error);
  }
});

/**
 * PATCH /api/flashcards/cards/:id/review - Update card review stats
 */
router.patch('/cards/:id/review', async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    const { correct } = req.body;

    // Get the card and verify ownership through deck
    const [card] = await db
      .select()
      .from(schema.flashcards)
      .where(eq(schema.flashcards.id, req.params.id))
      .limit(1);

    if (!card) {
      return res.status(404).json({ error: { message: 'Card not found' } });
    }

    // Verify ownership
    const [deck] = await db
      .select()
      .from(schema.flashcardDecks)
      .where(and(
        eq(schema.flashcardDecks.id, card.deckId),
        eq(schema.flashcardDecks.userId, user.id)
      ))
      .limit(1);

    if (!deck) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    // Calculate next review time (spaced repetition)
    const now = new Date();
    let nextReview;
    const interval = card.timesCorrect || 1;
    
    if (correct) {
      // Increase interval exponentially for correct answers
      nextReview = new Date(now.getTime() + (interval * 24 * 60 * 60 * 1000)); // days
    } else {
      // Reset to soon for incorrect answers
      nextReview = new Date(now.getTime() + (10 * 60 * 1000)); // 10 minutes
    }

    const [updatedCard] = await db
      .update(schema.flashcards)
      .set({
        timesReviewed: (card.timesReviewed || 0) + 1,
        timesCorrect: correct ? (card.timesCorrect || 0) + 1 : card.timesCorrect || 0,
        lastReviewed: now,
        nextReview,
      })
      .where(eq(schema.flashcards.id, req.params.id))
      .returning();

    res.json({
      success: true,
      data: updatedCard,
    });
  } catch (error) {
    console.error('Review card error:', error);
    next(error);
  }
});

/**
 * GET /api/flashcards/due - Get cards due for review
 */
router.get('/due', async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    // Get user's decks
    const userDecks = await db
      .select()
      .from(schema.flashcardDecks)
      .where(eq(schema.flashcardDecks.userId, user.id));

    if (userDecks.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const deckIds = userDecks.map(d => d.id);
    const now = new Date();

    // Get cards that are due or have never been reviewed
    const dueCards = await db
      .select()
      .from(schema.flashcards)
      .where(eq(schema.flashcards.deckId, deckIds[0])) // TODO: Use inArray when available
      .orderBy(schema.flashcards.nextReview);

    const filteredCards = dueCards.filter(card => 
      !card.nextReview || new Date(card.nextReview) <= now
    );

    res.json({
      success: true,
      data: filteredCards.slice(0, 20), // Limit to 20 cards per session
    });
  } catch (error) {
    console.error('Get due cards error:', error);
    next(error);
  }
});

export default router;
