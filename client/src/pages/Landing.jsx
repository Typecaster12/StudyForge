import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  Brain, 
  Zap, 
  MessageCircle,
  Upload,
  Target,
  Trophy,
  CheckCircle2,
  Play,
  LogIn
} from 'lucide-react';
import { cn } from '../lib/utils';
import useAuthStore from '../store/useAuthStore';

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: BookOpen,
      title: 'Smart Syllabi',
      desc: 'AI analyzes your documents and creates comprehensive, structured study plans tailored to your content.',
      gradient: 'from-blue-500 to-blue-400'
    },
    {
      icon: Brain,
      title: 'Adaptive Quizzes',
      desc: 'Test yourself with AI-generated questions. Choose difficulty levels and get instant explanations.',
      gradient: 'from-cyan-500 to-cyan-400'
    },
    {
      icon: Zap,
      title: 'Instant Flashcards',
      desc: 'Transform complex topics into bite-sized flashcards. Perfect for spaced repetition learning.',
      gradient: 'from-emerald-500 to-emerald-400'
    },
    {
      icon: MessageCircle,
      title: 'AI Tutor Chat',
      desc: 'Ask questions about your documents. Get accurate answers powered by RAG technology.',
      gradient: 'from-purple-500 to-purple-400'
    }
  ]

  const steps = [
    { icon: Upload, num: '01', title: 'Upload', desc: 'Drop your PDF or study materials' },
    { icon: Sparkles, num: '02', title: 'Generate', desc: 'AI creates personalized content' },
    { icon: Target, num: '03', title: 'Learn', desc: 'Study with quizzes & flashcards' },
    { icon: Trophy, num: '04', title: 'Master', desc: 'Track progress and excel' }
  ]

  return (
    <div className="min-h-screen overflow-hidden bg-black">
      {/* Ambient Background - Simplified */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-950/30 via-transparent to-cyan-950/20" />
      </div>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled ? "glass py-4" : "py-6"
        )}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">StudyForge</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-gray-400 hover:text-white transition-colors font-medium">Features</a>
            <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors font-medium">How It Works</a>
            <Link to="/teacher" className="text-gray-400 hover:text-white transition-colors font-medium">Teacher Portal</Link>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors font-medium">
                  Dashboard
                </Link>
                <Link to={user?.role === 'teacher' ? '/teacher' : '/dashboard'} className="btn btn-primary shimmer-button">
                  {user?.role === 'teacher' ? 'Teacher Portal' : 'Get Started'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors font-medium flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Log In
                </Link>
                <Link to="/signup" className="btn btn-primary shimmer-button">
                  Sign Up Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-24">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full glass-card mb-8"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-400" />
            </span>
            <span className="text-sm text-gray-300 font-medium">Powered by Advanced AI</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.1] mb-8 tracking-tight"
          >
            <span className="text-white">Study Smarter,</span>
            <br />
            <span className="text-gradient">Not Harder</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Transform your learning with AI-powered study tools. Generate syllabi, 
            quizzes, flashcards, and get instant answers from your study materials.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/dashboard" className="btn btn-primary btn-lg text-base shimmer-button">
              <Sparkles className="w-5 h-5" />
              Start Learning Free
            </Link>
            <a href="#features" className="btn btn-secondary btn-lg text-base">
              <Play className="w-5 h-5" />
              See How It Works
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-12 md:gap-16 mt-20"
          >
            {[
              { value: '10x', label: 'Faster Learning' },
              { value: 'Instant', label: 'Study Materials' },
              { value: 'Free', label: 'To Start' }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gradient">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-20">
            <span className="text-blue-400 text-sm font-semibold uppercase tracking-[0.2em] mb-4 block">Features</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">Everything You Need to Excel</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Powerful AI tools designed to transform how you learn and retain information
            </p>
          </div>

          {/* Feature cards - 2x2 Grid */}
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="card card-hover p-8 lg:p-10"
              >
                <div className={cn(
                  "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6",
                  feature.gradient
                )}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 text-lg leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-20">
            <span className="text-blue-400 text-sm font-semibold uppercase tracking-[0.2em] mb-4 block">Process</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">How StudyForge Works</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              From upload to mastery in four simple steps
            </p>
          </div>

          {/* Steps */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((item, i) => (
              <div 
                key={i}
                className="relative"
              >
                <div className="card p-8 text-center h-full hover-glow">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-5">
                    <item.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className="text-5xl font-bold text-gradient block mb-3">{item.num}</span>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-blue-500/50 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="card p-12 md:p-20 text-center relative overflow-hidden border-blue-500/20">
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                Ready to Transform<br />Your Learning?
              </h2>
              <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
                Join thousands of students using AI to study smarter. Start free today, no credit card required.
              </p>
              
              <Link to="/dashboard" className="btn btn-primary btn-lg text-base inline-flex shimmer-button">
                <Sparkles className="w-5 h-5" />
                Get Started Now
                <ArrowRight className="w-5 h-5" />
              </Link>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-gray-500">
                {['Free to start', 'No signup required', 'Instant results'].map((text, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-10 px-6 border-t border-blue-500/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">StudyForge</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2026 StudyForge. Built with AI, made for learners.
          </p>
        </div>
      </footer>
    </div>
  )
}
