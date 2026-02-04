import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Sparkles, ArrowLeft, BookOpen, ClipboardCheck, Layers, 
  MessageCircle, Target, CheckCircle, Play, ChevronRight,
  Zap, AlertTriangle, Calendar, Loader2
} from 'lucide-react'
import { cn } from '../lib/utils'
import useStore from '../store/useStore'
import QuizTab from '../components/QuizTab'
import FlashcardsTab from '../components/FlashcardsTab'
import ChatTab from '../components/ChatTab'
import ExamMode from '../components/ExamMode'
import WeakTopics from '../components/WeakTopics'
import StudyPlanner from '../components/StudyPlanner'

const tabs = [
  { id: 'topics', label: 'Topics', icon: Target },
  { id: 'quiz', label: 'Quiz', icon: ClipboardCheck },
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
  { id: 'chat', label: 'AI Chat', icon: MessageCircle },
  { id: 'exam', label: 'Exam Mode', icon: Zap },
  { id: 'weak', label: 'Weak Topics', icon: AlertTriangle },
  { id: 'planner', label: 'Planner', icon: Calendar }
]

export default function StudyRoom() {
  const { subjectId, documentId } = useParams()
  const id = subjectId || documentId // Support both routes
  const navigate = useNavigate()
  const { subjects, currentSubject, setCurrentSubject, topicProgress, fetchSubjectDetails, fetchSubjects, isLoading } = useStore()
  const [activeTab, setActiveTab] = useState('topics')
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const loadSubject = async () => {
      setLoading(true)
      
      // If subjects are empty, fetch them first
      if (subjects.length === 0) {
        await fetchSubjects()
      }
      
      // Find subject in local state
      let subject = subjects.find(s => s.id === id)
      
      if (subject) {
        setCurrentSubject(subject)
        
        // Fetch full details from database (includes topics, quizzes, flashcards)
        const fullDetails = await fetchSubjectDetails(id)
        
        if (fullDetails) {
          setCurrentSubject({ ...subject, ...fullDetails })
        }
        setLoading(false)
        setInitialized(true)
      } else {
        // Subject not found - wait a bit and check again to handle race conditions
        setLoading(false)
        setInitialized(true)
      }
    }
    
    loadSubject()
  }, [id, subjects.length, fetchSubjects, fetchSubjectDetails, setCurrentSubject])

  // Only navigate away after fully initialized and still no subject
  useEffect(() => {
    if (initialized && !loading && !isLoading) {
      const subject = subjects.find(s => s.id === id)
      if (!subject && !currentSubject) {
        navigate('/dashboard')
      }
    }
  }, [initialized, loading, isLoading, subjects, id, currentSubject, navigate])

  if (loading || isLoading || !currentSubject) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-4">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading subject...</p>
      </div>
    )
  }

  const topics = currentSubject.topics || []
  const progress = topicProgress[currentSubject.id] || {}
  // Count studied topics from both local progress AND database status
  const studiedCount = topics.filter(topic => 
    progress[topic.id]?.studied || topic.status === 'completed'
  ).length

  const handleStudyTopic = (topic) => {
    navigate(`/subject/${id}/topic/${topic.id}`)
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-transparent to-cyan-950/10" />
      </div>

      {/* Header */}
      <header className="glass sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white hidden sm:block">StudyForge</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-lg",
              currentSubject.gradient || 'from-blue-500 to-blue-600'
            )}>
              {currentSubject.emoji || '📚'}
            </div>
            <div className="hidden sm:block">
              <div className="font-semibold text-white">{currentSubject.name}</div>
              <div className="text-xs text-gray-500">{topics.length} topics</div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="sticky top-[72px] z-30 glass border-b border-blue-500/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap",
                    isActive ? "text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl neon-blue"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="relative max-w-7xl mx-auto px-6 lg:px-8 py-10">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'topics' && (
            <div className="space-y-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Study Topics</h2>
                  <p className="text-gray-400">Click on a topic to study it in detail with AI</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  {studiedCount}/{topics.length} completed
                </div>
              </div>

              {/* Topics List */}
              {topics.length === 0 ? (
                <div className="card p-16 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-6">
                    <Target className="w-9 h-9 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">No topics yet</h3>
                  <p className="text-gray-400 max-w-md mx-auto">
                    This subject doesn't have any topics. Try a demo subject or add content to generate topics.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {topics.map((topic, index) => {
                    // Check both local progress and database status
                    const isStudied = progress[topic.id]?.studied || topic.status === 'completed'
                    return (
                      <motion.button
                        key={topic.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleStudyTopic(topic)}
                        className="card card-hover p-5 text-left group flex items-center gap-4"
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-colors",
                          isStudied 
                            ? "bg-emerald-500/20 text-emerald-400" 
                            : "bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30"
                        )}>
                          {isStudied ? <CheckCircle className="w-5 h-5" /> : index + 1}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
                            {topic.title}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {topic.description || 'Click to study this topic'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-4 h-4" />
                          <span className="text-sm font-medium">Study</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
          {activeTab === 'quiz' && <QuizTab document={currentSubject} />}
          {activeTab === 'flashcards' && <FlashcardsTab document={currentSubject} />}
          {activeTab === 'chat' && <ChatTab document={currentSubject} />}
          {activeTab === 'exam' && <ExamMode subject={currentSubject} topics={topics} />}
          {activeTab === 'weak' && <WeakTopics subject={currentSubject} topics={topics} />}
          {activeTab === 'planner' && <StudyPlanner subject={currentSubject} topics={topics} />}
        </motion.div>
      </main>
    </div>
  )
}
