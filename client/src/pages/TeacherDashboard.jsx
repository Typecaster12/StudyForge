import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, TrendingUp, BookOpen, Award, AlertTriangle,
  Clock, Target, BarChart3, ChevronRight, Sparkles,
  RefreshCw, Loader2, Plus, X
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function TeacherDashboard() {
  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'students' | 'analytics'
  const [showCreateSubject, setShowCreateSubject] = useState(false);
  const [creating, setCreating] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: '📚'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, analyticsRes] = await Promise.all([
        fetch(`${API_URL}/teacher/students`, {
          credentials: 'include',
        }),
        fetch(`${API_URL}/teacher/analytics`, {
          credentials: 'include',
        }),
      ]);

      if (studentsRes.ok) {
        const result = await studentsRes.json();
        setStudents(result.data || []);
      }

      if (analyticsRes.ok) {
        const result = await analyticsRes.json();
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (score) => {
    if (score >= 80) return 'text-green-400 bg-green-900/30';
    if (score >= 60) return 'text-yellow-400 bg-yellow-900/30';
    return 'text-red-400 bg-red-900/30';
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch(`${API_URL}/teacher/create-subject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(subjectForm),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ Subject "${subjectForm.name}" created for ${result.data.studentsCount} students!`);
        setShowCreateSubject(false);
        setSubjectForm({ name: '', description: '', color: '#3B82F6', icon: '📚' });
        fetchData(); // Refresh data
      } else {
        alert(`❌ Error:() => setShowCreateSubject(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Create Subject for All
            </button>
            <button
              onClick={ ${result.error?.message || 'Failed to create subject'}`);
      }
    } catch (error) {
      console.error('Create subject error:', error);
      alert('❌ Failed to create subject. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const iconOptions = ['📚', '🔬', '🎨', '💻', '🧮', '🌍', '⚗️', '🎭', '🏛️', '📊', '🎵', '⚽', '📖', '✍️', '🧬'];
  const colorOptions = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#14B8A6'];

  return (
    <div className="min-h-screen bg-black">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-transparent to-blue-950/10" />
      </div>

      {/* Header */}
      <header className="glass sticky top-0 z-40 border-b border-purple-500/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Teacher Dashboard</h1>
              <p className="text-xs text-gray-500">Monitor student progress</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
            </button>
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors text-sm"
            >
              Student View
            </Link>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Stats Cards */}
        {analytics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{analytics.totalStudents}</p>
                  <p className="text-xs text-gray-500">Total Students</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {analytics.activeStudents} active this week
              </p>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{analytics.averageProgress}%</p>
                  <p className="text-xs text-gray-500">Avg Progress</p>
                </div>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${analytics.averageProgress}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{analytics.totalQuizzes}</p>
                  <p className="text-xs text-gray-500">Quizzes Taken</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {analytics.averageScore}% avg score
              </p>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{analytics.weakTopics?.length || 0}</p>
                  <p className="text-xs text-gray-500">Weak Topics</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Need attention
              </p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'overview', label: 'Overview', icon: Target },
            { id: 'students', label: 'Students', icon: Users },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && analytics && (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Weak Topics */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Class Weak Topics
                  </h3>
                  {analytics.weakTopics?.length > 0 ? (
                    <div className="space-y-2">
                      {analytics.weakTopics.map((topic, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                          <span className="text-gray-300">{topic.topic}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">{topic.attempts} attempts</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getPerformanceColor(topic.avgScore)}`}>
                              {Math.round(topic.avgScore)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No weak topics identified</p>
                  )}
                </div>

                {/* Strong Topics */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-green-400" />
                    Class Strong Topics
                  </h3>
                  {analytics.strongTopics?.length > 0 ? (
                    <div className="space-y-2">
                      {analytics.strongTopics.map((topic, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                          <span className="text-gray-300">{topic.topic}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">{topic.attempts} attempts</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getPerformanceColor(topic.avgScore)}`}>
                              {Math.round(topic.avgScore)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No data yet</p>
                  )}
                </div>
              </div>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
              <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-700">
                  <h3 className="font-medium text-white">Student List ({students.length})</h3>
                </div>
                {students.length === 0 ? (
                  <div className="p-12 text-center">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500">No students enrolled yet</p>
                    <p className="text-gray-600 text-sm mt-2">Students will appear here once they enroll</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-700">
                    {students.map((student) => (
                      <Link
                        key={student.id}
                        to={`/teacher/student/${student.id}`}
                        className="flex items-center justify-between p-4 hover:bg-gray-700/30 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {student.name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <h4 className="font-medium text-white group-hover:text-blue-300 transition-colors">
                              {student.name || 'Student'}
                            </h4>
                            <p className="text-xs text-gray-500">{student.email || 'No email'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm text-gray-400">{student.stats.subjects} subjects</p>
                            <p className="text-xs text-gray-600">{student.stats.quizzesTaken} quizzes</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPerformanceColor(student.stats.averageScore)}`}>
                            {student.stats.averageScore}%
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && analytics && (
              <div className="space-y-6">
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-bold text-white mb-4">Subject Distribution</h3>
                  {Object.keys(analytics.subjectDistribution).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(analytics.subjectDistribution).map(([subject, count]) => (
                        <div key={subject}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-gray-300 text-sm">{subject}</span>
                            <span className="text-gray-500 text-xs">{count} students</span>
                          </div>
                          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                              style={{ width: `${(count / students.length) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No subject data yet</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Create Subject Modal */}
      {showCreateSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Create Subject for All Students</h3>
              <button
                onClick={() => setShowCreateSubject(false)}
                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-5">
              {/* Subject Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  placeholder="e.g., Introduction to Computer Science"
                  className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={subjectForm.description}
                  onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                  placeholder="Brief description of the subject..."
                  rows="3"
                  className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {iconOptions.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSubjectForm({ ...subjectForm, icon: emoji })}
                      className={`p-3 rounded-lg text-2xl transition-all ${
                        subjectForm.icon === emoji
                          ? 'bg-purple-600 scale-110'
                          : 'bg-gray-900 hover:bg-gray-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((clr) => (
                    <button
                      key={clr}
                      type="button"
                      onClick={() => setSubjectForm({ ...subjectForm, color: clr })}
                      className={`h-12 rounded-lg transition-all ${
                        subjectForm.color === clr
                          ? 'ring-4 ring-white scale-105'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: clr }}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-lg bg-gray-900 border border-gray-700">
                <p className="text-xs text-gray-500 mb-2">Preview:</p>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: subjectForm.color }}
                  >
                    {subjectForm.icon}
                  </div>
                  <div>
                    <p className="font-medium text-white">{subjectForm.name || 'Subject Name'}</p>
                    <p className="text-sm text-gray-500">{subjectForm.description || 'No description'}</p>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-700/50">
                <p className="text-sm text-yellow-400">
                  ⚠️ This will create "{subjectForm.name || 'this subject'}" for <strong>{students.length} students</strong>
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={creating || !subjectForm.name}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {creating ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </span>
                ) : (
                  `Create for ${students.length} Students`
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherDashboard;
