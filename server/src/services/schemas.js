import { z } from 'zod';

// Schema for a single quiz question
export const QuizQuestionSchema = z.object({
  question: z.string().min(10, 'Question must be at least 10 characters'),
  options: z.array(z.string()).length(4, 'Must have exactly 4 options'),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(10, 'Explanation must be at least 10 characters'),
});

// Schema for a complete quiz
export const QuizSchema = z.object({
  title: z.string().optional(),
  questions: z.array(QuizQuestionSchema).min(1, 'Must have at least 1 question'),
});

// Schema for a single flashcard
export const FlashcardSchema = z.object({
  term: z.string().min(2, 'Term must be at least 2 characters'),
  definition: z.string().min(5, 'Definition must be at least 5 characters'),
  example: z.string().optional().nullable(),
});

// Schema for flashcard deck
export const FlashcardDeckSchema = z.object({
  title: z.string().optional(),
  cards: z.array(FlashcardSchema).min(1, 'Must have at least 1 flashcard'),
});

// Schema for syllabus topic
export const TopicSchema = z.object({
  title: z.string().min(2),
  subtopics: z.array(z.lazy(() => TopicSchema)).optional(),
});

// Schema for syllabus
export const SyllabusSchema = z.object({
  title: z.string().optional(),
  chapters: z.array(
    z.object({
      title: z.string().min(2),
      topics: z.array(TopicSchema),
    })
  ).min(1, 'Must have at least 1 chapter'),
});

/**
 * Validate and parse quiz data
 * @param {any} data - Data to validate
 * @returns {Object} - Parsed quiz object
 * @throws {Error} - If validation fails
 */
export function validateQuiz(data) {
  try {
    return QuizSchema.parse(data);
  } catch (error) {
    throw new Error(`Quiz validation failed: ${error.message}`);
  }
}

/**
 * Validate and parse flashcard deck data
 * @param {any} data - Data to validate
 * @returns {Object} - Parsed flashcard deck object
 * @throws {Error} - If validation fails
 */
export function validateFlashcardDeck(data) {
  try {
    return FlashcardDeckSchema.parse(data);
  } catch (error) {
    throw new Error(`Flashcard deck validation failed: ${error.message}`);
  }
}

/**
 * Validate and parse syllabus data
 * @param {any} data - Data to validate
 * @returns {Object} - Parsed syllabus object
 * @throws {Error} - If validation fails
 */
export function validateSyllabus(data) {
  try {
    return SyllabusSchema.parse(data);
  } catch (error) {
    throw new Error(`Syllabus validation failed: ${error.message}`);
  }
}
