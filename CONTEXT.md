# StudyForge - Project Context & Communication Summary

**Last Updated:** February 4, 2026  
**Project Status:** ✅ Fully Functional  
**Purpose:** AI-powered study material generator for students

---

## 📋 Project Overview

StudyForge is a full-stack web application that uses AI to generate personalized study materials from uploaded PDFs. Students can upload course materials and instantly get:
- Interactive quizzes (with Exam Mode)
- Flashcards for memorization
- Topic explanations via AI chat
- Analytics dashboard tracking progress
- Organized subjects and topics

---

## 🛠️ Tech Stack

### Frontend (Client)
- **Framework:** React 18 + Vite
- **State Management:** Zustand with persist middleware
- **Styling:** Tailwind CSS
- **UI Components:** Framer Motion, Lucide Icons, Recharts
- **HTTP Client:** Axios
- **Port:** 5173

### Backend (Server)
- **Runtime:** Bun (JavaScript/TypeScript runtime)
- **Framework:** Express.js
- **Database:** PostgreSQL (hosted on Neon)
- **ORM:** Drizzle ORM
- **AI Provider:** Groq API with `groq/compound` model (unlimited tokens)
- **Authentication:** JWT with httpOnly cookies
- **OAuth:** Google OAuth 2.0
- **Port:** 3000

### Infrastructure
- **PDF Processing:** pdf-parse
- **Password Hashing:** bcrypt
- **File Upload:** Multer
- **CORS:** Enabled for localhost:5173

---

## 📁 Project Structure

```
StudyForge/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Analytics.jsx        # Analytics dashboard
│   │   │   ├── ChatTab.jsx          # AI chat interface
│   │   │   ├── FlashcardsTab.jsx    # Flashcard viewer
│   │   │   ├── PDFUpload.jsx        # PDF upload component
│   │   │   ├── ProtectedRoute.jsx   # Auth guard
│   │   │   └── QuizTab.jsx          # Quiz interface (with Exam Mode)
│   │   ├── pages/          # Page components
│   │   │   ├── Dashboard.jsx        # Main dashboard
│   │   │   ├── Landing.jsx          # Landing page
│   │   │   ├── Login.jsx            # Login page
│   │   │   ├── Settings.jsx         # User settings
│   │   │   ├── Signup.jsx           # Signup page
│   │   │   ├── StudyRoom.jsx        # Study interface
│   │   │   ├── TeacherDashboard.jsx # Teacher portal with subject creation
│   │   │   └── TopicStudy.jsx       # Topic study page
│   │   ├── store/          # Zustand state management
│   │   │   ├── useAuthStore.js      # Auth state
│   │   │   └── useStore.js          # Main app state
│   │   ├── lib/            # Utility functions
│   │   │   └── api.js               # API client
│   │   └── App.jsx         # Root component
│   └── package.json
│
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   │   ├── analytics.js         # Analytics endpoints
│   │   │   ├── auth.js              # Authentication
│   │   │   ├── chat.js              # AI chat
│   │   │   ├── flashcards.js        # Flashcard CRUD
│   │   │   ├── quizzes.js           # Quiz CRUD
│   │   │   ├── subjects.js          # Subject management
│   │   │   ├── teacher.js           # Teacher portal API (with create-subject)
│   │   │   └── upload.js            # PDF upload
│   │   ├── services/       # Business logic
│   │   │   ├── generator.js         # AI generation service
│   │   │   ├── schemas.js           # Zod validation schemas
│   │   │   └── storage.js           # Database connection
│   │   ├── db/             # Database schema
│   │   │   └── schema.js            # Drizzle schema definitions
│   │   └── index.js        # Server entry point
│   ├── uploads/            # Temporary PDF storage
│   ├── .env                # Environment variables
│   └── package.json
│
├── plan.md                 # Project plan
├── delegate.md             # Task delegation
├── CONTEXT.md              # This file
└── .gitignore
```

---

## 🔑 Key Features

### 1. **PDF Upload & Processing**
- Upload course PDFs (max 10MB)
- Extract text content
- Generate structured subjects and topics
- Store in database with user association

### 2. **AI-Powered Generation**
- **Quizzes:** Multiple-choice questions with explanations
- **Flashcards:** Front/back cards with optional hints
- **Chat:** Topic explanations and Q&A
- Model: `groq/compound` (unlimited daily tokens)

### 3. **Quiz System**
- **Practice Mode:** Immediate feedback, explanations shown
- **Exam Mode (NEW):** 
  - Timed tests (5-60 minutes)
  - No immediate feedback
  - Review/change answers before submit
  - Auto-submit on timeout
  - Shows answered count (X/Total)

