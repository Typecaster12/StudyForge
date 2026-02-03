# ⚒️ StudyForge: Implementation Plan

**Project:** AI-Powered Privacy-First Study Companion  
**Stack:** Bun (Runtime), Express (Backend), React (Frontend), Supabase (DB + Vectors), Ollama (Local AI)  
**Goal:** Transform PDF study materials into interactive quizzes, flashcards, and structured syllabi.

---

## 🏗 Phase 0: Forge Setup & Architecture

**Goal:** Initialize the monorepo, configure the database, and set up the high-performance Bun runtime.

### [ ] 0.1. System Prerequisites

- [ ] Install Bun: `curl -fsSL https://bun.sh/install | bash`
- [ ] Install Ollama: `curl -fsSL https://ollama.com/install.sh | sh`
- [ ] Pull AI Models:
  - `ollama pull llama3` (for reasoning/chat)
  - `ollama pull nomic-embed-text` (for fast, high-quality embeddings)
- [ ] Supabase Setup:
  - Create a new project on Supabase.
  - Go to SQL Editor and run: `create extension if not exists vector;`
  - Copy your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

### [ ] 0.2. Monorepo Initialization

- [ ] Create root: `mkdir study-forge && cd study-forge`
- [ ] Init Bun: `bun init`
- [ ] Create workspace folders: `mkdir server client`
- [ ] Create `bunfig.toml` in root to manage workspace if needed (optional for simple mono-repos).

### [ ] 0.3. Backend Configuration (Express on Bun)

- [ ] `cd server` and `bun init`
- [ ] Install Core Dependencies:
  ```bash
  bun add express cors dotenv multer pdf-parse zod clsx express-rate-limit
  ```
- [ ] Install Database & AI Tools:
  ```bash
  bun add drizzle-orm postgres @langchain/community @langchain/core @langchain/ollama
  ```
- [ ] Install Dev Tools:
  ```bash
  bun add -d drizzle-kit @types/express @types/node biome @types/cors
  ```
- [ ] Create `.env` file:
  ```env
  PORT=3000
  DATABASE_URL=postgres://postgres:[YOUR-PASSWORD]@[YOUR-SUPABASE-URL]:5432/postgres
  OLLAMA_BASE_URL=http://localhost:11434
  ```

### [ ] 0.4. Frontend Configuration (Vite + React)

- [ ] `cd ../client`
- [ ] Create App: `bun create vite . --template react-ts`
- [ ] Install UI Dependencies:
  ```bash
  bun add axios react-router-dom lucide-react framer-motion clsx tailwind-merge sonner
  ```
- [ ] Install Styling:
  ```bash
  bun add -d tailwindcss postcss autoprefixer
  bunx tailwindcss init -p
  ```
- [ ] Configure `tailwind.config.js` with the "StudyForge" dark theme (Slate-950 background, Indigo-500 primary).

### [ ] 0.5. Database Schema (Drizzle ORM)

- [ ] Create `server/drizzle.config.ts`.
- [ ] Create `server/src/db/schema.ts`.
- [ ] Define Tables:
  - `documents`: id (uuid), filename, upload_date.
  - `embeddings`: id, document_id, content (text), embedding (vector 768).
  - `generated_content`: id, document_id, type (syllabus/quiz), data (json).
  - `study_progress`: id, document_id, type (quiz/flashcard), score (int), total (int), timestamp, metadata (json).
- [ ] Push Schema: `bun run drizzle-kit push`

---

## 🧠 Phase 1: The Knowledge Engine (Ingestion)

**Goal:** Create the pipeline that reads PDFs, understands them, and saves them to Supabase.

### [ ] 1.1. Server Scaffold

- [ ] Create `server/src/index.ts` with basic Express setup.
- [ ] Add Global Error Handler middleware.
- [ ] Add Rate Limiting middleware (prevent Ollama overload).
- [ ] Test run: `bun run --watch src/index.ts`.

### [ ] 1.2. PDF Ingestion Service

- [ ] Create `server/src/services/parser.ts`.
- [ ] Implement `pdf-parse` logic to extract raw text.
- [ ] Implement a `cleanText(raw)` utility to remove headers, footers, and page numbers.

### [ ] 1.3. Vector Service (The "Brain")

- [ ] Create `server/src/services/ai.ts`.
- [ ] Implement `getEmbeddings(text)` using `@langchain/ollama` (model: nomic-embed-text).
- [ ] Create `server/src/services/storage.ts`.
- [ ] Implement function `saveDocument(filename, text)`:
  - Split text into 1000-char chunks (overlap 200).
  - Generate embeddings for each chunk in parallel.
  - Batch insert into Supabase `embeddings` table.

