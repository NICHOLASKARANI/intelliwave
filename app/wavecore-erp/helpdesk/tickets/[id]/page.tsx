'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  Ticket, ArrowLeft, Loader2, Send, Trash2, FileEdit, X, Printer,
  Clock, AlertTriangle, CheckCircle2, User, Mail, Phone, Tag,
  MessageSquare, Paperclip, Calendar, Star, Activity, Zap, Shield,
} from 'lucide-react'

const STATUSES = ['OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
const CATEGORIES = ['GENERAL', 'BILLING', 'TECHNICAL', 'ACCOUNT', 'FEATURE', 'FAQ']

const statusStyle = (s: string, overdue: boolean) => {
  if (overdue) return 'bg-red-900/40 text-red-300 border-red-700'
  switch (s) {
    case 'OPEN': return 'bg-cyan-900/40 text-cyan-300 border-cyan-700'
    case 'IN_PROGRESS': return 'bg-yellow-900/40 text-yellow-300 border-yellow-700'
    case 'PENDING': return 'bg-orange-900/40 text-orange-300 border-orange-700'
    case 'RESOLVED': return 'bg-green-900/40 text-green-300 border-green-700'
    case 'CLOSED': return 'bg-neutral-800 text-neutral-400 border-neutral-700'
    default: return 'bg-neutral-800 text-neutral-400'
  }
}

const priorityStyle = (p: string) => {
  switch (p) {
    case 'URGENT': return 'bg-red-900/40 text-red-300 border-red-700'
    case 'HIGH': return 'bg-orange-900/40 text-orange-300 border-orange-700'
    case 'MEDIUM': return 'bg-blue-900/40 text-blue-300 border-blue-700'
    default: return 'bg-neutral-800 text-neutral-400 border-neutral-700'
  }
}

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [ticket, setTicket] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [attachments, setAttachments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [newComment, setNewComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [sending, setSending] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/helpdesk/tickets/' + id)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      setTicket(data.ticket)
      setComments(data.comments || [])
      setAttachments(data.attachments || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { if (id) fetchAll() }, [id])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 2500) }

  const sendComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/wavecore/helpdesk/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: id, body: newComment.trim(), isInternal }),
      })
      if (res.ok) { setNewComment(''); setIsInternal(false); flash('Comment added'); fetchAll() }
    } finally { setSending(false) }
  }

  const delComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return
    await fetch('/api/wavecore/helpdesk/comments/' + commentId, { method: 'DELETE' })
    flash('Comment deleted'); fetchAll()
  }

  const openEdit = () => {
    setEditForm({
      subject: ticket.subject || '', description: ticket.description || '',
      status: ticket.status || 'OPEN', priority: ticket.priority || 'MEDIUM',
      category: ticket.category || 'GENERAL', assigneeName: ticket.assigneeName || '',
      customerName: ticket.customerName || '', customerEmail: ticket.customerEmail || '',
      customerPhone: ticket.customerPhone || '',
      satisfactionRating: ticket.satisfactionRating || 0,
      satisfactionComment: ticket.satisfactionComment || '',
    })
    setShowEdit(true)
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/wavecore/helpdesk/tickets/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (res.ok) { flash('Ticket updated'); setShowEdit(false); fetchAll() }
    } finally { setSaving(false) }
  }

  const quickStatus = async (status: string) => {
    await fetch('/api/wavecore/helpdesk/tickets/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    flash('Status: ' + status); fetchAll()
  }

  const delTicket = async () => {
    if (!confirm('Delete this ticket and all its comments?')) return
    await fetch('/api/wavecore/helpdesk/tickets/' + id, { method: 'DELETE' })
    router.push('/wavecore-erp/helpdesk/tickets')
  }

  const pdf = () => window.open('/api/wavecore/helpdesk/tickets/' + id + '/pdf', '_blank')

  if (loading) return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
    </div>
  )

  if (error || !ticket) return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
        <p className="text-red-300">{error || 'Ticket not found'}</p>
        <Link href="/wavecore-erp/helpdesk/tickets" className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold">
          Back to Tickets
        </Link>
      </div>
    </div>
  )

  const now = new Date()
  const dueAt = ticket.dueAt ? new Date(ticket.dueAt) : null
  const resolved = ticket.resolvedAt ? new Date(ticket.resolvedAt) : null
  const isOverdue = !resolved && dueAt && dueAt < now
  const daysOpen = Math.floor((now.getTime() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/helpdesk" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Helpdesk · Ticket</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 flex-wrap gap-3">
          <div className="flex-1 min-w-[300px]">
            <button onClick={() => router.back()} className="text-sm text-neutral-400 hover:text-white flex items-center gap-1 mb-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Ticket className="w-7 h-7 text-pink-400" /> {ticket.subject}
            </h1>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className={'px-2 py-1 rounded-full text-[10px] font-bold border ' + statusStyle(ticket.status, isOverdue)}>{isOverdue ? 'OVERDUE' : ticket.status}</span>
              <span className={'px-2 py-1 rounded-full text-[10px] font-bold border ' + priorityStyle(ticket.priority)}>{ticket.priority}</span>
              <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-400">{ticket.category || 'GENERAL'}</span>
              <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {daysOpen}d open</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={pdf} className="px-3 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold" title="PDF">
              <Printer className="w-4 h-4" />
            </button>
            <button onClick={openEdit} className="px-4 py-3 rounded-xl bg-yellow-600 hover:bg-yellow-700 text-white font-bold flex items-center gap-2">
              <FileEdit className="w-4 h-4" /> Edit
            </button>
            <button onClick={delTicket} className="px-3 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* Quick status buttons */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <span className="text-xs text-neutral-500 self-center mr-2">Quick status:</span>
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => quickStatus(s)}
              disabled={ticket.status === s}
              className={'px-3 py-1.5 rounded-lg text-xs font-bold transition ' + (ticket.status === s ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed' : 'bg-neutral-800 hover:bg-pink-600 text-white')}
            >
              → {s}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
          {/* LEFT: Main content */}
          <div className="space-y-6">
            {/* Description */}
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
              <h3 className="text-sm font-bold uppercase tracking-wide text-pink-400 mb-3">Description</h3>
              <p className="text-sm text-neutral-300 whitespace-pre-wrap">{ticket.description || 'No description provided.'}</p>
            </div>

            {/* Comments */}
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
              <div className="p-5 border-b border-neutral-800 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-pink-400" />
                <h3 className="text-sm font-bold uppercase tracking-wide text-white">Conversation ({comments.length})</h3>
              </div>

              <div className="divide-y divide-neutral-800 max-h-[500px] overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-center text-sm text-neutral-500 py-8">No comments yet — start the conversation below</p>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="p-4 flex gap-3 group">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-rose-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(c.authorName || 'U').split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-bold text-pink-400">{c.authorName || 'User'}</span>
                          <span className="text-[10px] text-neutral-500">{new Date(c.createdAt).toLocaleString('en-GB')}</span>
                          {c.isInternal && <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-900/40 text-yellow-300 font-bold">INTERNAL</span>}
                        </div>
                        <p className="text-sm text-neutral-200 whitespace-pre-wrap">{c.body}</p>
                      </div>
                      <button onClick={() => delComment(c.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded bg-red-900/40 text-red-300 hover:bg-red-800 transition-opacity">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={sendComment} className="p-4 border-t border-neutral-800 space-y-3">
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment or reply..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-pink-500"
                />
                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-2 text-xs text-neutral-400">
                    <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} className="w-3 h-3" />
                    Internal note (hidden from customer)
                  </label>
                  <button type="submit" disabled={sending || !newComment.trim()} className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send
                  </button>
                </div>
              </form>
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
                <h3 className="text-sm font-bold uppercase tracking-wide text-cyan-400 mb-3 flex items-center gap-2">
                  <Paperclip className="w-4 h-4" /> Attachments ({attachments.length})
                </h3>
                <div className="space-y-2">
                  {attachments.map(a => (
                    <div key={a.id} className="flex justify-between items-center p-3 bg-neutral-800 rounded-xl">
                      <span className="text-sm text-white">{a.fileName}</span>
                      <span className="text-xs text-neutral-500">{Math.round((a.fileSize || 0) / 1024)} KB</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Sidebar metadata */}
          <div className="space-y-4">
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-3">Customer</h3>
              <div className="space-y-3">
                <InfoRow label="Name" value={ticket.customerName || '—'} icon={User} />
                <InfoRow label="Email" value={ticket.customerEmail || '—'} icon={Mail} />
                <InfoRow label="Phone" value={ticket.customerPhone || '—'} icon={Phone} />
              </div>
            </div>

            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-3">Assignment</h3>
              <div className="space-y-3">
                <InfoRow label="Assignee" value={ticket.assigneeName || 'Unassigned'} icon={User} />
                <InfoRow label="Category" value={ticket.category || 'GENERAL'} icon={Tag} />
                <InfoRow label="Channel" value={ticket.channel || 'WEB'} icon={Zap} />
              </div>
            </div>

            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-3">Timeline</h3>
              <div className="space-y-3">
                <InfoRow label="Created" value={new Date(ticket.createdAt).toLocaleString('en-GB')} icon={Calendar} />
                <InfoRow label="First Response" value={ticket.firstResponseAt ? new Date(ticket.firstResponseAt).toLocaleString('en-GB') : 'Pending'} icon={Activity} />
                <InfoRow label="SLA Due" value={dueAt ? dueAt.toLocaleString('en-GB') : '—'} icon={Shield} />
                {ticket.resolvedAt && <InfoRow label="Resolved" value={new Date(ticket.resolvedAt).toLocaleString('en-GB')} icon={CheckCircle2} />}
              </div>
            </div>

            {ticket.satisfactionRating > 0 && (
              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
                <h3 className="text-xs font-bold uppercase tracking-wide text-yellow-500 mb-3 flex items-center gap-2"><Star className="w-3 h-3" /> Customer Rating</h3>
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={'w-5 h-5 ' + (i <= ticket.satisfactionRating ? 'text-yellow-500 fill-yellow-500' : 'text-neutral-700')} />
                  ))}
                </div>
                {ticket.satisfactionComment && <p className="text-xs text-neutral-300 italic">"{ticket.satisfactionComment}"</p>}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* EDIT MODAL */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowEdit(false)}>
          <form onSubmit={saveEdit} onClick={e => e.stopPropagation()} className="w-full max-w-3xl bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><FileEdit className="w-5 h-5 text-yellow-400" /> Edit Ticket</h2>
              <button type="button" onClick={() => setShowEdit(false)} className="text-neutral-400 hover:text-yellow-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Subject</label>
                <input value={editForm.subject} onChange={e => setEditForm({ ...editForm, subject: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Description</label>
                <textarea rows={4} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Status</label>
                <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Priority</label>
                <select value={editForm.priority} onChange={e => setEditForm({ ...editForm, priority: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Category</label>
                <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Assignee</label>
                <input value={editForm.assigneeName} onChange={e => setEditForm({ ...editForm, assigneeName: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="Agent name" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Customer Name</label>
                <input value={editForm.customerName} onChange={e => setEditForm({ ...editForm, customerName: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Customer Email</label>
                <input value={editForm.customerEmail} onChange={e => setEditForm({ ...editForm, customerEmail: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Customer Phone</label>
                <input value={editForm.customerPhone} onChange={e => setEditForm({ ...editForm, customerPhone: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div className="md:col-span-2 border-t border-neutral-800 pt-4">
                <h3 className="text-sm font-bold text-yellow-400 mb-3">CSAT Feedback</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Rating (1-5)</label>
                    <select value={editForm.satisfactionRating} onChange={e => setEditForm({ ...editForm, satisfactionRating: Number(e.target.value) })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                      <option value={0}>Not rated</option>
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} ★</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Comment</label>
                    <input value={editForm.satisfactionComment} onChange={e => setEditForm({ ...editForm, satisfactionComment: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="Customer feedback" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800">
              <button type="button" onClick={() => setShowEdit(false)} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl bg-yellow-600 hover:bg-yellow-700 text-white font-bold">{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: any; icon?: any }) {
  return (
    <div className="flex items-start gap-2">
      {Icon && <Icon className="w-4 h-4 text-neutral-500 mt-0.5 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">{label}</p>
        <p className="text-sm text-white break-words">{value}</p>
      </div>
    </div>
  )
}