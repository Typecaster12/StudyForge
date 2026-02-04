import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Request deduplication cache to prevent duplicate fetches (React Strict Mode)
const pendingRequests = new Map();

// API helper with credentials and deduplication
const api = {
  async get(endpoint) {
    // Deduplicate concurrent requests to the same endpoint
    if (pendingRequests.has(endpoint)) {
      return pendingRequests.get(endpoint);
    }
    
    const requestPromise = (async () => {
      try {
        const res = await fetch(`${API_URL}${endpoint}`, { credentials: 'include' });
        if (!res.ok) {
          const error = new Error(`API request failed: ${res.status}`);
          error.status = res.status;
          throw error;
        }
        return res.json();
      } finally {
        // Clear from cache after request completes
        pendingRequests.delete(endpoint);
      }
    })();
    
    pendingRequests.set(endpoint, requestPromise);
    return requestPromise;
  },
  async post(endpoint, data) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = new Error(`API request failed: ${res.status}`);
      error.status = res.status;
      throw error;
    }
    return res.json();
  },
  async patch(endpoint, data) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = new Error(`API request failed: ${res.status}`);
      error.status = res.status;
      throw error;
    }
    return res.json();
  },
  async delete(endpoint) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      const error = new Error(`API request failed: ${res.status}`);
      error.status = res.status;
      throw error;
    }
    return res.json();
  },
};

