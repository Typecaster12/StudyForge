import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, RefreshCw, Check, X, ClipboardCheck, Clock, AlertCircle } from 'lucide-react'
import { cn } from '../lib/utils'
import { generateQuiz } from '../lib/api'
import useStore from '../store/useStore'
import api from '../lib/api'

export default function QuizTab({ document }) {
  const { quizzes, setQuiz, updateQuizScore } = useStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [difficulty, setDifficulty] = useState('medium')
  const [count, setCount] = useState(5)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [answers, setAnswers] = useState({})
  const [quizComplete, setQuizComplete] = useState(false)
  const [quizId, setQuizId] = useState(null)
  const [examMode, setExamMode] = useState(false)
  const [timeLimit, setTimeLimit] = useState(10) // minutes
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [examSubmitted, setExamSubmitted] = useState(false)

  const quiz = quizzes[document.id]

  // Timer for exam mode
  useEffect(() => {
    if (examMode && quiz && !quizComplete && !examSubmitted && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleExamSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [examMode, quiz, quizComplete, examSubmitted, timeRemaining])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setAnswers({})
    setQuizComplete(false)
    setExamSubmitted(false)
    
    // Initialize timer for exam mode
    if (examMode) {
      setTimeRemaining(timeLimit * 60)
    }

    try {
      const result = await generateQuiz(document.content, { 
        difficulty, 
        questionCount: count 
      })
      setQuiz(document.id, result)
      
      // Save quiz to database to get quiz ID
      try {
        const { data } = await api.post('/quizzes', {
          title: `${document.name || 'Quiz'} - ${difficulty}${examMode ? ' (Exam Mode)' : ''}`,
          subjectId: document.id,
          topicId: null,
          difficulty,
          questions: result.questions
        })
        setQuizId(data.data.id)
        console.log('✅ Quiz saved to database with ID:', data.data.id)
      } catch (dbError) {
        console.error('Failed to save quiz to database:', dbError)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAnswer = (index) => {
    if (showResult && !examMode) return
    if (examMode) {
      // In exam mode, just store the answer
      setAnswers({ ...answers, [currentQuestion]: index })
      setSelectedAnswer(index)
    } else {
      setSelectedAnswer(index)
    }
  }

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return
    setShowResult(true)
    setAnswers({ ...answers, [currentQuestion]: selectedAnswer })
  }

  const handleNextQuestion = () => {
    if (examMode) {
      // In exam mode, just navigate
      if (currentQuestion < quiz.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedAnswer(answers[currentQuestion + 1] ?? null)
      }
    } else {
      if (currentQuestion < quiz.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedAnswer(null)
        setShowResult(false)
      } else {
        const score = Object.entries({ ...answers, [currentQuestion]: selectedAnswer })
          .filter(([qIndex, aIndex]) => quiz.questions[parseInt(qIndex)]?.correctIndex === aIndex)
          .length
        
        updateQuizScore(document.id, score, quiz.questions.length, { 
          difficulty,
          quizId: quizId,
          answers: { ...answers, [currentQuestion]: selectedAnswer }
        })
        setQuizComplete(true)
      }
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setSelectedAnswer(answers[currentQuestion - 1] ?? null)
    }
  }

  const handleExamSubmit = () => {
    const score = Object.entries(answers)
      .filter(([qIndex, aIndex]) => quiz.questions[parseInt(qIndex)]?.correctIndex === aIndex)
      .length
    
    updateQuizScore(document.id, score, quiz.questions.length, { 
      difficulty,
      quizId: quizId,
      answers: answers
    })
    setExamSubmitted(true)
    setQuizComplete(true)
  }

  const getAnsweredCount = () => {
    return Object.keys(answers).length
  }

  const getScore = () => {
    return Object.entries(answers).filter(
      ([qIndex, aIndex]) => quiz.questions[parseInt(qIndex)]?.correctIndex === aIndex
    ).length
  }

  const restartQuiz = () => {
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setAnswers({})
    setQuizComplete(false)
    setQuizId(null)
    setExamSubmitted(false)
    setTimeRemaining(examMode ? timeLimit * 60 : null)
  }

  // Setup view
  if (!quiz) {
    return (
      <div className="space-y-8">
        <div className="card p-8 lg:p-10">
          <h2 className="text-2xl font-bold text-white mb-2">Generate Quiz</h2>
          <p className="text-gray-400 mb-10">Customize your quiz and test your knowledge</p>

          {/* Mode Toggle */}
          <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={examMode}
                onChange={(e) => setExamMode(e.target.checked)}
                className="w-5 h-5 rounded border-white/20 bg-white/10 checked:bg-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-white">Exam Mode</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  Timed test with no hints. All questions answered before seeing results.
                </p>
              </div>
            </label>
          </div>

          <div className="grid md:grid-cols-2 gap-10 mb-10">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">Difficulty Level</label>
              <div className="flex gap-3">
                {['easy', 'medium', 'hard'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-xl font-medium capitalize transition-all",
                      difficulty === level
                        ? level === 'easy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 neon-green'
                        : level === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 neon-amber'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">
                Number of Questions: <span className="text-blue-400 font-bold">{count}</span>
              </label>
              <input
                type="range"
                min="3"
                max="15"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>3</span>
                <span>15</span>
              </div>
            </div>
          </div>

          {/* Time Limit for Exam Mode */}
          {examMode && (
            <div className="mb-10">
              <label className="block text-sm font-medium text-gray-300 mb-4">
                Time Limit: <span className="text-blue-400 font-bold">{timeLimit} minutes</span>
              </label>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>5 min</span>
                <span>60 min</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 mb-6">
              {error}
            </div>
          )}

          <button onClick={handleGenerate} disabled={loading} className="btn btn-primary shimmer-button">
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating Quiz...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {examMode ? 'Start Exam' : 'Generate Quiz'}
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  // Quiz complete
  if (quizComplete) {
    const totalQuestions = quiz.questions.length
    const scoreValue = getScore()
    const percentage = Math.round((scoreValue / totalQuestions) * 100)
    
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card p-12 lg:p-16 text-center"
      >
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-500/30 neon-blue">
          <span className="text-4xl font-bold text-white">{scoreValue}/{totalQuestions}</span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">Quiz Complete!</h2>
        <p className="text-gray-400 text-lg mb-10">
          You scored {scoreValue} out of {totalQuestions} ({percentage}%)
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button onClick={restartQuiz} className="btn btn-secondary">
            <RefreshCw className="w-4 h-4" />
            Retry Quiz
          </button>
          <button onClick={handleGenerate} className="btn btn-primary shimmer-button">
            <Sparkles className="w-4 h-4" />
            New Quiz
          </button>
        </div>
      </motion.div>
    )
  }

  // Quiz in progress
  const questions = quiz.questions
  const currentQ = questions[currentQuestion]
  const isCorrect = selectedAnswer === currentQ?.correctIndex
  const answeredCount = getAnsweredCount()
  const allAnswered = answeredCount === questions.length

  return (
    <div className="space-y-6">
      {/* Timer and Progress for Exam Mode */}
      {examMode && (
        <div className="card p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Clock className={cn(
              "w-5 h-5",
              timeRemaining < 60 ? "text-red-400" : "text-blue-400"
            )} />
            <div>
              <div className={cn(
                "text-2xl font-bold",
                timeRemaining < 60 ? "text-red-400" : "text-white"
              )}>
                {formatTime(timeRemaining)}
              </div>
              <div className="text-xs text-gray-400">Time Remaining</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{answeredCount}/{questions.length}</div>
            <div className="text-xs text-gray-400">Answered</div>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
          />
        </div>
        <span className="text-sm text-gray-400 font-medium whitespace-nowrap">
          {currentQuestion + 1} / {questions.length}
        </span>
      </div>

      {/* Question Card */}
      <motion.div
        key={currentQuestion}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="card p-8 lg:p-10"
      >
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-400 font-semibold uppercase tracking-wider">
              Question {currentQuestion + 1}
            </span>
            {examMode && answers[currentQuestion] !== undefined && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> Answered
              </span>
            )}
          </div>
          <h3 className="text-2xl font-bold text-white mt-2">{currentQ?.question}</h3>
        </div>

        <div className="space-y-3 mb-8">
          {currentQ?.options?.map((option, i) => {
            const isSelected = selectedAnswer === i
            const isCorrectAnswer = i === currentQ.correctIndex
            const showCorrectness = showResult && !examMode

            return (
              <button
                key={i}
                onClick={() => handleSelectAnswer(i)}
                disabled={showCorrectness}
                className={cn(
                  "w-full p-4 rounded-xl text-left font-medium transition-all flex items-center gap-4",
                  showCorrectness
                    ? isCorrectAnswer
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 border neon-green"
                      : isSelected
                        ? "bg-red-500/20 border-red-500/50 text-red-400 border"
                        : "bg-white/5 border-white/10 text-gray-400 border"
                    : isSelected
                      ? "bg-blue-500/20 border-blue-500/50 text-blue-400 border neon-blue"
                      : "bg-white/5 border-white/10 text-gray-300 border hover:bg-white/10 hover:border-white/20"
                )}
              >
                <span className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0",
                  showCorrectness
                    ? isCorrectAnswer ? "bg-emerald-500/30" : isSelected ? "bg-red-500/30" : "bg-white/10"
                    : isSelected ? "bg-blue-500/30" : "bg-white/10"
                )}>
                  {showCorrectness ? (
                    isCorrectAnswer ? <Check className="w-4 h-4" /> : isSelected ? <X className="w-4 h-4" /> : String.fromCharCode(65 + i)
                  ) : String.fromCharCode(65 + i)}
                </span>
                <span>{option}</span>
              </button>
            )
          })}
        </div>

        {showResult && currentQ?.explanation && !examMode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "p-4 rounded-xl mb-6",
              isCorrect ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-amber-500/10 border border-amber-500/30"
            )}
          >
            <p className={cn("text-sm", isCorrect ? "text-emerald-400" : "text-amber-400")}>
              <strong>Explanation:</strong> {currentQ.explanation}
            </p>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          {examMode ? (
            <>
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestion === 0}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex gap-3">
                {currentQuestion < questions.length - 1 ? (
                  <button onClick={handleNextQuestion} className="btn btn-primary">
                    Next Question
                  </button>
                ) : (
                  <button 
                    onClick={handleExamSubmit} 
                    className={cn(
                      "btn",
                      allAnswered ? "btn-primary shimmer-button" : "btn-secondary"
                    )}
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    Submit Exam {!allAnswered && `(${answeredCount}/${questions.length})`}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="ml-auto">
              {!showResult ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={selectedAnswer === null}
                  className="btn btn-primary"
                >
                  Submit Answer
                </button>
              ) : (
                <button onClick={handleNextQuestion} className="btn btn-primary shimmer-button">
                  {currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Exam Mode Warning */}
        {examMode && !allAnswered && currentQuestion === questions.length - 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-400">
              <strong>Warning:</strong> You haven't answered all questions yet. You can go back and answer them before submitting.
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
