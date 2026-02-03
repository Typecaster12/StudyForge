import { OllamaEmbeddings } from '@langchain/ollama';
import dotenv from 'dotenv';

dotenv.config();

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

// Initialize Ollama embeddings with nomic-embed-text model
const embeddings = new OllamaEmbeddings({
  model: 'nomic-embed-text',
  baseUrl: OLLAMA_BASE_URL,
});

/**
 * Generate embeddings for a single text string
 * @param {string} text - The text to generate embeddings for
 * @returns {Promise<number[]>} - Array of embedding values (768 dimensions)
 */
export async function getEmbedding(text) {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    const embedding = await embeddings.embedQuery(text);
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error.message);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Generate embeddings for multiple text chunks in parallel
 * @param {string[]} texts - Array of text chunks to embed
 * @returns {Promise<number[][]>} - Array of embedding arrays
 */
export async function getEmbeddings(texts) {
  try {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('Texts must be a non-empty array');
    }

    // Filter out empty texts
    const validTexts = texts.filter(t => t && t.trim().length > 0);
    
    if (validTexts.length === 0) {
      throw new Error('No valid texts to embed');
    }

    console.log(`📊 Generating embeddings for ${validTexts.length} chunks...`);
    const startTime = Date.now();

    // Generate embeddings in parallel
    const embeddingsArray = await embeddings.embedDocuments(validTexts);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Generated ${embeddingsArray.length} embeddings in ${duration}s`);

    return embeddingsArray;
  } catch (error) {
    console.error('Error generating embeddings:', error.message);
    throw new Error(`Failed to generate embeddings: ${error.message}`);
  }
}

/**
 * Split text into chunks for embedding
 * @param {string} text - The text to chunk
 * @param {number} chunkSize - Size of each chunk (default: 1000)
 * @param {number} overlap - Overlap between chunks (default: 200)
 * @returns {string[]} - Array of text chunks
 */
export function chunkText(text, chunkSize = 1000, overlap = 200) {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const chunks = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length);
    const chunk = text.slice(startIndex, endIndex).trim();
    
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Move forward by chunkSize minus overlap
    startIndex += chunkSize - overlap;

    // Break if we're at the end
    if (endIndex === text.length) {
      break;
    }
  }

  console.log(`📝 Split text into ${chunks.length} chunks (size: ${chunkSize}, overlap: ${overlap})`);
  return chunks;
}

/**
 * Test Ollama connection
 * @returns {Promise<boolean>} - True if connection successful
 */
export async function testOllamaConnection() {
  try {
    console.log(`🔌 Testing Ollama connection at ${OLLAMA_BASE_URL}...`);
    const testEmbedding = await getEmbedding('test');
    console.log(`✅ Ollama connection successful! (Embedding dimension: ${testEmbedding.length})`);
    return true;
  } catch (error) {
    console.error(`❌ Ollama connection failed: ${error.message}`);
    console.error('💡 Make sure Ollama is running and nomic-embed-text model is pulled');
    console.error('   Run: ollama pull nomic-embed-text');
    return false;
  }
}
