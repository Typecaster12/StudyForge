import { pgTable, text, timestamp, integer, uuid, jsonb, customType, uniqueIndex, boolean, real } from 'drizzle-orm/pg-core';

// Custom type for pgvector
const vector = customType({
    dataType() {
        return 'vector(768)'; // nomic-embed-text typically uses 768 dimensions
    },
    toDriver(value) {
        return JSON.stringify(value);
    },
    fromDriver(value) {
        return JSON.parse(value);
    },
});

// ==================== USERS ====================
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    password: text('password').notNull(),
    role: text('role').default('student').notNull(), // 'student', 'teacher'
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at').defaultNow(),
    lastLogin: timestamp('last_login').defaultNow(),
    upgradedAt: timestamp('upgraded_at'),
});

// ==================== SUBJECTS ====================
export const subjects = pgTable('subjects', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    name: text('name').notNull(),
    description: text('description'),
    color: text('color').default('#3B82F6'), // Tailwind blue-500
    icon: text('icon').default('📚'),
    documentId: uuid('document_id').references(() => documents.id, { onDelete: 'set null' }),
    syllabusData: jsonb('syllabus_data'), // Store generated syllabus
    totalTopics: integer('total_topics').default(0),
    completedTopics: integer('completed_topics').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ==================== TOPICS ====================
export const topics = pgTable('topics', {
    id: uuid('id').defaultRandom().primaryKey(),
    subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
    unitIndex: integer('unit_index').notNull(),
    topicIndex: integer('topic_index').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status').default('not_started'), // 'not_started', 'in_progress', 'completed'
    difficulty: text('difficulty').default('medium'), // 'easy', 'medium', 'hard'
    estimatedMinutes: integer('estimated_minutes').default(30),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow(),
});

// ==================== QUIZZES ====================
export const quizzes = pgTable('quizzes', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'cascade' }),
    topicId: uuid('topic_id').references(() => topics.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    difficulty: text('difficulty').default('medium'),
    questions: jsonb('questions').notNull(), // Array of quiz questions
    totalQuestions: integer('total_questions').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

// ==================== QUIZ RESULTS ====================
export const quizResults = pgTable('quiz_results', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    quizId: uuid('quiz_id').references(() => quizzes.id, { onDelete: 'cascade' }).notNull(),
    score: integer('score').notNull(),
    totalQuestions: integer('total_questions').notNull(),
    percentage: real('percentage').notNull(),
    timeTaken: integer('time_taken'), // in seconds
    answers: jsonb('answers'), // User's answers for review
    createdAt: timestamp('created_at').defaultNow(),
});

// ==================== FLASHCARD DECKS ====================
export const flashcardDecks = pgTable('flashcard_decks', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'cascade' }),
    topicId: uuid('topic_id').references(() => topics.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    description: text('description'),
    totalCards: integer('total_cards').default(0),
    createdAt: timestamp('created_at').defaultNow(),
});

// ==================== FLASHCARDS ====================
export const flashcards = pgTable('flashcards', {
    id: uuid('id').defaultRandom().primaryKey(),
    deckId: uuid('deck_id').references(() => flashcardDecks.id, { onDelete: 'cascade' }).notNull(),
    front: text('front').notNull(),
    back: text('back').notNull(),
    hint: text('hint'),
    difficulty: text('difficulty').default('medium'),
    timesReviewed: integer('times_reviewed').default(0),
    timesCorrect: integer('times_correct').default(0),
    lastReviewed: timestamp('last_reviewed'),
    nextReview: timestamp('next_review'),
    createdAt: timestamp('created_at').defaultNow(),
});

// ==================== STUDY SESSIONS ====================
export const studySessions = pgTable('study_sessions', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
    topicId: uuid('topic_id').references(() => topics.id, { onDelete: 'set null' }),
    activityType: text('activity_type').notNull(), // 'quiz', 'flashcard', 'reading', 'chat'
    durationMinutes: integer('duration_minutes').default(0),
    notes: text('notes'),
    startedAt: timestamp('started_at').defaultNow(),
    endedAt: timestamp('ended_at'),
});

// ==================== CHAT HISTORY ====================
export const chatHistory = pgTable('chat_history', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'cascade' }),
    role: text('role').notNull(), // 'user', 'assistant'
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

// ==================== DOCUMENTS (existing, updated) ====================
export const documents = pgTable('documents', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type').default('pdf'),
    size: integer('size'),
    originalText: text('original_text'), // Store extracted text
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ==================== EMBEDDINGS (existing) ====================
export const embeddings = pgTable('embeddings', {
    id: uuid('id').defaultRandom().primaryKey(),
    docId: uuid('doc_id').references(() => documents.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    embedding: vector('embedding'),
    createdAt: timestamp('created_at').defaultNow(),
});

// ==================== GENERATED CONTENT (existing) ====================
export const generatedContent = pgTable('generated_content', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    docId: uuid('doc_id').references(() => documents.id, { onDelete: 'cascade' }),
    subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // 'syllabus', 'quiz', 'flashcards', 'explanation'
    content: jsonb('content').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

// ==================== STUDY PROGRESS (existing, updated) ====================
export const studyProgress = pgTable('study_progress', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'cascade' }),
    topicId: uuid('topic_id').references(() => topics.id, { onDelete: 'cascade' }),
    contentId: uuid('content_id').references(() => generatedContent.id, { onDelete: 'cascade' }),
    status: text('status').default('pending'), // 'pending', 'started', 'completed'
    score: integer('score'),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
    return {
        contentIdIdx: uniqueIndex('content_id_idx').on(table.contentId),
    };
});

// ==================== WEAK TOPICS ====================
export const weakTopics = pgTable('weak_topics', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
    topicId: uuid('topic_id').references(() => topics.id, { onDelete: 'cascade' }),
    topicName: text('topic_name').notNull(),
    incorrectCount: integer('incorrect_count').default(1),
    lastIncorrect: timestamp('last_incorrect').defaultNow(),
    isResolved: boolean('is_resolved').default(false),
    createdAt: timestamp('created_at').defaultNow(),
});

