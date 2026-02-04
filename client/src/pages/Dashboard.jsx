import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Plus, Trash2, GraduationCap, 
  BarChart3, Target, Layers, ArrowRight, X,
  Upload, Settings as SettingsIcon, LogOut, Crown, RefreshCw, PieChart
} from 'lucide-react';
import { cn } from '../lib/utils';
import useStore from '../store/useStore';
import useAuthStore from '../store/useAuthStore';
import { demoSubjects } from '../lib/demoData';
import PDFUpload from '../components/PDFUpload';
import TeacherUpgradeModal from '../components/TeacherUpgradeModal';
import Analytics from '../components/Analytics';

export default function Dashboard() {
  const navigate = useNavigate();
  const { subjects, addSubject, removeSubject, setCurrentSubject, getStats, fetchSubjects, isLoading } = useStore();
  const { user, logout } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState('create'); // 'create' | 'upload' | 'demo'
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectEmoji, setNewSubjectEmoji] = useState('📚');
  const [activeTab, setActiveTab] = useState('subjects'); // 'subjects' | 'analytics'
  const stats = getStats();

  // Fetch subjects from database on mount
  useEffect(() => {
    if (user) {
      fetchSubjects();
    }
  }, [user, fetchSubjects]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const gradients = [
    'from-blue-500 to-blue-600',
    'from-purple-500 to-purple-600',
    'from-emerald-500 to-emerald-600',
    'from-orange-500 to-orange-600',
    'from-pink-500 to-pink-600',
    'from-cyan-500 to-cyan-600'
  ]

  const emojis = ['📚', '🔬', '🧮', '🌍', '💻', '🎨', '📊', '⚗️', '🎵', '📖', '🧬', '🔭']

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) return
    
    const newSubject = {
      name: newSubjectName.trim(),
      emoji: newSubjectEmoji,
      gradient: gradients[Math.floor(Math.random() * gradients.length)],
      content: `Study material for ${newSubjectName}`,
      topics: []
    }
    
    addSubject(newSubject)
    setNewSubjectName('')
    setNewSubjectEmoji('📚')
    setShowModal(false)
  }

  const handleSelectDemo = (demo) => {
    if (!subjects.find(s => s.id === demo.id)) {
      addSubject(demo)
    }
    setCurrentSubject(demo)
    setShowModal(false)
    navigate(`/subject/${demo.id}`)
  }

  const handleOpenSubject = (subject) => {
    setCurrentSubject(subject)
    navigate(`/subject/${subject.id}`)
  }

  const statCards = [
    { label: 'Subjects', value: stats.subjectsCount, icon: GraduationCap, gradient: 'from-blue-500 to-blue-400' },
    { label: 'Topics', value: stats.topicsCount, icon: Target, gradient: 'from-cyan-500 to-cyan-400' },
    { label: 'Quizzes Done', value: stats.quizzesCompleted, icon: BarChart3, gradient: 'from-emerald-500 to-emerald-400' },
    { label: 'Cards Mastered', value: stats.masteredCards, icon: Layers, gradient: 'from-purple-500 to-purple-400' }
  ]

  return (
    <div className="min-h-screen bg-black">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-transparent to-cyan-950/10" />
      </div>

      {/* Header */}
      <header className="glass sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">StudyForge</span>
          </Link>

          <div className="flex items-center gap-3">
            {user?.role === 'student' && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600/20 to-purple-500/20 hover:from-purple-600/30 hover:to-purple-500/30 border border-purple-500/30 text-purple-300 hover:text-purple-200 transition-all"
              >
                <Crown className="w-4 h-4" />
                <span className="text-sm font-medium">Become a Teacher</span>
              </button>
            )}
            {user?.role === 'teacher' && (
              <Link
                to="/teacher"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600/20 to-purple-500/20 hover:from-purple-600/30 hover:to-purple-500/30 border border-purple-500/30 text-purple-300 hover:text-purple-200 transition-all"
              >
                <GraduationCap className="w-4 h-4" />
                <span className="text-sm font-medium">Teacher Portal</span>
              </Link>
            )}
            <Link
              to="/settings"
              className="p-2 rounded-xl hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
              title="Settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
            <button onClick={() => setShowModal(true)} className="btn btn-primary shimmer-button">
              <Plus className="w-5 h-5" />
              Add Subject
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Welcome */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-3">
            {activeTab === 'subjects' ? 'Your Subjects 📚' : 'Analytics & Progress 📊'}
          </h1>
          <p className="text-gray-400 text-lg">
            {activeTab === 'subjects' 
              ? 'Select a subject to study topics, take quizzes, or review flashcards.'
              : 'Track your learning progress, identify weak areas, and improve your study habits.'}
          </p>
        </motion.div>

        {/* Tab Switcher */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-2 mb-8"
        >
          <button
            onClick={() => setActiveTab('subjects')}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all",
              activeTab === 'subjects'
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25"
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
            )}
          >
            <GraduationCap className="w-4 h-4" />
            My Subjects
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all",
              activeTab === 'analytics'
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25"
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
            )}
          >
            <PieChart className="w-4 h-4" />
            Analytics
          </button>
        </motion.div>

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Analytics />
          </motion.div>
        )}

        {/* Subjects Tab */}
        {activeTab === 'subjects' && (
          <>
            {/* Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-16"
            >
              {statCards.map((stat, i) => (
                <div key={i} className="card card-hover p-6 stat-card">
                  <div className={cn(
                    "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4",
                    stat.gradient
                  )}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Subjects Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white">My Subjects</h2>
                <span className="text-sm text-gray-500">{subjects.length} subjects</span>
              </div>

          {subjects.length === 0 ? (
            <div className="card p-16 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-9 h-9 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No subjects yet</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Add your first subject to start studying. Create custom subjects or try our demos.
              </p>
              <button onClick={() => setShowModal(true)} className="btn btn-primary shimmer-button">
                <Plus className="w-5 h-5" />
                Add Your First Subject
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject) => (
                <motion.div
                  key={subject.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => handleOpenSubject(subject)}
                  className="card card-hover p-6 cursor-pointer group relative"
                >
                  <div className={cn(
                    "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl mb-4",
                    subject.gradient || 'from-blue-500 to-blue-600'
                  )}>
                    {subject.emoji || '📚'}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
                    {subject.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {subject.topics?.length || 0} topics
                  </p>
                  <div className="flex items-center gap-1 text-blue-400 text-sm font-medium">
                    <span>Study Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); removeSubject(subject.id) }}
                    className="absolute top-4 right-4 p-2 rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}

              {/* Add New Card */}
              <button
                onClick={() => setShowModal(true)}
                className="card p-6 border-2 border-dashed border-gray-700 hover:border-blue-500/50 flex flex-col items-center justify-center min-h-[200px] group transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center text-gray-500 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-all mb-4">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-gray-500 group-hover:text-gray-300 font-medium">Add Subject</span>
              </button>
            </div>
          )}
        </motion.div>
          </>
        )}
      </main>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative glass-card rounded-3xl p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-bold text-white mb-2">Add a Subject</h2>
              <p className="text-gray-400 mb-6">Create a new subject, upload a PDF, or choose a demo.</p>


              {/* Tabs (Upload PDF and Demo Topics only) */}
              <div className="flex gap-2 mb-6">
                {[
                  { id: 'upload', label: 'Upload PDF', icon: Upload },
                  { id: 'demo', label: 'Demo Topics', icon: GraduationCap },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setModalTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                      modalTab === tab.id
                        ? "bg-blue-600 text-white"
                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Upload PDF */}
              {modalTab === 'upload' && (
                <PDFUpload 
                  onUploadComplete={(subject) => {
                    setShowModal(false);
                    navigate(`/subject/${subject.id}`);
                  }} 
                />
              )}

              {/* Demo Topics */}
              {modalTab === 'demo' && (
                <div className="space-y-3">
                  {demoSubjects.map((demo) => (
                    <button
                      key={demo.id}
                      onClick={() => handleSelectDemo(demo)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-blue-500/30 transition-all text-left group"
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl",
                        demo.gradient
                      )}>
                        {demo.emoji}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                          {demo.name}
                        </div>
                        <div className="text-sm text-gray-500">{demo.topics?.length || 0} topics included</div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Teacher Upgrade Modal */}
      <TeacherUpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
}
