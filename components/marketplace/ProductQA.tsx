'use client'

import { useEffect, useState } from 'react'
import { HelpCircle, Loader2, Send, CheckCircle2, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface Answer {
  id: string
  answererId: string
  answererName: string | null
  answer: string
  isSellerAnswer: boolean
  createdAt: string
}

interface Question {
  id: string
  askerId: string
  askerName: string | null
  question: string
  createdAt: string
  answers: Answer[]
}

interface ProductQAProps {
  listingId: number
  sellerId?: string | null
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export default function ProductQA({ listingId, sellerId }: ProductQAProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [showAskModal, setShowAskModal] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [answerFor, setAnswerFor] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [answering, setAnswering] = useState(false)
  const [error, setError] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>({})

  const loadQuestions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/marketplace/qa?listingId=${listingId}`)
      if (res.ok) {
        const d = await res.json()
        setQuestions(d.questions || [])
      }
    } finally { setLoading(false) }
  }

  useEffect(() => {
    loadQuestions()
    fetch('/api/wavecore/auth/session')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.userId) setCurrentUserId(d.userId) })
      .catch(() => {})
  }, [listingId])

  const askQuestion = async () => {
    setError('')
    if (newQuestion.trim().length < 5) { setError('Please enter at least 5 characters'); return }
    setAsking(true)
    try {
      const res = await fetch('/api/marketplace/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, question: newQuestion.trim() }),
      })
      if (res.ok) {
        setNewQuestion('')
        setShowAskModal(false)
        loadQuestions()
      } else {
        const d = await res.json()
        setError(d.error || 'Failed to ask')
      }
    } finally { setAsking(false) }
  }

  const submitAnswer = async (qaId: string) => {
    if (answerText.trim().length < 3) { alert('Answer too short'); return }
    setAnswering(true)
    try {
      const res = await fetch(`/api/marketplace/qa/${qaId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: answerText.trim() }),
      })
      if (res.ok) {
        setAnswerText('')
        setAnswerFor(null)
        loadQuestions()
      } else {
        const d = await res.json()
        alert(d.error || 'Failed to answer')
      }
    } finally { setAnswering(false) }
  }

  const onAskClick = () => {
    if (!currentUserId) {
      window.location.href = `/wavecore-erp/auth/login?redirect=/marketplace/listing/${listingId}`
      return
    }
    setShowAskModal(true)
  }

  return (
    <section id="qa" className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-cyan-400" />
          Questions & Answers
          {questions.length > 0 && <span className="text-sm text-neutral-500 font-normal">({questions.length})</span>}
        </h2>
        <button
          onClick={onAskClick}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold flex items-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          Ask a Question
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-neutral-700">
          <HelpCircle className="w-12 h-12 mx-auto mb-3 text-neutral-600" />
          <p className="font-bold text-neutral-400 mb-1">No questions yet</p>
          <p className="text-sm text-neutral-500">Be the first to ask a question about this listing</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map(q => {
            const isExpanded = expandedAnswers[q.id] ?? (q.answers.length <= 2)
            const shownAnswers = isExpanded ? q.answers : q.answers.slice(0, 1)
            const hasMore = q.answers.length > 1
            const canAnswer = currentUserId && currentUserId !== q.askerId

            return (
              <div key={q.id} className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                {/* Question */}
                <div className="mb-3">
                  <div className="flex items-start gap-2 mb-1">
                    <span className="text-cyan-400 font-bold text-lg leading-none">Q</span>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{q.question}</p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {q.askerName || 'Anonymous'} · {timeAgo(q.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Answers */}
                {q.answers.length > 0 && (
                  <div className="ml-6 space-y-3 pl-4 border-l-2 border-neutral-800">
                    {shownAnswers.map(a => (
                      <div key={a.id}>
                        <div className="flex items-start gap-2">
                          <span className={`font-bold text-lg leading-none ${a.isSellerAnswer ? 'text-green-400' : 'text-blue-400'}`}>A</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-white">{a.answererName || 'User'}</span>
                              {a.isSellerAnswer && (
                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 flex items-center gap-0.5">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> Seller
                                </span>
                              )}
                              <span className="text-xs text-neutral-500 ml-auto">{timeAgo(a.createdAt)}</span>
                            </div>
                            <p className="text-sm text-neutral-300 whitespace-pre-wrap">{a.answer}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {hasMore && (
                      <button
                        onClick={() => setExpandedAnswers({ ...expandedAnswers, [q.id]: !isExpanded })}
                        className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                      >
                        {isExpanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show all {q.answers.length} answers</>}
                      </button>
                    )}
                  </div>
                )}

                {/* Answer input */}
                {canAnswer && (
                  answerFor === q.id ? (
                    <div className="mt-3 ml-6 space-y-2">
                      <textarea
                        value={answerText}
                        onChange={e => setAnswerText(e.target.value)}
                        rows={2}
                        maxLength={1000}
                        placeholder="Your answer..."
                        className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => submitAnswer(q.id)}
                          disabled={answering || !answerText.trim()}
                          className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold disabled:opacity-50"
                        >
                          {answering ? 'Posting...' : 'Post Answer'}
                        </button>
                        <button
                          onClick={() => { setAnswerFor(null); setAnswerText('') }}
                          className="px-4 py-1.5 rounded-lg bg-neutral-700 text-xs font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAnswerFor(q.id)}
                      className="mt-2 ml-6 text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3" /> Answer this question
                    </button>
                  )
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Ask modal */}
      {showAskModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowAskModal(false)}>
          <div className="bg-neutral-900 rounded-2xl max-w-lg w-full p-6 border border-neutral-800" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-2">Ask a Question</h2>
            <p className="text-xs text-neutral-400 mb-4">Your question and the seller's answer will be public</p>
            <textarea
              value={newQuestion}
              onChange={e => { setNewQuestion(e.target.value); setError('') }}
              rows={4}
              maxLength={500}
              placeholder="e.g. Does this come with a warranty?"
              className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm mb-2"
              autoFocus
            />
            <p className="text-xs text-neutral-500 mb-3">{newQuestion.length}/500</p>
            {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={askQuestion}
                disabled={asking || !newQuestion.trim()}
                className="flex-1 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {asking ? 'Posting...' : 'Post Question'}
              </button>
              <button
                onClick={() => { setShowAskModal(false); setNewQuestion(''); setError('') }}
                className="px-5 py-3 rounded-xl bg-neutral-800 font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}