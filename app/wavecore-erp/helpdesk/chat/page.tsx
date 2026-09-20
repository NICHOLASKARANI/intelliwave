'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  MessageSquare, Loader2, RefreshCw, Search, Send, User, Ticket,
  Clock, CheckCircle2, AlertCircle,
} from 'lucide-react'

export default function ChatPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingComments, setLoadingComments] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/helpdesk/tickets')
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchTickets() }, [])

  const loadComments = async (ticketId: string) => {
    setLoadingComments(true)
    try {
      const res = await fetch('/api/wavecore/helpdesk/comments?ticketId=' + ticketId)
      const data = await res.json()
      setComments(data.comments || [])
    } catch {}
    finally { setLoadingComments(false) }
  }

  const selectTicket = (t: any) => {
    setSelectedTicket(t)
    setComments([])
    loadComments(t.id)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !selectedTicket) return
    setSending(true)
    try {
      const res = await fetch('/api/wavecore/helpdesk/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: selectedTicket.id, body: message.trim() }),
      })
      if (res.ok) {
        setMessage('')
        await loadComments(selectedTicket.id)
      }
    } finally { setSending(false) }
  }

  // Auto-scroll to bottom on new comment
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  const filtered = useMemo(() => {
    let list = [...tickets]
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(t => (t.subject || '').toLowerCase().includes(s) || (t.customerName || '').toLowerCase().includes(s))
    }
    return list
  }, [tickets, search])

  const statusStyle = (s: string) => {
    switch (s) {
      case 'OPEN': return 'bg-cyan-900/40 text-cyan-300'
      case 'IN_PROGRESS': return 'bg-yellow-900/40 text-yellow-300'
      case 'RESOLVED': return 'bg-green-900/40 text-green-300'
      default: return 'bg-neutral-800 text-neutral-400'
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/helpdesk" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Helpdesk · Live Chat</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <MessageSquare className="w-7 h-7 text-amber-400" /> Live Chat Console
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Real-time ticket conversations</p>
          </div>
          <button onClick={fetchTickets} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
            <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}

        <div className="grid md:grid-cols-[340px_1fr] gap-4 h-[700px]">
          {/* TICKET LIST SIDEBAR */}
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-neutral-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets..."
                  className="pl-9 pr-4 py-2 rounded-lg border border-neutral-700 bg-neutral-800 text-white w-full text-sm" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" /></div>
              ) : filtered.length === 0 ? (
                <p className="text-center text-sm text-neutral-500 py-8">No tickets</p>
              ) : (
                filtered.map(t => (
                  <button
                    key={t.id}
                    onClick={() => selectTicket(t)}
                    className={'w-full text-left p-3 border-b border-neutral-800 hover:bg-neutral-800 transition-colors ' + (selectedTicket?.id === t.id ? 'bg-neutral-800' : '')}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <p className="text-sm font-medium text-white line-clamp-1 flex-1">{t.subject}</p>
                      <span className={'px-1.5 py-0.5 rounded text-[9px] font-bold ' + statusStyle(t.status)}>{t.status}</span>
                    </div>
                    <p className="text-xs text-neutral-500">{t.customerName || 'Anonymous'}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* CHAT PANEL */}
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 flex flex-col overflow-hidden">
            {selectedTicket ? (
              <>
                <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-white">{selectedTicket.subject}</p>
                    <p className="text-xs text-neutral-500">{selectedTicket.customerName || 'Anonymous'} · {selectedTicket.category || 'GENERAL'}</p>
                  </div>
                  <Link href={'/wavecore-erp/helpdesk/tickets/' + selectedTicket.id} className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1">
                    <Ticket className="w-3 h-3" /> Full Ticket
                  </Link>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingComments ? (
                    <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" /></div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs mt-1">Start the conversation below</p>
                    </div>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(c.authorName || 'U').split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-xs font-bold text-amber-400">{c.authorName || 'User'}</span>
                            <span className="text-[10px] text-neutral-500">{new Date(c.createdAt).toLocaleString('en-GB')}</span>
                            {c.isInternal && <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-900/40 text-yellow-300 font-bold">INTERNAL</span>}
                          </div>
                          <div className="p-3 rounded-xl bg-neutral-800 text-sm text-neutral-200 whitespace-pre-wrap">{c.body}</div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={bottomRef} />
                </div>

                <form onSubmit={sendMessage} className="p-3 border-t border-neutral-800 flex gap-2">
                  <input
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Type a reply..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-amber-500"
                    disabled={sending}
                  />
                  <button type="submit" disabled={sending || !message.trim()} className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-neutral-500">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-3 opacity-20" />
                  <p>Select a ticket to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}