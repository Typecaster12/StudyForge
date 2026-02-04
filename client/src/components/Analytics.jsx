import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Target, Brain, 
  AlertTriangle, CheckCircle, Clock, Zap 
} from 'lucide-react';
import api from '../lib/api';
import useStore from '../store/useStore';

// Chart color scheme matching dark theme
const COLORS = {
  primary: '#3b82f6',
  secondary: '#06b6d4',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
};

const PIE_COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

// Custom tooltip for dark theme
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-white/10 rounded-lg px-4 py-2 shadow-xl">
        <p className="text-gray-400 text-sm mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-white font-semibold" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
            {entry.name.includes('Score') || entry.name.includes('%') ? '%' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  // Get local state from Zustand store
  const { subjects, quizScores, flashcardProgress, topicProgress, flashcards } = useStore();
  
  // State for backend analytics data
  const [backendData, setBackendData] = useState({
    summary: null,
    quizHistory: [],
    subjectProgress: [],
    studySessions: { sessions: [], byDay: {} },
    weakTopics: [],
    loading: true,
    error: null
  });

  // Fetch all analytics data from database
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [summaryRes, quizHistoryRes, subjectProgressRes, studySessionsRes] = await Promise.all([
          api.get('/analytics/summary'),
          api.get('/analytics/quiz-history?limit=20'),
          api.get('/analytics/subject-progress'),
          api.get('/analytics/study-sessions?days=7')
        ]);

        setBackendData({
          summary: summaryRes.data.data,
          quizHistory: quizHistoryRes.data.data,
          subjectProgress: subjectProgressRes.data.data,
          studySessions: studySessionsRes.data.data,
          weakTopics: summaryRes.data.data.weakTopics || [],
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        setBackendData(prev => ({ ...prev, loading: false, error: 'Failed to load analytics' }));
      }
    };

    fetchAnalytics();
  }, []);

  // Calculate local analytics data (fallback if backend data not available)
  const localAnalytics = useMemo(() => {
    // Subject completion data
    const subjectCompletion = subjects.map(subject => {
      const topics = subject.topics || [];
      const progress = topicProgress[subject.id] || {};
      // Count studied from both local progress AND database status
      const studied = topics.filter(topic => 
        progress[topic.id]?.studied || topic.status === 'completed'
      ).length;
      const percentage = topics.length > 0 ? Math.round((studied / topics.length) * 100) : 0;
      
      return {
        name: subject.name.length > 12 ? subject.name.slice(0, 12) + '...' : subject.name,
        fullName: subject.name,
        completed: studied,
        total: topics.length,
        percentage,
        emoji: subject.emoji || '📚'
      };
    });

    // Quiz performance over time
    const allQuizzes = [];
    Object.entries(quizScores).forEach(([subjectId, scores]) => {
      const subject = subjects.find(s => s.id === subjectId);
      scores.forEach(score => {
        allQuizzes.push({
          date: new Date(score.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          timestamp: new Date(score.date).getTime(),
          score: Math.round((score.score / score.total) * 100),
          subject: subject?.name || 'Unknown',
          difficulty: score.difficulty || 'medium'
        });
      });
    });
    
    // Sort by date and take last 10
    const quizHistory = allQuizzes
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-10);

    // Calculate weak topics (topics with low quiz scores or not studied)
    const weakTopics = [];
    subjects.forEach(subject => {
      const topics = subject.topics || [];
      const progress = topicProgress[subject.id] || {};
      const scores = quizScores[subject.id] || [];
      
      topics.forEach(topic => {
        const topicProg = progress[topic.id];
        // Check both local progress and database status
        const isStudied = topicProg?.studied || topic.status === 'completed';
        
        // Find quiz scores for this topic
        const topicScores = scores.filter(s => s.topic === topic.id || s.topic === topic.name);
        const avgScore = topicScores.length > 0
          ? topicScores.reduce((sum, s) => sum + (s.score / s.total * 100), 0) / topicScores.length
          : null;
        
        // Mark as weak if not studied or low quiz score
        if (!isStudied || (avgScore !== null && avgScore < 60)) {
          weakTopics.push({
            id: topic.id,
            name: topic.name || topic.title,
            subject: subject.name,
            subjectId: subject.id,
            subjectEmoji: subject.emoji || '📚',
            isStudied,
            avgScore: avgScore !== null ? Math.round(avgScore) : null,
            reason: !isStudied ? 'Not studied' : 'Low score'
          });
        }
      });
    });

    // Study streak / Activity data (mock for now based on quiz dates)
    const activityByDay = {};
    allQuizzes.forEach(quiz => {
      const day = new Date(quiz.timestamp).toLocaleDateString('en-US', { weekday: 'short' });
      activityByDay[day] = (activityByDay[day] || 0) + 1;
    });
    
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const activityData = weekDays.map(day => ({
      day,
      activities: activityByDay[day] || 0
    }));

    // Flashcard mastery by subject
    const flashcardMastery = subjects.map(subject => {
      const deck = flashcards[subject.id];
      const progress = flashcardProgress[subject.id] || {};
      const totalCards = deck?.cards?.length || 0;
      const knownCards = Object.values(progress).filter(Boolean).length;
      
      return {
        name: subject.name.length > 10 ? subject.name.slice(0, 10) + '...' : subject.name,
        fullName: subject.name,
        mastered: knownCards,
        remaining: Math.max(0, totalCards - knownCards),
        total: totalCards,
        percentage: totalCards > 0 ? Math.round((knownCards / totalCards) * 100) : 0
      };
    }).filter(s => s.total > 0);

    // Overall stats
    const totalTopics = subjects.reduce((acc, s) => acc + (s.topics?.length || 0), 0);
    // Count studied topics from both local progress AND database status
    const studiedTopics = subjects.reduce((acc, subject) => {
      const topics = subject.topics || [];
      const progress = topicProgress[subject.id] || {};
      const studied = topics.filter(topic => 
        progress[topic.id]?.studied || topic.status === 'completed'
      ).length;
      return acc + studied;
    }, 0);
    
    const avgQuizScore = quizHistory.length > 0
      ? Math.round(quizHistory.reduce((sum, q) => sum + q.score, 0) / quizHistory.length)
      : 0;

    // Score trend
    const recentScores = quizHistory.slice(-5);
    const olderScores = quizHistory.slice(-10, -5);
    const recentAvg = recentScores.length > 0 
      ? recentScores.reduce((sum, q) => sum + q.score, 0) / recentScores.length 
      : 0;
    const olderAvg = olderScores.length > 0 
      ? olderScores.reduce((sum, q) => sum + q.score, 0) / olderScores.length 
      : recentAvg;
    const scoreTrend = recentAvg - olderAvg;

    return {
      subjectCompletion,
      quizHistory,
      weakTopics: weakTopics.slice(0, 6), // Top 6 weak topics
      activityData,
      flashcardMastery,
      summary: {
        totalTopics,
        studiedTopics,
        topicsProgress: totalTopics > 0 ? Math.round((studiedTopics / totalTopics) * 100) : 0,
        avgQuizScore,
        scoreTrend,
        weakTopicsCount: weakTopics.length,
        totalQuizzes: allQuizzes.length
      }
    };
  }, [subjects, quizScores, flashcardProgress, topicProgress, flashcards]);

  // Merge backend data with local analytics (prioritize backend when available)
  const analyticsData = useMemo(() => {
    if (backendData.loading) {
      return {
        ...localAnalytics,
        loading: true,
        error: null
      };
    }

    if (backendData.error) {
      return {
        ...localAnalytics,
        loading: false,
        error: backendData.error
      };
    }

    // Merge quiz history from both sources
    const mergedQuizHistory = backendData.quizHistory.length > 0 
      ? backendData.quizHistory.map(quiz => ({
          date: new Date(quiz.date || quiz.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          timestamp: new Date(quiz.date || quiz.createdAt).getTime(),
          score: quiz.percentage,
          subject: quiz.subjectName || 'Unknown',
          difficulty: quiz.difficulty || 'medium'
        }))
      : localAnalytics.quizHistory;

    // Merge subject completion
    const mergedSubjectCompletion = backendData.subjectProgress.length > 0
      ? backendData.subjectProgress.map(subject => ({
          name: subject.name.length > 12 ? subject.name.slice(0, 12) + '...' : subject.name,
          fullName: subject.name,
          completed: subject.topicsCompleted || 0,
          total: subject.topicsTotal || 0,
          percentage: subject.completionPercentage || 0,
          emoji: subject.emoji || subjects.find(s => s.id === subject.subjectId)?.emoji || '📚'
        }))
      : localAnalytics.subjectCompletion;

    // Merge summary statistics
    const mergedSummary = backendData.summary 
      ? {
          totalTopics: backendData.summary.topicsTotal || localAnalytics.summary.totalTopics,
          studiedTopics: backendData.summary.topicsCompleted || localAnalytics.summary.studiedTopics,
          topicsProgress: backendData.summary.topicsTotal > 0 
            ? Math.round((backendData.summary.topicsCompleted / backendData.summary.topicsTotal) * 100)
            : localAnalytics.summary.topicsProgress,
          avgQuizScore: backendData.summary.averageScore || localAnalytics.summary.avgQuizScore,
          scoreTrend: localAnalytics.summary.scoreTrend, // Keep local calculation for trend
          weakTopicsCount: backendData.summary.weakTopicsCount || localAnalytics.summary.weakTopicsCount,
          totalQuizzes: backendData.summary.quizzesCompleted || localAnalytics.summary.totalQuizzes
        }
      : localAnalytics.summary;

    // Merge weak topics
    const mergedWeakTopics = backendData.weakTopics.length > 0
      ? backendData.weakTopics.map(topic => ({
          id: topic.topicId,
          name: topic.topicName,
          subject: topic.subjectName,
          subjectId: topic.subjectId,
          subjectEmoji: subjects.find(s => s.id === topic.subjectId)?.emoji || '📚',
          isStudied: topic.status === 'completed',
          avgScore: topic.averageScore ? Math.round(topic.averageScore) : null,
          reason: topic.status !== 'completed' ? 'Not studied' : 'Low score'
        }))
      : localAnalytics.weakTopics;

    return {
      subjectCompletion: mergedSubjectCompletion,
      quizHistory: mergedQuizHistory,
      weakTopics: mergedWeakTopics,
      activityData: localAnalytics.activityData, // Keep local for now
      flashcardMastery: localAnalytics.flashcardMastery, // Keep local for now
      summary: mergedSummary,
      loading: false,
      error: null
    };
  }, [backendData, localAnalytics, subjects]);

  const { subjectCompletion, quizHistory, weakTopics, activityData, flashcardMastery, summary, loading, error } = analyticsData;

  return (
    <div className="space-y-8">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="card p-6 border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <div>
              <div className="text-red-400 font-semibold">Failed to load analytics</div>
              <div className="text-gray-400 text-sm mt-1">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-xs text-gray-500">Topics</span>
          </div>
          <div className="text-2xl font-bold text-white">{summary.topicsProgress}%</div>
          <div className="text-sm text-gray-400">{summary.studiedTopics}/{summary.totalTopics} completed</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex items-center gap-1">
              {summary.scoreTrend >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-xs ${summary.scoreTrend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {summary.scoreTrend >= 0 ? '+' : ''}{summary.scoreTrend.toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{summary.avgQuizScore}%</div>
          <div className="text-sm text-gray-400">Average quiz score</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-xs text-gray-500">Quizzes</span>
          </div>
          <div className="text-2xl font-bold text-white">{summary.totalQuizzes}</div>
          <div className="text-sm text-gray-400">Total completed</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-xs text-gray-500">Needs work</span>
          </div>
          <div className="text-2xl font-bold text-white">{summary.weakTopicsCount}</div>
          <div className="text-sm text-gray-400">Weak topics</div>
        </motion.div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Subject Completion */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            Subject Completion
          </h3>
          {subjectCompletion.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={subjectCompletion} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={12} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#64748b" 
                  fontSize={12}
                  width={100}
                  tick={{ fill: '#94a3b8' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="percentage" 
                  fill={COLORS.primary}
                  radius={[0, 4, 4, 0]}
                  name="Progress %"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500">
              No subjects yet. Add a subject to track progress.
            </div>
          )}
        </motion.div>

        {/* Quiz Performance Over Time */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Quiz Performance Trend
          </h3>
          {quizHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={quizHistory}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#scoreGradient)"
                  name="Score"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500">
              Take quizzes to see your performance trend.
            </div>
          )}
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weak Topics */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6 lg:col-span-2"
        >
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Topics That Need Attention
          </h3>
          {weakTopics.length > 0 ? (
            <div className="space-y-3">
              {weakTopics.map((topic, index) => (
                <div 
                  key={topic.id || index}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{topic.subjectEmoji}</span>
                    <div>
                      <div className="text-white font-medium">{topic.name}</div>
                      <div className="text-gray-500 text-sm">{topic.subject}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {topic.avgScore !== null ? (
                      <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        topic.avgScore >= 60 ? 'bg-emerald-500/20 text-emerald-400' :
                        topic.avgScore >= 40 ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {topic.avgScore}% avg
                      </div>
                    ) : (
                      <div className="px-2 py-1 rounded-lg bg-gray-500/20 text-gray-400 text-xs font-medium">
                        Not studied
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center text-gray-500">
              <CheckCircle className="w-12 h-12 text-emerald-500/50 mb-3" />
              <p>Great job! No weak topics identified.</p>
              <p className="text-sm">Keep up the good work!</p>
            </div>
          )}
        </motion.div>

        {/* Weekly Activity */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Weekly Activity
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="activities" 
                fill={COLORS.secondary}
                radius={[4, 4, 0, 0]}
                name="Activities"
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Flashcard Mastery */}
      {flashcardMastery.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            Flashcard Mastery by Subject
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={flashcardMastery}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="mastered" stackId="a" fill={COLORS.success} name="Mastered" radius={[0, 0, 0, 0]} />
              <Bar dataKey="remaining" stackId="a" fill={COLORS.danger} name="Remaining" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
