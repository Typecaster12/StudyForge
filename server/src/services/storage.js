import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from '../db/schema.js';
import { getBatchEmbeddings } from './ai.js';
import cache from './cache.js';
import dotenv from 'dotenv';

dotenv.config();

const client = postgres(process.env.DATABASE_URL, { ssl: 'require' });
export const db = drizzle(client, { schema });

/**
 * Splits text into chunks with overlap.
 * @param {string} text 
 * @param {number} size 
 * @param {number} overlap 
 * @returns {string[]}
 */
export function chunkText(text, size = 1000, overlap = 200) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
        const end = Math.min(start + size, text.length);
        chunks.push(text.slice(start, end));
        start += (size - overlap);
    }

    return chunks;
}

/**
 * Saves document metadata and its chunks to the database.
 * @param {string} name 
 * @param {string} content 
 * @returns {Promise<string>} docId
 */
export async function saveDocument(name, content) {
    try {
        // Insert document
        const [doc] = await db.insert(schema.documents).values({
            name,
            type: 'pdf',
        }).returning();

        const chunks = chunkText(content);

        // Generate embeddings for chunks
        console.log(`Generating embeddings for ${chunks.length} chunks...`);
        const vectors = await getBatchEmbeddings(chunks);

        if (chunks.length > 0) {
            await db.insert(schema.embeddings).values(
                chunks.map((chunk, index) => ({
                    docId: doc.id,
                    content: chunk,
                    embedding: vectors[index],
                }))
            );
        }

        return doc.id;
    } catch (error) {
        console.error('Error saving document:', error);
        throw new Error('Failed to save document to database');
    }
}

/**
 * Searches for relevant context chunks using vector similarity.
 * @param {number[]} queryEmbedding 
 * @param {string} docId 
 * @param {number} limit 
 * @returns {Promise<string[]>}
 */
export async function searchContext(queryEmbedding, docId, limit = 5) {
    try {
        const queryVector = JSON.stringify(queryEmbedding);
        const cacheKey = `search_${docId}_${queryVector}_${limit}`;

        const cachedResults = cache.get(cacheKey);
        if (cachedResults) {
            console.log(`⚡ Search cache hit for doc: ${docId}`);
            return cachedResults;
        }

        // Find chunks sorted by cosine similarity
        // Operator <=> is cosine distance, so smaller is more similar.
        const results = await db
            .select({
                content: schema.embeddings.content,
            })
            .from(schema.embeddings)
            .where(sql`${schema.embeddings.docId} = ${docId}`)
            .orderBy(sql`${schema.embeddings.embedding} <=> ${queryVector}`)
            .limit(limit);

        const contents = results.map(r => r.content);
        cache.set(cacheKey, contents, 1800); // Cache search for 30 mins

        return contents;
    } catch (error) {
        console.error('Error searching context:', error);
        throw new Error('Failed to search knowledge base');
    }
}