const useStore = create(
  persist(
    (set, get) => ({
      // Subjects (main entities)
      subjects: [],
      currentSubject: null,
      currentTopic: null,
      isLoading: false,
      lastSynced: null,
      
      // Generated content (cached by subject)
      syllabi: {},
      quizzes: {},
      flashcards: {},
      topicContent: {}, // AI-generated topic explanations
      
      // Progress tracking
      quizScores: {},
      flashcardProgress: {},
      topicProgress: {}, // Track which topics are studied
      serverStats: null,
      
      // ===== Database Sync Actions =====
      fetchSubjects: async () => {
        try {
          set({ isLoading: true });
          const result = await api.get('/subjects');
          if (result.success && result.data) {
            set({ 
              subjects: result.data,
              lastSynced: new Date().toISOString(),
              isLoading: false 
            });
          }
        } catch (error) {
          console.error('Failed to fetch subjects:', error);
          set({ isLoading: false });
        }
      },

      fetchSubjectDetails: async (subjectId) => {
        try {
          const result = await api.get(`/subjects/${subjectId}`);
          if (result.success && result.data) {
            // Sync topic completion status from database to local topicProgress
            const topicProgressUpdate = {};
            if (result.data.topics && result.data.topics.length > 0) {
              result.data.topics.forEach(topic => {
                if (topic.status === 'completed') {
                  topicProgressUpdate[topic.id] = {
                    studied: true,
                    lastStudied: topic.completedAt || new Date().toISOString()
                  };
                }
              });
            }

            // Update the subject in our local state with full details
            set((state) => ({
              subjects: state.subjects.map(s => 
                s.id === subjectId ? { ...s, ...result.data } : s
              ),
              currentSubject: state.currentSubject?.id === subjectId 
                ? { ...state.currentSubject, ...result.data }
                : state.currentSubject,
              // Merge database topic status into local topicProgress
              topicProgress: Object.keys(topicProgressUpdate).length > 0
                ? {
                    ...state.topicProgress,
                    [subjectId]: {
                      ...(state.topicProgress[subjectId] || {}),
                      ...topicProgressUpdate
                    }
                  }
                : state.topicProgress,
            }));
            return result.data;
          }
        } catch (error) {
          // 404 is expected for locally-created subjects not yet in database
          // 429 means rate limited - also use local data
          // Just silently return null - the local data will be used instead
          if (error.status !== 404 && error.status !== 429) {
            console.warn('Could not fetch subject from server, using local data');
          }
        }
        return null;
      },
      
      // ===== Subject Actions =====
      addSubject: async (subject) => {
        // Generate local ID first for immediate UI update
        const localId = subject.id || crypto.randomUUID();
        const newSubject = { 
          ...subject, 
          id: localId,
          topics: subject.topics || [],
          createdAt: new Date().toISOString()
        };
        
        // Optimistic update
        set((state) => ({
          subjects: [...state.subjects, newSubject]
        }));

        // Sync to database
        try {
          const result = await api.post('/subjects', {
            name: subject.name,
            description: subject.content || subject.description,
            color: subject.color,
            icon: subject.emoji,
            syllabusData: subject.syllabusData || (subject.topics?.length > 0 ? { units: [{ title: 'Topics', topics: subject.topics }] } : null),
          });
          
          if (result.success && result.data) {
            // Update with server ID
            set((state) => ({
              subjects: state.subjects.map(s => 
                s.id === localId ? { ...s, ...result.data, id: result.data.id } : s
              )
            }));
            console.log('✅ Subject synced to database:', result.data.name);
            return result.data;
          }
        } catch (error) {
          console.error('Failed to sync subject to database:', error);
          // Keep local version
        }
        return newSubject;
      },
      
      updateSubject: async (id, updates) => {
        // Optimistic update
        set((state) => ({
          subjects: state.subjects.map(s => 
            s.id === id ? { ...s, ...updates } : s
          )
        }));

        // Sync to database
        try {
          await api.patch(`/subjects/${id}`, updates);
          console.log('✅ Subject updated in database');
        } catch (error) {
          console.error('Failed to update subject in database:', error);
        }
      },
      
      setCurrentSubject: (subject) => set({ currentSubject: subject }),
      
      removeSubject: async (id) => {
        // Optimistic update
        set((state) => ({
          subjects: state.subjects.filter(s => s.id !== id),
          syllabi: { ...state.syllabi, [id]: undefined },
          quizzes: { ...state.quizzes, [id]: undefined },
          flashcards: { ...state.flashcards, [id]: undefined },
          quizScores: { ...state.quizScores, [id]: undefined },
          flashcardProgress: { ...state.flashcardProgress, [id]: undefined },
          topicProgress: { ...state.topicProgress, [id]: undefined },
          topicContent: Object.fromEntries(
            Object.entries(state.topicContent).filter(([key]) => !key.startsWith(id))
          )
        }));

        // Sync to database
        try {
          await api.delete(`/subjects/${id}`);
          console.log('✅ Subject deleted from database');
        } catch (error) {
          console.error('Failed to delete subject from database:', error);
        }
      },
      
      // ===== Topic Actions =====
      addTopicToSubject: (subjectId, topic) => set((state) => ({
        subjects: state.subjects.map(s => 
          s.id === subjectId 
            ? { 
                ...s, 
                topics: [...(s.topics || []), { 
                  ...topic, 
                  id: topic.id || crypto.randomUUID(),
                  createdAt: new Date().toISOString()
                }]
              }
            : s
        )
      })),
      
      setTopicsForSubject: async (subjectId, topics) => {
        set((state) => ({
          subjects: state.subjects.map(s => 
            s.id === subjectId ? { ...s, topics } : s
          )
        }));

        // Also update in database via syllabusData
        try {
          const subject = get().subjects.find(s => s.id === subjectId);
          if (subject) {
            await api.patch(`/subjects/${subjectId}`, {
              syllabusData: { units: [{ title: 'Topics', topics }] },
              totalTopics: topics.length
            });
          }
        } catch (error) {
          console.error('Failed to sync topics to database:', error);
        }
      },
      
      updateTopic: async (subjectId, topicId, updates) => {
        set((state) => ({
          subjects: state.subjects.map(s => 
            s.id === subjectId 
              ? { 
                  ...s, 
                  topics: (s.topics || []).map(t => 
                    t.id === topicId ? { ...t, ...updates } : t
                  )
                }
              : s
          )
        }));

        // Sync topic status to database
        try {
          await api.patch(`/subjects/${subjectId}/topics/${topicId}`, updates);
        } catch (error) {
          console.error('Failed to update topic in database:', error);
        }
      },
      
      removeTopic: (subjectId, topicId) => set((state) => ({
        subjects: state.subjects.map(s => 
          s.id === subjectId 
            ? { ...s, topics: (s.topics || []).filter(t => t.id !== topicId) }
            : s
        ),
        topicContent: { ...state.topicContent, [`${subjectId}-${topicId}`]: undefined }
      })),
      
      setCurrentTopic: (topic) => set({ currentTopic: topic }),
      
      // ===== Content Actions =====
      setSyllabus: (subjectId, syllabus) => set((state) => ({
        syllabi: { ...state.syllabi, [subjectId]: syllabus }
      })),
      
      setQuiz: async (subjectId, quiz) => {
        set((state) => ({
          quizzes: { ...state.quizzes, [subjectId]: quiz }
        }));

        // Save quiz to database
        try {
          const result = await api.post('/quizzes', {
            subjectId,
            title: quiz.title || `Quiz for ${subjectId}`,
            difficulty: quiz.difficulty || 'medium',
            questions: quiz.questions || quiz,
            totalQuestions: (quiz.questions || quiz).length,
          });
          console.log('✅ Quiz saved to database');
          return result.data;
        } catch (error) {
          console.error('Failed to save quiz to database:', error);
        }
      },
      
      setFlashcards: async (subjectId, cards) => {
        set((state) => ({
          flashcards: { ...state.flashcards, [subjectId]: cards }
        }));

        // Save flashcards to database
        try {
          const result = await api.post('/flashcards/decks', {
            subjectId,
            title: cards.title || `Flashcards for ${subjectId}`,
            cards: cards.cards || cards,
          });
          console.log('✅ Flashcards saved to database');
          return result.data;
        } catch (error) {
          console.error('Failed to save flashcards to database:', error);
        }
      },

      fetchFlashcards: async () => {
        try {
          const result = await api.get('/flashcards/decks');
          const decks = result.data || [];
          
          // Organize decks by subjectId
          const flashcardsBySubject = {};
          for (const deck of decks) {
            if (deck.subjectId) {
              // Fetch cards for this deck
              const deckDetails = await api.get(`/flashcards/decks/${deck.id}`);
              flashcardsBySubject[deck.subjectId] = {
                title: deck.title,
                cards: deckDetails.data.cards || [],
                deckId: deck.id
              };
            }
          }
          
          set({ flashcards: flashcardsBySubject });
          console.log('✅ Fetched flashcards from database');
        } catch (error) {
          console.error('Failed to fetch flashcards:', error);
        }
      },
      
      setTopicContent: (subjectId, topicId, content) => set((state) => ({
        topicContent: { 
          ...state.topicContent, 
          [`${subjectId}-${topicId}`]: content 
        }
      })),
      
      // ===== Progress Actions =====
      updateQuizScore: async (subjectId, score, total, metadata = {}) => {
        const scoreEntry = { 
          score, 
          total, 
          date: new Date().toISOString(),
          difficulty: metadata.difficulty,
          timeSpent: metadata.timeSpent,
          topic: metadata.topic
        };

        set((state) => ({
          quizScores: { 
            ...state.quizScores, 
            [subjectId]: [
              ...(state.quizScores[subjectId] || []), 
              scoreEntry
            ]
          }
        }));

        // Save quiz result to database
        if (metadata.quizId) {
          try {
            await api.post(`/quizzes/${metadata.quizId}/results`, {
              score,
              totalQuestions: total,
              percentage: (score / total) * 100,
              timeTaken: metadata.timeSpent,
              answers: metadata.answers,
            });
            console.log('✅ Quiz result saved to database');
          } catch (error) {
            console.error('Failed to save quiz result:', error);
          }
        }
      },
      
      updateFlashcardProgress: (subjectId, cardIndex, known) => set((state) => {
        const progress = state.flashcardProgress[subjectId] || {}
        return {
          flashcardProgress: {
            ...state.flashcardProgress,
            [subjectId]: { ...progress, [cardIndex]: known }
          }
        }
      }),
      
      resetFlashcardProgress: (subjectId) => set((state) => ({
        flashcardProgress: {
          ...state.flashcardProgress,
          [subjectId]: {}
        }
      })),
      
      markTopicStudied: async (subjectId, topicId) => {
        set((state) => ({
          topicProgress: {
            ...state.topicProgress,
            [subjectId]: {
              ...(state.topicProgress[subjectId] || {}),
              [topicId]: { studied: true, lastStudied: new Date().toISOString() }
            }
          }
        }));

        // Update topic status in database
        try {
          await api.patch(`/subjects/${subjectId}/topics/${topicId}`, {
            status: 'completed'
          });
        } catch (error) {
          console.error('Failed to update topic status:', error);
        }
      },
      
      setServerStats: (stats) => set({ serverStats: stats }),
      
      // ===== Getters =====
      getStats: () => {
        const state = get()
        const quizSessions = Object.values(state.quizScores).flat()
        const totalQuizzes = quizSessions.length
        const totalCards = Object.values(state.flashcards).reduce((acc, deck) => {
          return acc + (deck?.cards?.length || 0)
        }, 0)
        const knownCards = Object.values(state.flashcardProgress).reduce((acc, prog) => {
          return acc + Object.values(prog || {}).filter(Boolean).length
        }, 0)
        
        const totalTopics = state.subjects.reduce((acc, s) => acc + (s.topics?.length || 0), 0)
        // Count studied from both local progress AND database status
        const studiedTopics = state.subjects.reduce((acc, subject) => {
          const topics = subject.topics || []
          const progress = state.topicProgress[subject.id] || {}
          const studied = topics.filter(topic => 
            progress[topic.id]?.studied || topic.status === 'completed'
          ).length
          return acc + studied
        }, 0)
        
        const avgScore = totalQuizzes > 0 
          ? Math.round(quizSessions.reduce((sum, q) => sum + (q.score / q.total * 100), 0) / totalQuizzes)
          : 0
        
        return {
          subjectsCount: state.subjects.length,
          topicsCount: totalTopics,
          topicsStudied: studiedTopics,
          quizzesCompleted: totalQuizzes,
          flashcardsStudied: totalCards,
          masteredCards: knownCards,
          averageQuizScore: avgScore
        }
      },
      
      getSubjectProgress: (subjectId) => {
        const state = get()
        const subject = state.subjects.find(s => s.id === subjectId)
        const quizHistory = state.quizScores[subjectId] || []
        const flashcardProg = state.flashcardProgress[subjectId] || {}
        const flashcardDeck = state.flashcards[subjectId]
        const topicProg = state.topicProgress[subjectId] || {}
        
        const knownCount = Object.values(flashcardProg).filter(Boolean).length
        const totalCards = flashcardDeck?.cards?.length || 0
        const topics = subject?.topics || []
        // Count studied from both local progress AND database status
        const topicsStudied = topics.filter(topic => 
          topicProg[topic.id]?.studied || topic.status === 'completed'
        ).length
        const totalTopics = topics.length
        
        return {
          quizSessions: quizHistory.length,
          lastQuizScore: quizHistory.length > 0 ? quizHistory[quizHistory.length - 1] : null,
          flashcardsMastered: knownCount,
          flashcardsTotal: totalCards,
          flashcardPercentage: totalCards > 0 ? Math.round((knownCount / totalCards) * 100) : 0,
          topicsStudied,
          totalTopics,
          topicsPercentage: totalTopics > 0 ? Math.round((topicsStudied / totalTopics) * 100) : 0
        }
      },
      
      // Legacy support - documents alias to subjects
      get documents() { return get().subjects },
      currentDocument: null,
      addDocument: (doc) => get().addSubject(doc),
      setCurrentDocument: (doc) => get().setCurrentSubject(doc),
      removeDocument: (id) => get().removeSubject(id)
    }),
    { 
      name: 'studyforge-storage', 
      version: 3,
      migrate: (persistedState, version) => {
        // Migrate from version 2 (documents) to version 3 (subjects)
        if (version < 3) {
          const oldState = persistedState
          return {
            ...oldState,
            // Convert documents to subjects
            subjects: oldState.documents || [],
            currentSubject: oldState.currentDocument || null,
            currentTopic: null,
            topicContent: {},
            topicProgress: {},
            // Keep existing data
            syllabi: oldState.syllabi || {},
            quizzes: oldState.quizzes || {},
            flashcards: oldState.flashcards || {},
            quizScores: oldState.quizScores || {},
            flashcardProgress: oldState.flashcardProgress || {},
            serverStats: oldState.serverStats || null
          }
        }
        return persistedState
      }
    }
  )
)

export default useStore
