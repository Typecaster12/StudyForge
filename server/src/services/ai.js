import { OllamaEmbeddings } from '@langchain/ollama';
import dotenv from 'dotenv';

dotenv.config();

const OLLAMA_URL = process.env.OLLAMA_URL || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

const embeddings = new OllamaEmbeddings({
  model: 'nomic-embed-text',
  baseUrl: OLLAMA_URL,
});

/**
 * Generates embeddings for a single string of text.
 * @param {string} text 
 * @returns {Promise<number[]>}
 */
export async function getEmbeddings(text) {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }
    return await embeddings.embedQuery(text);
  } catch (error) {
    console.error('Error generating embeddings:', error.message);
    throw new Error(`Failed to generate AI embeddings: ${error.message}`);
  }
}

/**
 * Generates embeddings for multiple chunks of text in batch.
 * @param {string[]} texts 
 * @returns {Promise<number[][]>}
 */
export async function getBatchEmbeddings(texts) {
  try {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('Texts must be a non-empty array');
    }

    const validTexts = texts.filter(t => t && t.trim().length > 0);
    if (validTexts.length === 0) {
      throw new Error('No valid texts to embed');
    }

    console.log(`📊 Generating embeddings for ${validTexts.length} chunks...`);
    const startTime = Date.now();

    const results = await embeddings.embedDocuments(validTexts);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Generated ${results.length} embeddings in ${duration}s`);

    return results;
  } catch (error) {
    console.error('Error generating batch embeddings:', error.message);
    throw new Error(`Failed to generate batch AI embeddings: ${error.message}`);
  }
}

/**
 * Test Ollama connection
 * @returns {Promise<boolean>}
 */
export async function testOllamaConnection() {
  try {
    console.log(`🔌 Testing Ollama connection at ${OLLAMA_URL}...`);
    const testEmbedding = await getEmbeddings('test');
    console.log(`✅ Ollama connection successful! (Embedding dimension: ${testEmbedding.length})`);
    return true;
  } catch (error) {
    console.error(`❌ Ollama connection failed: ${error.message}`);
    return false;
  }
}
