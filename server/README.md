# 🔨 StudyForge Backend API Documentation

Backend server for StudyForge - AI-powered study companion using Ollama for local, privacy-first learning.

## 🚀 Getting Started

### Prerequisites
- Bun runtime installed
- Ollama running locally
- Models pulled: `qwen3:8b` and `nomic-embed-text`

### Installation

```bash
cd server
bun install
```

### Environment Variables

Create a `.env` file:

```env
PORT=3000
DATABASE_URL=postgres://postgres:[PASSWORD]@[HOST]:5432/postgres
OLLAMA_BASE_URL=http://localhost:11434
NODE_ENV=development
```

### Running the Server

```bash
# Development mode (with watch)
bun run dev

# Production mode
bun start
```

Server will start on `http://localhost:3000`

---

## 📚 API Endpoints

### Health Check

**GET** `/health`

Check if server is running.

**Response:**
```json
{
  "status": "ok",
  "message": "StudyForge server is running"
}
```

---

## 🎓 Generation Endpoints

### Generate Syllabus

**POST** `/api/generate/syllabus`

Generate a structured syllabus from document content.

**Request Body:**
```json
{
  "content": "Your document text here..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Course Title",
    "chapters": [
      {
        "title": "Chapter 1: Introduction",
        "topics": [
          {
            "title": "Overview",
            "subtopics": [
              { "title": "Key Concepts" }
            ]
          }
        ]
      }
    ]
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/generate/syllabus \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Machine learning is a subset of AI..."
  }'
```

---

### Generate Quiz

**POST** `/api/generate/quiz`

Generate quiz questions from document content.

**Request Body:**
```json
{
  "content": "Your document text here...",
  "topic": "Optional specific topic",
  "difficulty": "easy|medium|hard",
  "questionCount": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Quiz Title",
    "questions": [
      {
        "question": "What is React?",
        "options": [
          "A JavaScript library",
          "A database",
          "A programming language",
          "An IDE"
        ],
        "correctIndex": 0,
        "explanation": "React is a JavaScript library for building user interfaces."
      }
    ]
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/generate/quiz \
  -H "Content-Type: application/json" \
  -d '{
    "content": "React is a JavaScript library...",
    "difficulty": "medium",
    "questionCount": 3
  }'
```

---

### Generate Flashcards

**POST** `/api/generate/flashcards`

Generate flashcards from document content.

**Request Body:**
```json
{
  "content": "Your document text here...",
  "cardCount": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Flashcard Deck Title",
    "cards": [
      {
        "term": "Virtual DOM",
        "definition": "A lightweight copy of the actual DOM",
        "example": "React uses it for efficient updates"
      }
    ]
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/generate/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "content": "React uses a virtual DOM...",
    "cardCount": 5
  }'
```

---

## 📊 Progress Tracking Endpoints

### Save Progress

**POST** `/api/progress/save`

Save study progress for a document.

**Request Body:**
```json
{
  "documentId": "uuid-here",
  "type": "quiz|flashcard",
  "score": 8,
  "total": 10,
  "metadata": {
    "timeSpent": 120,
    "difficulty": "medium",
    "wrongAnswers": [2, 5]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Progress saved successfully",
  "data": {
    "id": "doc-uuid_quiz_timestamp",
    "documentId": "uuid-here",
    "type": "quiz",
    "score": 8,
    "total": 10,
    "timestamp": "2026-02-03T12:00:00.000Z",
    "metadata": { ... }
  }
}
```

---

### Get Document Progress

**GET** `/api/progress/:documentId`

Get all progress and statistics for a specific document.

**Response:**
```json
{
  "success": true,
  "data": {
    "documentId": "uuid-here",
    "totalSessions": 15,
    "quiz": {
      "sessions": 8,
      "averageScore": "85.5",
      "totalQuestions": 40,
      "correctAnswers": 34
    },
    "flashcard": {
      "sessions": 7,
      "totalCards": 70,
      "knownCards": 58
    },
    "history": [ ... ]
  }
}
```

---

### Get Overall Statistics

**GET** `/api/progress/stats/overall`

Get statistics across all documents.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalDocuments": 5,
    "totalSessions": 42,
    "totalQuizzes": 25,
    "totalFlashcards": 17,
    "totalTimeSpent": 180,
    "recentActivity": [ ... ]
  }
}
```

---

### Clear Document Progress

**DELETE** `/api/progress/:documentId`

Clear all progress data for a document.

**Response:**
```json
{
  "success": true,
  "message": "Progress cleared successfully"
}
```

---

## 📤 Upload Endpoint (Coming Soon)

**POST** `/api/upload`

Upload PDF documents for processing. (Implemented by Harsh)

---

## 💬 Chat Endpoint (Coming Soon)

**POST** `/api/chat`

Chat with your documents using RAG. (Implemented by Harsh)

---

## 🛠️ Error Handling

All endpoints return errors in this format:

```json
{
  "error": {
    "message": "Error description",
    "details": { ... }
  }
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation error)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## 🧪 Testing

### Test Ollama Connection

```bash
curl http://localhost:3000/health
```

### Test AI Generation

```bash
# Quick quiz test
curl -X POST http://localhost:3000/api/generate/quiz \
  -H "Content-Type: application/json" \
  -d '{
    "content": "The sky is blue because of Rayleigh scattering.",
    "questionCount": 2,
    "difficulty": "easy"
  }'
```

---

## 🔐 Rate Limiting

- **Window:** 15 minutes
- **Max Requests:** 100 per IP
- Applies to all `/api/*` routes

---

## 📝 Notes for Team

- **Harsh:** Implement `upload.js` and `chat.js` routes
- **Saad/Sohail:** Use these endpoints from frontend via Axios
- Progress data is in-memory for now - Harsh will add DB persistence

---

## 🤖 AI Models Used

- **qwen3:8b** - Text generation (syllabus, quiz, flashcards)
- **nomic-embed-text** - Embeddings for semantic search (768 dimensions)

Make sure both models are pulled:
```bash
ollama pull qwen3:8b
ollama pull nomic-embed-text
```

---

## 🚧 Development Status

- ✅ Server scaffold
- ✅ Generation APIs (syllabus, quiz, flashcards)
- ✅ Progress tracking
- ✅ Rate limiting
- ⏳ PDF upload (Harsh)
- ⏳ Chat/RAG (Harsh)
- ⏳ Database integration (Harsh)
