# 👥 StudyForge: Task Delegation

**Team Structure:**
- **Lead Developers:** Ameer & Harsh (Backend, Database, AI Integration)
- **Frontend Developers:** Saad & Sohail (UI/UX, Components, Styling)

---

## 🔴 Ameer (Lead Backend Developer)

### Phase 1.1: Server Scaffold
- [x] Create `server/src/index.js` with Express setup
- [x] Configure CORS, dotenv, express.json()
- [x] Add Global Error Handler middleware
- [x] Add Rate Limiting middleware (express-rate-limit)
- [x] Create router structure: `/api/upload`, `/api/chat`, `/api/generate`

### Phase 1.3: Vector Service (AI Integration)
- [x] Create `server/src/services/ai.js`
- [x] Implement `getEmbeddings(text)` using @langchain/ollama
- [x] Configure nomic-embed-text model
- [x] Implement batch embedding generation for chunks
- [x] Add error handling for Ollama connection failures

### Phase 4: Advanced Study Features (Backend)
- [x] `POST /api/generate/syllabus` - Analyze PDF → JSON chapters/topics
- [x] `POST /api/generate/quiz` - Generate quiz with Zod validation
- [x] `POST /api/generate/flashcards` - Extract terms & definitions
- [x] Implement Zod schemas for strict JSON validation
- [x] Add progress tracking endpoints (save scores, retrieve stats)

---

## 🔵 Harsh (Lead Backend Developer)

### Phase 0.5: Database Schema (Drizzle ORM)
- [x] Create `server/drizzle.config.ts`
- [x] Create `server/src/db/schema.js`
- [x] Define all tables (documents, embeddings, generated_content, study_progress)
- [x] Push schema to Neon: `bun run drizzle-kit push`
- [x] Test database connection

### Phase 1: Knowledge Engine (PDF Ingestion)
- [x] Create `server/src/services/parser.js` - PDF parsing logic
- [x] Implement `cleanText()` utility to remove headers/footers
- [x] Create `server/src/services/storage.js` - Database operations
- [x] Implement `saveDocument()` with chunking (1000 chars, 200 overlap)
- [x] Create API endpoint: `POST /api/upload` with Multer

### Phase 2: RAG & Chat System
- [x] Implement `searchContext(query, docId)` with vector similarity
- [x] Create `server/src/controllers/chat.js`
- [x] Build RAG prompt: "Answer using ONLY this context..."
- [x] Integrate Ollama LLM (llama3) for chat responses
- [x] Implement streaming response with `res.write()`

---

## 🟢 Saad (Frontend Developer)

### Phase 3.1: Infrastructure & Setup
- [ ] Create `client/src/lib/api.js` - Axios instance with base URL
- [ ] Configure Axios interceptors for error handling
- [ ] Set up environment variables for API URL
- [ ] Test API connection

### Phase 3.2: Dashboard & Upload UI
- [ ] Create `client/src/components/Dropzone.jsx`
  - Large dashed border drag-and-drop area
  - File validation (PDF only)
  - Upload progress indicator
  - Success/error toast notifications
- [ ] Create `client/src/pages/Dashboard.jsx`
  - Left sidebar with document list
  - Main area: "Select a document to begin studying"
  - Empty state with upload prompt
- [ ] Style with Tailwind (Glassmorphic dark theme)
- [ ] Add Lucide icons for file, upload, trash

### Phase 3.3: Study Interface - Chat Component
- [ ] Create `client/src/components/ChatMessage.jsx`
  - User messages: Right-aligned, blue gradient background
  - AI messages: Left-aligned, gray glass background
  - Timestamp display
- [ ] Create `client/src/components/ChatInput.jsx`
  - Text input with send button
  - Auto-resize textarea
  - Loading state while AI responds
- [ ] Integrate Framer Motion for message animations (slide in)
- [ ] Add typing indicator for streaming responses

---

## 🟡 Sohail (Frontend Developer)

### Phase 3.1: State Management
- [ ] Create `client/src/store/studyStore.js` using Zustand
- [ ] State: `currentDoc`, `documents`, `chatHistory`, `isLoading`
- [ ] Actions: `setCurrentDoc()`, `addMessage()`, `uploadDocument()`

### Phase 3.3: Study Interface - Layout & Tabs
- [ ] Create `client/src/pages/StudyView.jsx`
  - Top bar with document title
  - Tab navigation: [ Chat | Syllabus | Quiz | Flashcards ]
  - Tab content area
- [ ] Create `client/src/components/TabNavigation.jsx`
  - Smooth tab switching with Framer Motion
  - Active tab indicator (underline animation)

### Phase 4: Advanced Study Features (Frontend)
- [ ] **Syllabus Component** (`client/src/components/SyllabusTree.jsx`)
  - Recursive tree view of chapters/topics
  - Collapsible sections with smooth GSAP animations
  - Checkboxes for tracking progress
  
- [ ] **Quiz Component** (`client/src/components/QuizCard.jsx`)
  - Show one question at a time
  - 4 option buttons with hover effects
  - Reveal explanation after selection
  - Score tracker at the top
  - Next/Previous navigation

- [ ] **Flashcard Component** (`client/src/components/FlashcardDeck.jsx`)
  - 3D flip animation with Framer Motion
  - "Know it" / "Don't know it" buttons
  - Progress bar showing cards remaining
  - Shuffle deck button

---

## 🔧 Phase 5: Shared Responsibilities

### Ameer + Harsh (Backend Polish)
- [ ] Implement LRU cache for frequent queries
- [ ] Add comprehensive error logging
- [ ] Optimize database queries (indexes on vector columns)
- [ ] Add endpoint for document deletion
- [ ] Write API documentation (README in server/)

### Saad + Sohail (Frontend Polish)
- [ ] Add Sonner toasts for all user actions
- [ ] Create loading skeletons (chat, syllabus, quiz)
- [ ] Add "Code Block" syntax highlighting for chat
- [ ] Implement dark mode glassmorphic effects (backdrop-blur)
- [ ] Add responsive design for mobile/tablet
- [ ] Create 404 and error pages
- [ ] Add keyboard shortcuts (Ctrl+Enter to send message)

---

## 📋 Task Priority Guidelines

### Week 1 Focus:
1. **Ameer:** Server scaffold + AI service setup
2. **Harsh:** Database schema + PDF parsing
3. **Saad:** Dashboard + Dropzone component
4. **Sohail:** State management + Study layout

### Week 2 Focus:
1. **Ameer:** Quiz/Syllabus/Flashcard generation APIs
2. **Harsh:** Chat API with RAG + streaming
3. **Saad:** Chat UI with streaming support
4. **Sohail:** Quiz + Flashcard components

### Week 3 Focus:
- All: Integration testing, bug fixes, polish

---

## 🤝 Collaboration Notes

- **Daily Standups:** Share progress, blockers, next tasks
- **Branch Strategy:** Feature branches → TEST → main
  - Ameer: `feature/ai-*`
  - Harsh: `feature/backend-*`
  - Saad: `feature/ui-*`
  - Sohail: `feature/components-*`
- **Code Reviews:** Peer review before merging to TEST
- **Testing:** Test your features locally before pushing
- **Communication:** Use GitHub Issues for bugs, Discussions for questions

---

## 🎯 Success Metrics

- [ ] Users can upload PDFs and chat with them
- [ ] Auto-generated syllabus displays correctly
- [ ] Quizzes are challenging and accurate
- [ ] Flashcards help with memorization
- [ ] UI is smooth, dark, and glassmorphic
- [ ] All features work offline (local Ollama)

**Let's forge something amazing! 🔨**
