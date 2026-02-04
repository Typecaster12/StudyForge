import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, RefreshCw, ChevronLeft, ChevronRight, Check, X, RotateCcw, Layers } from 'lucide-react'
import { cn } from '../lib/utils'
import { generateFlashcards } from '../lib/api'
import useStore from '../store/useStore'
import api from '../lib/api'

export default function FlashcardsTab({ document }) {
  const { flashcards, setFlashcards, flashcardProgress, updateFlashcardProgress } = useStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [count, setCount] = useState(10)
  const [currentCard, setCurrentCard] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [studyMode, setStudyMode] = useState(false)

  const deck = flashcards[document.id]
  const cards = deck?.cards || []
  const progress = flashcardProgress[document.id] || {}

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setCurrentCard(0)
    setIsFlipped(false)

    try {
      const result = await generateFlashcards(document.content, { cardCount: count })
      setFlashcards(document.id, result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePrev = () => {
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentCard((prev) => (prev > 0 ? prev - 1 : cards.length - 1))
    }, 150)
  }

  const handleNext = () => {
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentCard((prev) => (prev < cards.length - 1 ? prev + 1 : 0))
    }, 150)
  }

  const handleMarkKnown = async (known) => {
    updateFlashcardProgress(document.id, currentCard, known)
    
    // Save to database if cards have IDs
    const currentCardData = cards[currentCard]
    if (currentCardData?.id) {
      try {
        await api.patch(`/flashcards/cards/${currentCardData.id}/review`, {
          correct: known
        })
        console.log('✅ Flashcard review saved to database')
      } catch (error) {
        console.error('Failed to save flashcard review:', error)
        // Continue anyway - local state is updated
      }
    }
    
    if (studyMode) handleNext()
  }

  const knownCount = Object.values(progress).filter(Boolean).length
  const totalCards = cards.length

  // Setup view
  if (!deck) {
    return (
      <div className="space-y-8">
        <div className="card p-8 lg:p-10">
          <h2 className="text-2xl font-bold text-white mb-2">Generate Flashcards</h2>
          <p className="text-gray-400 mb-10">Create study flashcards from your document</p>

          <div className="mb-10 max-w-md">
            <label className="block text-sm font-medium text-gray-300 mb-4">
              Number of Cards: <span className="text-blue-400 font-bold">{count}</span>
            </label>
            <input
              type="range"
              min="5"
              max="25"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>5</span>
              <span>25</span>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 mb-6">
              {error}
            </div>
          )}

          <button onClick={handleGenerate} disabled={loading} className="btn btn-primary shimmer-button">
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Flashcards
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Flashcards</h2>
          <p className="text-gray-400">
            {knownCount} / {totalCards} mastered
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStudyMode(!studyMode)}
            className={cn("btn", studyMode ? "btn-primary" : "btn-secondary")}
          >
            {studyMode ? 'Exit Study Mode' : 'Study Mode'}
          </button>
          <button onClick={handleGenerate} className="btn btn-ghost">
            <RefreshCw className="w-4 h-4" />
            New Cards
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(knownCount / totalCards) * 100}%` }}
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
        />
      </div>

      {/* Card */}
      <div className="flex items-center justify-center py-8">
        <button
          onClick={handlePrev}
          className="p-3 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors mr-4 lg:mr-8"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        <div
          className="relative w-full max-w-2xl aspect-[4/3] cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
          style={{ perspective: '1000px' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentCard}-${isFlipped}`}
              initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              <div className={cn(
                "card h-full p-8 lg:p-10 flex flex-col items-center justify-center text-center",
                isFlipped ? "bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/20" : ""
              )}>
                <span className={cn(
                  "text-sm font-semibold mb-6",
                  isFlipped ? "text-emerald-400" : "text-blue-400"
                )}>
                  {isFlipped ? 'Definition' : 'Term'}
                </span>
                <p className={cn(
                  "font-semibold leading-relaxed",
                  isFlipped ? "text-xl lg:text-2xl text-gray-200" : "text-2xl lg:text-3xl text-white"
                )}>
                  {isFlipped ? cards[currentCard]?.definition : cards[currentCard]?.term}
                </p>
                {isFlipped && cards[currentCard]?.example && (
                  <p className="text-gray-400 text-sm mt-4 italic">
                    Example: {cards[currentCard].example}
                  </p>
                )}
                <div className="absolute bottom-6 flex items-center gap-2 text-gray-500">
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-sm">Click to flip</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          onClick={handleNext}
          className="p-3 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors ml-4 lg:ml-8"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      </div>

      {/* Card Counter */}
      <div className="flex justify-center gap-2 flex-wrap">
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => { setCurrentCard(i); setIsFlipped(false) }}
            className={cn(
              "w-3 h-3 rounded-full transition-all",
              i === currentCard
                ? "bg-blue-500 scale-125 neon-blue"
                : progress[i]
                  ? "bg-emerald-500/50"
                  : "bg-white/20 hover:bg-white/40"
            )}
          />
        ))}
      </div>

      {/* Study Mode Actions */}
      {studyMode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center gap-4"
        >
          <button
            onClick={() => handleMarkKnown(false)}
            className="btn btn-ghost border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <X className="w-5 h-5" />
            Still Learning
          </button>
          <button
            onClick={() => handleMarkKnown(true)}
            className="btn btn-ghost border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
          >
            <Check className="w-5 h-5" />
            Got It!
          </button>
        </motion.div>
      )}
    </div>
  )
}
