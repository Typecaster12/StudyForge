import { db } from '../services/storage.js';
import * as schema from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

/**
 * Saves or updates study progress for a specific content.
 */
export async function saveProgress(req, res) {
    try {
        const { contentId, status, score } = req.body;

        if (!contentId) {
            return res.status(400).json({ error: 'contentId is required' });
        }

        const [progress] = await db.insert(schema.studyProgress).values({
            contentId,
            status: status || 'completed',
            score: score !== undefined ? score : null,
        }).onConflictDoUpdate({
            target: schema.studyProgress.contentId,
            set: {
                status: status || 'completed',
                score: score !== undefined ? score : null,
                updatedAt: new Date(),
            }
        }).returning();

        res.json(progress);
    } catch (error) {
        console.error('Save progress error:', error);
        res.status(500).json({ error: 'Failed to save progress', details: error.message });
    }
}

/**
 * Retrieves study statistics for a document.
 */
export async function getStats(req, res) {
    try {
        const { docId } = req.params;

        if (!docId) {
            return res.status(400).json({ error: 'docId is required' });
        }

        // Get all progress for this document's content
        const stats = await db.select({
            type: schema.generatedContent.type,
            status: schema.studyProgress.status,
            score: schema.studyProgress.score,
            updatedAt: schema.studyProgress.updatedAt,
        })
            .from(schema.studyProgress)
            .innerJoin(schema.generatedContent, eq(schema.studyProgress.contentId, schema.generatedContent.id))
            .where(eq(schema.generatedContent.docId, docId))
            .orderBy(desc(schema.studyProgress.updatedAt));

        res.json(stats);
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to retrieve statistics', details: error.message });
    }
}
