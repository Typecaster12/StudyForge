import { pgTable, text, timestamp, integer, uuid, jsonb, customType, uniqueIndex } from 'drizzle-orm/pg-core';

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

export const documents = pgTable('documents', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    type: text('type').default('pdf'),
    size: integer('size'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const embeddings = pgTable('embeddings', {
    id: uuid('id').defaultRandom().primaryKey(),
    docId: uuid('doc_id').references(() => documents.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    embedding: vector('embedding'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const generatedContent = pgTable('generated_content', {
    id: uuid('id').defaultRandom().primaryKey(),
    docId: uuid('doc_id').references(() => documents.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // 'syllabus', 'quiz', 'flashcards'
    content: jsonb('content').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

export const studyProgress = pgTable('study_progress', {
    id: uuid('id').defaultRandom().primaryKey(),
    contentId: uuid('content_id').references(() => generatedContent.id, { onDelete: 'cascade' }),
    status: text('status').default('pending'), // 'pending', 'started', 'completed'
    score: integer('score'),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
    return {
        contentIdIdx: uniqueIndex('content_id_idx').on(table.contentId),
    };
});