### 4. **Analytics Dashboard**
- Quiz performance history with charts
- Topic completion tracking
- Subject progress visualization
- Weak topics identification
- **Database-backed:** All data persists across sessions

### 5. **Authentication**
- JWT-based auth with httpOnly cookies
- Google OAuth integration
- Protected routes
- User sessions persist

### 6. **Flashcard System**
- Swipe-based interface
- Track known/unknown cards
- Progress visualization
- Subject-organized decks

---

## 🔧 Environment Variables

### Server (.env)
```env
# Database
DATABASE_URL=postgresql://neondb_owner:...@...neon.tech/neondb?sslmode=require

# AI Provider
AI_PROVIDER=groq
GROQ_API_KEY=gsk_...
GROQ_MODEL=groq/compound

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-secret

# Server
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key

# CORS
CLIENT_URL=http://localhost:5173
```

### Client (optional .env)
```env
VITE_API_URL=http://localhost:3000/api
```

---

## 🗄️ Database Schema

### Tables:
1. **users** - User accounts (id, email, password, name, role)
2. **subjects** - Course subjects (id, userId, name, emoji, topics[])
3. **topics** - Course topics (id, subjectId, title, content, status)
4. **quizzes** - Generated quizzes (id, userId, subjectId, questions[], difficulty)
5. **quiz_results** - Quiz scores (id, userId, quizId, score, percentage, answers)
6. **flashcard_decks** - Flashcard decks (id, userId, subjectId, title)
7. **flashcards** - Individual cards (id, deckId, front, back, hint)
8. **study_sessions** - Study time tracking
9. **weak_topics** - Topics needing attention (based on quiz scores <70%)

---

## 🚀 Recent Changes & Fixes

### Session 1: OAuth & Loading States
- ✅ Fixed Google OAuth COOP warnings (expected behavior)
- ✅ Added `isCheckingAuth` to auth store
- ✅ Fixed loading spinner in ProtectedRoute
- ✅ Prevented premature redirects during auth check

### Session 2: API Issues
- ✅ Fixed double `/api/api/` URL in PDFUpload component
- ✅ Switched AI model from `llama-3.3-70b-versatile` to `groq/compound`
- ✅ Resolved Groq 100K token/day rate limit issue

### Session 3: Flashcard Generation
- ✅ Fixed validation error (made `example` field nullable)
- ✅ Fixed database field mapping (term→front, definition→back)
- ✅ Added `fetchFlashcards()` to Zustand store

### Session 4: Analytics Database Integration
- ✅ Fixed Analytics component import issues
- ✅ Added backend analytics endpoints integration
- ✅ Merged database data with local state
- ✅ Quiz results now persist to database
- ✅ Topic completion tracked in database
- ✅ Added loading/error states to Analytics

### Session 5: Quiz Persistence
- ✅ Quizzes now saved to database on generation
- ✅ Quiz ID tracked and linked to results
- ✅ Quiz history fully persists across sessions

### Session 6: Exam Mode Feature
- ✅ Added Exam Mode toggle
- ✅ Implemented countdown timer (5-60 min)
- ✅ No immediate feedback during exam
- ✅ Navigation between questions
- ✅ Answer tracking and warnings
- ✅ Auto-submit on timeout

### Session 7: Landing Page Updates
- ✅ Removed scroll indicator (mouse icon)
- ✅ Updated stats: "10x Faster Learning", "Instant Study Materials", "Free To Start"

### Session 8: Cleanup
- ✅ Removed 13 unnecessary files from root
- ✅ Kept only: plan.md, delegate.md, source code

### Session 9: Teacher Mode Enhancement
- ✅ Fixed teacher dashboard to use database instead of in-memory storage
- ✅ Added database persistence for flashcard reviews
- ✅ Created comprehensive testing and deployment guide

### Session 10: Teacher Subject Creation Feature
- ✅ Added "Create Subject for All Students" button in teacher dashboard
- ✅ Implemented modal with subject form (name, description, icon, color)
- ✅ Created API endpoint: `POST /api/teacher/create-subject`
- ✅ Bulk subject creation - one subject added to all students simultaneously
- ✅ Updated README and created TEACHER_FEATURES.md documentation

---

## 🔍 Important Code Locations

### API Endpoints

#### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/google` - Google OAuth
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

#### Subjects & Topics
- `GET /api/subjects` - Get all subjects
- `POST /api/subjects` - Create subject
- `GET /api/subjects/:id` - Get subject details
- `PATCH /api/subjects/:subjectId/topics/:topicId` - Update topic status

