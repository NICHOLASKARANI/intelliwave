'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Send, Lock, MessageSquare, User, Clock, Loader2, CheckCircle2 } from 'lucide-react'

type Ticket = {
  id: string
  ticketNumber: string
  subject: string
  description?: string
  priority: string
  status: string
  requesterName?: string
  requesterEmail?: string
  assigneeName?: string
  createdAt: string
  firstResponseAt?: string
  resolvedAt?: string
  dueAt?: string
}

type Comment = {
  id: string
  authorName?: string
  authorEmail?: string
  content: string
  isInternal: boolean
  createdAt: string
}

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

export default function TicketDetailPage() {
  const params = useParams()
  const ticketId = params.id as string
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!ticketId) return
    load()
  }, [ticketId])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/helpdesk/tickets/' + ticketId)
      if (res.ok) {
        const d = await res.json()
        setTicket(d.ticket)
        setComments(d.comments || [])
      }
    } catch {}
    setLoading(false)
  }

  const sendComment = async () => {
    if (!newComment.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/wavecore/helpdesk/tickets/' + ticketId + '/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim(), isInternal }),
      })
      if (res.ok) {
        setNewComment('')
        load()
      }
    } catch {}
    setSending(false)
  }

  const updateStatus = async (newStatus: string) => {
    try {
      const res = await fetch('/api/wavecore/helpdesk/tickets/' + ticketId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) load()
    } catch {}
  }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-400 animate-spin" /></div>

  if (!ticket) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Ticket not found</div>

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/wavecore-erp/helpdesk" className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Helpdesk
        </Link>

        {/* Ticket header */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-4">
          <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
            <div>
              <p className="text-xs font-mono text-slate-500 mb-1">{ticket.ticketNumber}</p>
              <h1 className="text-2xl font-bold mb-2">{ticket.subject}</h1>
              <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                <span className="flex items-center gap-1"><User className="w-3 h-3" /> {ticket.requesterName || 'Unknown'}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(ticket.createdAt).toLocaleString()}</span>
              </div>
            </div>
            <select
              value={ticket.status}
              onChange={e => updateStatus(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-medium"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          {ticket.description && (
            <div className="mt-4 p-4 bg-slate-800/50 rounded-xl text-sm text-slate-300 whitespace-pre-wrap">
              {ticket.description}
            </div>
          )}
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-500">
            <span>Priority: <strong className="text-white">{ticket.priority}</strong></span>
            {ticket.firstResponseAt && <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-400" /> First response: {new Date(ticket.firstResponseAt).toLocaleString()}</span>}
            {ticket.dueAt && <span>Due: {new Date(ticket.dueAt).toLocaleString()}</span>}
          </div>
        </div>

        {/* Comments */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-4">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Conversation ({comments.length})
          </h2>
          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No comments yet</p>
            ) : (
              comments.map(c => (
                <div key={c.id} className={'p-4 rounded-xl ' + (c.isInternal ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-slate-800')}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-white">{c.authorName || 'Unknown'}</span>
                    {c.isInternal && <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded-full flex items-center gap-1"><Lock className="w-2 h-2" /> Internal</span>}
                    <span className="text-xs text-slate-500 ml-auto">{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{c.content}</p>
                </div>
              ))
            )}
          </div>

          {/* New comment */}
          <div className="mt-4 pt-4 border-t border-slate-800">
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white mb-3 text-sm"
            />
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
                <Lock className="w-3 h-3" /> Internal note
              </label>
              <button onClick={sendComment} disabled={sending || !newComment.trim()} className="ml-auto px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-xl font-medium text-sm disabled:opacity-50 flex items-center gap-2">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}