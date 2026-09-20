'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Bot, Loader2, RefreshCw, Sparkles, Tag, AlertTriangle, CheckCircle2,
  TrendingUp, Zap, Target, Wand2, Gauge,
} from 'lucide-react'

const PRIORITY_KEYWORDS = {
  URGENT: ['urgent', 'critical', 'down', 'broken', 'outage', 'emergency', 'asap', 'immediately'],
  HIGH: ['important', 'issue', 'problem', 'error', 'failed', 'not working', 'bug', 'cannot'],
  MEDIUM: ['question', 'help', 'how', 'inquiry', 'request', 'need'],
}

const CATEGORY_KEYWORDS = {
  BILLING: ['invoice', 'payment', 'charge', 'refund', 'billing', 'mpesa', 'receipt', 'subscription'],
  TECHNICAL: ['error', 'bug', 'crash', 'api', 'server', 'database', 'login', 'password'],
  ACCOUNT: ['account', 'profile', 'settings', 'email', 'password', 'verification'],
  FEATURE: ['feature', 'request', 'enhancement', 'suggestion', 'add', 'improve'],
  FAQ: ['how', 'what', 'when', 'where', 'why', 'guide', 'help'],
}

function classifyTicket(subject: string, description: string) {
  const text = (subject + ' ' + description).toLowerCase()

  let priority = 'LOW'
  for (const [p, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
    if (keywords.some(k => text.includes(k))) { priority = p; break }
  }

  let category = 'GENERAL'
  let bestScore = 0
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.filter(k => text.includes(k)).length
    if (score > bestScore) { bestScore = score; category = cat }
  }

  const confidence = Math.min(95, 60 + bestScore * 10 + (priority !== 'LOW' ? 10 : 0))

  return { priority, category, confidence }
}

export default function AIClassificationPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/helpdesk/tickets')
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  // Auto-classify all tickets
  const classified = useMemo(() => {
    return tickets.map(t => {
      const suggestion = classifyTicket(t.subject || '', t.description || '')
      const matchesCurrent = suggestion.priority === t.priority && suggestion.category === t.category
      return { ...t, suggestion, matchesCurrent }
    })
  }, [tickets])

  const needsUpdate = classified.filter(c => !c.matchesCurrent)

  const applySuggestions = async () => {
    if (needsUpdate.length === 0) return
    if (!confirm(`Apply AI suggestions to ${needsUpdate.length} ticket(s)?`)) return
    setProcessing(true)
    let updated = 0
    for (const t of needsUpdate) {
      try {
        const res = await fetch('/api/wavecore/helpdesk/tickets/' + t.id, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priority: t.suggestion.priority, category: t.suggestion.category }),
        })
        if (res.ok) updated++
      } catch {}
    }
    setProcessing(false)
    alert(`Updated ${updated} ticket(s)`)
    fetchAll()
  }

  const bySuggestion = useMemo(() => {
    const p: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 }
    const c: Record<string, number> = {}
    for (const t of classified) {
      p[t.suggestion.priority] = (p[t.suggestion.priority] || 0) + 1
      c[t.suggestion.category] = (c[t.suggestion.category] || 0) + 1
    }
    return { priority: p, category: c }
  }, [classified])

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/helpdesk" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Helpdesk · AI Classification</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Bot className="w-7 h-7 text-violet-400" /> AI Ticket Classification
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Auto-triage priority & category from ticket content</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={applySuggestions} disabled={processing || needsUpdate.length === 0} className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-violet-900/40 disabled:opacity-50">
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              Apply {needsUpdate.length} Suggestion{needsUpdate.length === 1 ? '' : 's'}
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-violet-500" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-800 text-white shadow-lg">
                <Bot className="w-5 h-5 mb-2" /><p className="text-3xl font-bold">{classified.length}</p><p className="text-xs opacity-90">Total Analyzed</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg">
                <CheckCircle2 className="w-5 h-5 mb-2" /><p className="text-3xl font-bold">{classified.length - needsUpdate.length}</p><p className="text-xs opacity-90">Already Correct</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg">
                <AlertTriangle className="w-5 h-5 mb-2" /><p className="text-3xl font-bold">{needsUpdate.length}</p><p className="text-xs opacity-90">Needs Update</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-800 text-white shadow-lg">
                <Gauge className="w-5 h-5 mb-2" /><p className="text-3xl font-bold">{classified.length > 0 ? Math.round((classified.length - needsUpdate.length) / classified.length * 100) : 100}%</p><p className="text-xs opacity-90">Accuracy</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-violet-400 mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4" /> Suggested Priority Distribution
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {Object.entries(bySuggestion.priority).map(([p, count]) => {
                    const colors: Record<string, string> = { LOW: 'from-neutral-600 to-neutral-800', MEDIUM: 'from-blue-600 to-indigo-800', HIGH: 'from-orange-600 to-red-800', URGENT: 'from-red-600 to-rose-800' }
                    return (
                      <div key={p} className={'p-4 rounded-xl text-center bg-gradient-to-br text-white ' + colors[p]}>
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-[10px] uppercase font-bold mt-1 opacity-90">{p}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-cyan-400 mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Suggested Categories
                </h3>
                <div className="space-y-2">
                  {Object.entries(bySuggestion.category).sort((a: any, b: any) => b[1] - a[1]).map(([c, count]: any) => (
                    <div key={c} className="flex items-center justify-between text-sm">
                      <span className="text-neutral-400 uppercase font-bold text-xs">{c}</span>
                      <span className="text-white font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {classified.length === 0 ? (
              <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
                <Bot className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
                <p className="text-neutral-400">No tickets to classify yet</p>
              </div>
            ) : (
              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
                <div className="p-5 border-b border-neutral-800">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" /> Classification Results
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-800">
                      <tr>
                        <th className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400">Ticket</th>
                        <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Current</th>
                        <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">AI Suggestion</th>
                        <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Confidence</th>
                        <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classified.map(t => (
                        <tr key={t.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                          <td className="p-3 text-white text-sm">{t.subject}</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-300">{t.priority}/{t.category}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-violet-900/40 text-violet-300">{t.suggestion.priority}/{t.suggestion.category}</span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <div className="w-16 bg-neutral-700 rounded-full h-1.5">
                                <div className={'h-1.5 rounded-full ' + (t.suggestion.confidence >= 80 ? 'bg-green-500' : 'bg-yellow-500')} style={{ width: t.suggestion.confidence + '%' }}></div>
                              </div>
                              <span className="text-xs text-neutral-400">{t.suggestion.confidence}%</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            {t.matchesCurrent ? (
                              <span className="text-[10px] font-bold text-green-400">✓ Correct</span>
                            ) : (
                              <span className="text-[10px] font-bold text-yellow-400">Needs Update</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-6 p-5 rounded-2xl bg-violet-900/20 border border-violet-800/50 flex gap-3">
              <Sparkles className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-violet-200 space-y-1">
                <p><b>How it works:</b> The classifier scans ticket subject + description for keywords to suggest priority and category. No external AI needed — runs instantly in your browser.</p>
                <p><b>Confidence score:</b> Higher = more keyword matches found. Apply when confidence is high (≥ 80%).</p>
                <p><b>Future:</b> Connect to real ML models (OpenAI/Anthropic) for semantic classification when you're ready.</p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}