#### Quizzes
- `GET /api/quizzes` - Get all quizzes
- `POST /api/quizzes` - Save quiz
- `POST /api/quizzes/:id/results` - Save quiz results

#### Analytics
- `GET /api/analytics/summary` - Overall stats
- `GET /api/analytics/quiz-history` - Quiz history
- `GET /api/analytics/subject-progress` - Subject progress

#### Generation
- `POST /api/generate/quiz` - Generate quiz
- `POST /api/generate/flashcards` - Generate flashcards
- `POST /api/chat` - AI chat

#### File Upload
- `POST /api/upload` - Upload PDF

#### Teacher Portal
- `GET /api/teacher/students` - Get all students with stats
- `GET /api/teacher/student/:id` - Get detailed student info
- `GET /api/teacher/analytics` - Get class-wide analytics
- `POST /api/teacher/create-subject` - Create subject for all students (NEW!)

### Key Functions

#### Frontend Store Actions (useStore.js)
```javascript
// Subjects
addSubject(name, emoji, topics)
updateSubject(id, updates)
deleteSubject(id)

// Quizzes
setQuiz(subjectId, quiz)
updateQuizScore(subjectId, score, total, metadata)

// Flashcards
setFlashcards(subjectId, cards)
fetchFlashcards() // Fetches from database

// Topics
markTopicStudied(subjectId, topicId) // Updates DB

// Progress
updateFlashcardProgress(subjectId, cardIndex, known)
```

#### Backend Services (generator.js)
```javascript
generateQuiz(content, topic, difficulty, count)
generateFlashcards(content, topic, count)
generateTopicExplanation(content, topic, question)
```

---

## 🐛 Known Issues & Limitations

1. **Flashcard Progress**: Not yet saved to database (only local state)
2. **Study Sessions**: Table exists but tracking not implemented
3. **Weak Topics**: Calculated but not actively used in UI
4. **PDF Upload**: 10MB limit, no progress indicator

---

## 🚦 Running the Project

### Prerequisites
- Bun runtime installed
- PostgreSQL database (Neon)
- Groq API key
- Google OAuth credentials (optional)

### Setup

1. **Clone and Install**
```bash
cd StudyForge
cd server && bun install
cd ../client && bun install
```

2. **Configure Environment**
- Copy `server/.env.example` to `server/.env`
- Add database URL, API keys, secrets

3. **Start Development**
```bash
# Terminal 1: Start server
cd server
bun run dev

# Terminal 2: Start client
cd client
bun run dev
```

4. **Access Application**
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Health check: http://localhost:3000/health

---

## 📊 Current State

### Working Features ✅
- PDF upload and text extraction
- Subject and topic management
- Quiz generation (practice + exam modes)
- Flashcard generation
- AI chat for explanations
- Analytics dashboard with database persistence
- Authentication (JWT + Google OAuth)
- Protected routes
- Quiz result tracking
- Topic completion tracking

### In Progress ⚠️
- Flashcard progress database persistence
- Study session time tracking

### Pending 🔄
- Weak topics UI integration
- PDF upload progress indicator
- File size optimization
- Mobile responsiveness improvements

---

## 🔐 Security Notes

- JWT secrets stored in .env (not committed)
- Passwords hashed with bcrypt (10 rounds)
- httpOnly cookies for auth tokens
- CORS restricted to localhost:5173
- Database connection SSL enabled
- API keys in .env (gitignored)

---

## 📝 Important Notes for Next Session

1. **AI Model**: Using `groq/compound` for unlimited tokens
2. **Database**: Neon PostgreSQL, all schemas in `server/src/db/schema.js`
3. **Auth Flow**: JWT in cookies, check with `/api/auth/me`
4. **File Structure**: Clean root directory (only plan.md, delegate.md, source dirs)
5. **Quiz System**: Two modes (practice/exam), both save to database
6. **Analytics**: Fully integrated with backend, data persists

---

## 🎯 Quick Reference

### Start Servers
```bash
# Server (from /server)
bun run dev

# Client (from /client)
bun run dev
```

### Check Health
```bash
curl http://localhost:3000/health
```

### Database Schema Location
```
server/src/db/schema.js
```

### Main State Store
```
client/src/store/useStore.js
```

### API Client
```
client/src/lib/api.js
```

---

## 💡 Development Tips

1. **Check server logs** for AI generation status
2. **Use browser DevTools** to monitor API calls
3. **Check Zustand DevTools** for state debugging
4. **Database queries** logged in server terminal
5. **Quiz IDs** logged when saved to database

---

**End of Context Document**  
This document should provide complete context for continuing development with any AI assistant.
