import { Ollama } from '@langchain/ollama';
import { validateQuiz, validateFlashcardDeck, validateSyllabus } from './schemas.js';
import dotenv from 'dotenv';

dotenv.config();

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

// Initialize Ollama LLM (qwen3:8b for reasoning/generation)
const llm = new Ollama({
  model: 'qwen3:8b',
  baseUrl: OLLAMA_BASE_URL,
  temperature: 0.7,
});

/**
 * Generate a syllabus from document content
 * @param {string} content - Document content
 * @returns {Promise<Object>} - Structured syllabus object
 */
export async function generateSyllabus(content) {
  try {
    console.log('📚 Generating syllabus...');

    const prompt = `Analyze the following educational content and create a structured syllabus.

Content:
${content}

Generate a JSON object with the following structure:
{
  "title": "Course/Document Title",
  "chapters": [
    {
      "title": "Chapter Title",
      "topics": [
        {
          "title": "Topic Title",
          "subtopics": [
            { "title": "Subtopic Title" }
          ]
        }
      ]
    }
  ]
}

IMPORTANT:
- Return ONLY valid JSON, no other text
- Extract the main themes as chapters
- Break down each chapter into topics
- Include subtopics where appropriate
- Be comprehensive but concise`;

    const response = await llm.invoke(prompt);
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7, -3).trim();
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3, -3).trim();
    }

    const parsed = JSON.parse(jsonStr);
    const validated = validateSyllabus(parsed);

    console.log('✅ Syllabus generated successfully');
    return validated;
  } catch (error) {
    console.error('Error generating syllabus:', error.message);
    throw new Error(`Failed to generate syllabus: ${error.message}`);
  }
}

/**
 * Generate quiz questions from document content
 * @param {string} content - Document content
 * @param {string} topic - Specific topic (optional)
 * @param {string} difficulty - easy, medium, or hard
 * @param {number} questionCount - Number of questions to generate
 * @returns {Promise<Object>} - Quiz object with questions
 */
export async function generateQuiz(content, topic = null, difficulty = 'medium', questionCount = 5) {
  try {
    console.log(`📝 Generating ${difficulty} quiz with ${questionCount} questions...`);

    const topicText = topic ? `Focus on the topic: "${topic}".` : '';

    const prompt = `Create a ${difficulty} difficulty quiz from the following content. ${topicText}

Content:
${content}

Generate a JSON object with the following structure:
{
  "title": "Quiz Title",
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Detailed explanation of why this answer is correct"
    }
  ]
}

IMPORTANT:
- Return ONLY valid JSON, no other text
- Generate exactly ${questionCount} questions
- Each question must have exactly 4 options
- correctIndex is 0-3 (index of the correct option)
- Questions should test understanding, not just memorization
- Explanations should be clear and educational
- Difficulty: ${difficulty}`;

    const response = await llm.invoke(prompt);
    
    // Extract JSON from response
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7, -3).trim();
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3, -3).trim();
    }

    const parsed = JSON.parse(jsonStr);
    const validated = validateQuiz(parsed);

    console.log(`✅ Generated ${validated.questions.length} quiz questions`);
    return validated;
  } catch (error) {
    console.error('Error generating quiz:', error.message);
    throw new Error(`Failed to generate quiz: ${error.message}`);
  }
}

/**
 * Generate flashcards from document content
 * @param {string} content - Document content
 * @param {number} cardCount - Number of flashcards to generate
 * @returns {Promise<Object>} - Flashcard deck object
 */
export async function generateFlashcards(content, cardCount = 10) {
  try {
    console.log(`🎴 Generating ${cardCount} flashcards...`);

    const prompt = `Extract key terms and concepts from the following content and create flashcards for studying.

Content:
${content}

Generate a JSON object with the following structure:
{
  "title": "Flashcard Deck Title",
  "cards": [
    {
      "term": "Key Term or Concept",
      "definition": "Clear, concise definition",
      "example": "Optional example or use case"
    }
  ]
}

IMPORTANT:
- Return ONLY valid JSON, no other text
- Generate approximately ${cardCount} flashcards
- Focus on the most important concepts
- Definitions should be clear and concise
- Include examples where they add value
- Cover different aspects of the content`;

    const response = await llm.invoke(prompt);
    
    // Extract JSON from response
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7, -3).trim();
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3, -3).trim();
    }

    const parsed = JSON.parse(jsonStr);
    const validated = validateFlashcardDeck(parsed);

    console.log(`✅ Generated ${validated.cards.length} flashcards`);
    return validated;
  } catch (error) {
    console.error('Error generating flashcards:', error.message);
    throw new Error(`Failed to generate flashcards: ${error.message}`);
  }
}