### [ ] 1.4. Ingestion API Endpoint

- [ ] Create route `POST /api/upload`.
- [ ] Use `multer` to handle the file upload.
- [ ] Trigger the parsing -> embedding -> saving pipeline.
- [ ] Return `documentId` to the client.

---

## 💬 Phase 2: RAG & Interaction

**Goal:** Enable the "Chat with PDF" functionality.

### [ ] 2.1. Semantic Search Logic

- [ ] In `storage.ts`, implement `searchContext(query, docId)`.
- [ ] Use Drizzle `sql` operator to perform cosine similarity search:
  ```sql
  ORDER BY embedding <=> ${queryVector} LIMIT 5
  ```

### [ ] 2.2. Chat Controller

- [ ] Create `server/src/controllers/chat.ts`.
- [ ] Logic:
  - Receive user question.
  - `searchContext` to get relevant text chunks.
  - Build Prompt: "Answer using ONLY this context: ..."
  - Call Ollama (`llama3`) to generate answer.
- [ ] Implement Streaming Response (`res.write`) so the UI types out the answer in real-time.

---

## 🖥 Phase 3: Frontend Implementation

**Goal:** Build a sleek, "Glassmorphic" Dark Mode UI.

### [ ] 3.1. Infrastructure

- [ ] Create `client/src/lib/api.ts` (Axios instance).
- [ ] Create `client/src/store/studyStore.ts` (Zustand) to hold `currentDoc`, `chatHistory`.

### [ ] 3.2. Dashboard & Upload UI

- [ ] Create `components/Dropzone.tsx`: Large, dashed border area.
- [ ] Create `pages/Dashboard.tsx`:
  - Sidebar: List of uploaded documents.
  - Main Area: "Select a document to begin studying".

### [ ] 3.3. Study Interface

- [ ] Create `pages/StudyView.tsx`.
- [ ] Implement Tabs Layout: `[ Chat | Syllabus | Quiz | Flashcards ]`.
- [ ] Chat Component:
  - Message bubbles (User: Right/Blue, AI: Left/Gray).
  - Markdown rendering for AI responses (bolding, lists).

---

## 📚 Phase 4: Advanced Study Features

**Goal:** The "Forge" elements—turning raw info into study tools.

### [ ] 4.1. Auto-Syllabus Generator

- [ ] Backend: `POST /api/generate/syllabus`.
- [ ] Prompt: "Analyze this text and output a JSON object with a recursive array of Chapters -> Topics."
- [ ] Frontend: Render a collapsible Tree View of the topics.

### [ ] 4.2. Intelligent Quiz Engine

- [ ] Backend: `POST /api/generate/quiz`.
- [ ] Input: `topicName` + `difficulty`.
- [ ] Zod Schema: Validate that AI outputs strict JSON: `{ question, options[], answer, explanation }`.
- [ ] Frontend: `components/QuizCard.tsx`.
  - Show one question at a time.
  - Reveal explanation after selection.
  - Track score.

### [ ] 4.3. Flashcard Forge

- [ ] Backend: `POST /api/generate/flashcards`.
- [ ] Prompt: "Extract key terms and definitions."
- [ ] Frontend: `components/FlashcardDeck.tsx`.
  - Use `framer-motion` for 3D card flip animation.
  - "Know it" / "Don't know it" buttons to filter the deck.

---

## 🔧 Phase 5: Polish & Optimization

**Goal:** Make it production-ready for local use.

### [ ] 5.1. Performance Tuning & Caching
- [ ] Implement a per-user caching layer (API responses & DB query results).
- [ ] Cache AI-generated responses to reduce redundant LLM calls.
- [ ] Implement a robust LRU cache for vector search results.
- [ ] Ensure `nomic-embed-text` is used (much faster than Llama3 for embedding).

### [ ] 5.2. UI UX Polish

- [ ] Add Sonner toasts for success/error messages.
- [ ] Add Loading Skeletons while AI is thinking.
- [ ] Specific "Code Block" styling in chat for programming notes.

---

## 🤖 Copilot Prompts (Copy-Paste)

### For Database Schema:

> "Using Drizzle ORM and Postgres, define a schema for a 'documents' table and an 'embeddings' table. The embeddings table needs a column 'vector' of type vector(768). Export the types."

### For Vector Search:

> "Write a TypeScript function using Drizzle to query the 'embeddings' table. It should take a raw vector array, perform a cosine similarity search using the <=> operator, and return the top 5 matching text chunks."

### For Quiz Generation:

> "Create a Zod schema for a 'Quiz' object containing an array of questions. Each question has a string stem, 4 options, a correct index, and a short explanation. Then write a function to parse an AI string response using this schema."
