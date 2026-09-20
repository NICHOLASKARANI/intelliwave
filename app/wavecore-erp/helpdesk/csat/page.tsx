'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Star, Loader2, RefreshCw, TrendingUp, ThumbsUp, ThumbsDown,
  MessageSquare, BarChart3, Smile, Frown, Meh,
} from 'lucide-react'

export default function CSATPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const rated = useMemo(() => tickets.filter(t => t.satisfactionRating), [tickets])

  const distribution = useMemo(() => {
    const d: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    for (const t of rated) d[Number(t.satisfactionRating)] = (d[Number(t.satisfactionRating)] || 0) + 1
    return d
  }, [rated])

  const avgCsat = rated.length > 0
    ? Math.round((rated.reduce((s, t) => s + Number(t.satisfactionRating), 0) / rated.length) * 10) / 10
    : 0

  const promoters = rated.filter(t => Number(t.satisfactionRating) >= 4).length
  const detractors = rated.filter(t => Number(t.satisfactionRating) <= 2).length
  const passives = rated.length - promoters - detractors

  const nps = rated.length > 0
    ? Math.round(((promoters - detractors) / rated.length) * 100)
    : 0

  const recentWithComments = useMemo(() => {
    return rated.filter(t => t.satisfactionComment).slice(0, 10)
  }, [rated])

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/helpdesk" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Helpdesk · CSAT</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Star className="w-7 h-7 text-yellow-400" /> Customer Satisfaction
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Feedback analytics · NPS · Rating distribution</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-yellow-500" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg">
                <Star className="w-5 h-5 mb-2" /><p className="text-3xl font-bold">{avgCsat}<span className="text-base">/5</span></p><p className="text-xs opacity-90">Average Rating</p>
              </div>
              <div className={'p-5 rounded-2xl text-white shadow-lg bg-gradient-to-br ' + (nps >= 0 ? 'from-green-600 to-emerald-800' : 'from-red-600 to-rose-800')}>
                <TrendingUp className="w-5 h-5 mb-2" /><p className="text-3xl font-bold">{nps}</p><p className="text-xs opacity-90">NPS Score</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-800 text-white shadow-lg">
                <MessageSquare className="w-5 h-5 mb-2" /><p className="text-3xl font-bold">{rated.length}</p><p className="text-xs opacity-90">Total Rated</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-800 text-white shadow-lg">
                <ThumbsUp className="w-5 h-5 mb-2" /><p className="text-3xl font-bold">{promoters}</p><p className="text-xs opacity-90">Promoters (4-5★)</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-yellow-400 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Rating Distribution
                </h3>
                {rated.length === 0 ? (
                  <p className="text-sm text-neutral-500 text-center py-8">No ratings yet</p>
                ) : (
                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map(rating => {
                      const count = distribution[rating] || 0
                      const pct = rated.length > 0 ? Math.round((count / rated.length) * 100) : 0
                      const colors: Record<number, string> = { 5: 'bg-green-500', 4: 'bg-cyan-500', 3: 'bg-yellow-500', 2: 'bg-orange-500', 1: 'bg-red-500' }
                      return (
                        <div key={rating} className="flex items-center gap-3">
                          <div className="w-12 flex items-center gap-1">
                            <span className="text-sm font-bold text-white">{rating}</span>
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          </div>
                          <div className="flex-1 bg-neutral-800 rounded-full h-3">
                            <div className={colors[rating] + ' h-3 rounded-full'} style={{ width: pct + '%' }}></div>
                          </div>
                          <span className="w-16 text-right text-xs text-neutral-400">{count} ({pct}%)</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-cyan-400 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> NPS Breakdown
                </h3>
                {rated.length === 0 ? (
                  <p className="text-sm text-neutral-500 text-center py-8">No ratings yet</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-emerald-800 flex items-center justify-center">
                        <Smile className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-bold text-white">Promoters</span>
                          <span className="text-sm font-bold text-green-400">{promoters}</span>
                        </div>
                        <div className="w-full bg-neutral-800 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: (rated.length > 0 ? (promoters / rated.length) * 100 : 0) + '%' }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-600 to-amber-800 flex items-center justify-center">
                        <Meh className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-bold text-white">Passives</span>
                          <span className="text-sm font-bold text-yellow-400">{passives}</span>
                        </div>
                        <div className="w-full bg-neutral-800 rounded-full h-2">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{ width: (rated.length > 0 ? (passives / rated.length) * 100 : 0) + '%' }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-rose-800 flex items-center justify-center">
                        <Frown className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-bold text-white">Detractors</span>
                          <span className="text-sm font-bold text-red-400">{detractors}</span>
                        </div>
                        <div className="w-full bg-neutral-800 rounded-full h-2">
                          <div className="bg-red-500 h-2 rounded-full" style={{ width: (rated.length > 0 ? (detractors / rated.length) * 100 : 0) + '%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {recentWithComments.length > 0 && (
              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
                <div className="p-5 border-b border-neutral-800">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-pink-400 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Recent Feedback
                  </h3>
                </div>
                <div className="divide-y divide-neutral-800">
                  {recentWithComments.map(t => (
                    <div key={t.id} className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{t.customerName || 'Anonymous'}</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={'w-3 h-3 ' + (i < Number(t.satisfactionRating) ? 'text-yellow-500 fill-yellow-500' : 'text-neutral-700')} />
                            ))}
                          </div>
                        </div>
                        <span className="text-[10px] text-neutral-500">{new Date(t.createdAt).toLocaleDateString('en-GB')}</span>
                      </div>
                      <p className="text-sm text-neutral-300 italic">"{t.satisfactionComment}"</p>
                      <p className="text-xs text-neutral-500 mt-2">on ticket: <Link href={'/wavecore-erp/helpdesk/tickets/' + t.id} className="text-pink-400 hover:text-pink-300">{t.subject}</Link></p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rated.length === 0 && (
              <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
                <Star className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
                <p className="text-neutral-400 mb-2">No feedback collected yet</p>
                <p className="text-xs text-neutral-500">CSAT ratings are collected when tickets are resolved. Update a ticket with a satisfactionRating to see it here.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}