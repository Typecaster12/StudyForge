# 📚 StudyForge - AI-Powered Study Companion

Transform your course materials into interactive quizzes, flashcards, and get instant AI explanations. Built for students, by students.

![Status](https://img.shields.io/badge/status-active-success.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)

---

## ✨ Features

- **📄 PDF Processing**: Upload course PDFs and automatically extract topics
- **🎯 Smart Quizzes**: Generate practice quizzes and timed exams with AI
- **🃏 Flashcards**: Create flashcards with spaced repetition tracking
- **💬 AI Chat**: Ask questions and get instant explanations
- **📊 Analytics**: Track your progress with detailed statistics
- **👨‍🏫 Teacher Mode**: Monitor student progress and class analytics
- **🔐 Authentication**: Secure login with Email or Google OAuth

---

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) runtime installed
- PostgreSQL database (we use [Neon](https://neon.tech))
- [Groq API](https://groq.com) key for AI features

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/StudyForge.git
cd StudyForge
```

2. **Install dependencies**
```bash
# Server
cd server
bun install

# Client
cd ../client
bun install
```

3. **Configure environment variables**

Create `server/.env`:
```env
DATABASE_URL=postgresql://...
GROQ_API_KEY=gsk_...
GROQ_MODEL=groq/compound
AI_PROVIDER=groq
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-secret
TEACHER_ACCESS_CODE=TEACH2026
PORT=3000
```

Create `client/.env` (optional):
```env
VITE_API_URL=http://localhost:3000/api
```

4. **Setup database**
```bash
cd server
bun run drizzle-kit push
```

5. **Start development servers**
```bash
# Terminal 1: Backend
cd server
bun run dev

# Terminal 2: Frontend
cd client
bun run dev
```

6. **Open your browser**
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

---

## 🎮 Usage

### For Students

1. **Sign up** with email or Google
2. **Upload** a course PDF (max 10MB)
3. **Generate** quizzes and flashcards
4. **Study** with practice mode or exam mode
5. **Track** your progress in analytics

### For Teachers

1. **Upgrade** to teacher using access code (from .env)
2. **Access** teacher dashboard at `/teacher`
3. **Monitor** all student progress
4. **View** class-wide analytics
5. **Create subjects** for all students at once
6. **Identify** students who need help

#### Creating Subjects for All Students

Teachers can create a subject card that will be automatically added to all enrolled students:

1. Click **"Create Subject for All"** button in teacher dashboard
2. Fill in subject details:
   - Subject name (required)
   - Description (optional)
   - Choose an icon (📚, 🔬, 💻, etc.)
   - Select a color
3. Preview the subject card
4. Click **"Create for X Students"**
5. The subject will be instantly added to all students' accounts

This feature is perfect for:
- 📘 Adding new courses at the start of a semester
- 📝 Creating standardized subject cards across all students
- 🎯 Ensuring consistency in course materials

---

## 🛠️ Tech Stack

### Frontend
- React 18 + Vite
- Zustand (State Management)
- Tailwind CSS
- Framer Motion
- Recharts
- Axios

### Backend
- Bun Runtime
- Express.js
- PostgreSQL + Drizzle ORM
- Groq AI API
- JWT Authentication
- Google OAuth 2.0

---

## 📋 Project Structure

```
StudyForge/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand state
│   │   └── lib/           # Utilities
│   └── package.json
│
├── server/                # Express backend
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── db/           # Database schema
│   └── package.json
│
├── CONTEXT.md            # Full project context
├── TESTING_DEPLOYMENT.md # Testing & deployment guide
└── README.md             # This file
```

---

## 🎯 Key Features

### Exam Mode
- **Timed tests** (5-60 minutes)
- **No immediate feedback** during exam
- **Review answers** before submitting
- **Auto-submit** on timeout
- **Track unanswered** questions

### Flashcard System
- **Spaced repetition** algorithm
- **Progress tracking** (times reviewed, accuracy)
- **Database persistence** across sessions
- **Swipe interface** for smooth reviewing

### Teacher Dashboard
- **Real-time analytics** from database
- **Student performance** tracking
- **Class-wide statistics**
- **Individual student** insights
- **Weak topics** identification

### Analytics
- **Quiz performance** history
- **Subject progress** visualization
- **Topic completion** tracking
- **Weak areas** identification
- **Database-backed** persistence

---

## 🔐 Environment Variables

### Required
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `GROQ_API_KEY` | Groq AI API key | `gsk_...` |
| `JWT_SECRET` | Secret for JWT tokens | Generate with crypto |

### Optional
| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | - |
| `TEACHER_ACCESS_CODE` | Code to upgrade to teacher | `TEACH2026` |
| `PORT` | Server port | `3000` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` |

---

## 🧪 Testing

See [TESTING_DEPLOYMENT.md](TESTING_DEPLOYMENT.md) for comprehensive testing checklist and deployment guide.

Quick test:
```bash
# Health check
curl http://localhost:3000/health

# Should return: {"status":"ok"}
```

---

## 📚 API Documentation

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/upgrade-to-teacher` - Upgrade to teacher
- `GET /api/auth/me` - Get current user

### Subjects & Topics
- `GET /api/subjects` - Get all subjects
- `POST /api/subjects` - Create subject
- `PATCH /api/subjects/:id/topics/:topicId` - Update topic

### Quizzes
- `POST /api/generate/quiz` - Generate quiz
- `POST /api/quizzes` - Save quiz
- `POST /api/quizzes/:id/results` - Save results

### Flashcards
- `POST /api/generate/flashcards` - Generate flashcards
- `GET /api/flashcards/decks` - Get all decks
- `PATCH /api/flashcards/cards/:id/review` - Track review

### Analytics
- `GET /api/analytics/summary` - Overall stats
- `GET /api/analytics/quiz-history` - Quiz history
- `GET /api/analytics/subject-progress` - Subject progress

### Teacher (Requires teacher role)
- `GET /api/teacher/students` - Get all students
- `GET /api/teacher/student/:id` - Get student details
- `GET /api/teacher/analytics` - Class analytics

---

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- [Groq](https://groq.com) for fast AI inference
- [Neon](https://neon.tech) for serverless PostgreSQL
- [Bun](https://bun.sh) for lightning-fast runtime
- The open-source community

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/StudyForge/issues)
- **Email**: support@studyforge.com
- **Documentation**: See CONTEXT.md for full project details

---

**Built with ❤️ for students everywhere**
