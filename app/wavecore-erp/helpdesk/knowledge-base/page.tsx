'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Plus, Search, Eye, ThumbsUp, Loader2, X } from 'lucide-react'

type Article = {
  id: string
  title: string
  slug: string
  content: string
  category?: string
  isPublished: boolean
  viewCount: number
  helpfulCount: number
  authorName?: string
  updatedAt: string
}

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState<Article | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newPublished, setNewPublished] = useState(false)
  const [creating, setCreating] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/helpdesk/knowledge-base')
      if (res.ok) {
        const d = await res.json()
        setArticles(d.articles || [])
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    if (!search) return articles
    const s = search.toLowerCase()
    return articles.filter(a =>
      a.title.toLowerCase().includes(s) ||
      a.content.toLowerCase().includes(s) ||
      (a.category || '').toLowerCase().includes(s)
    )
  }, [articles, search])

  const createArticle = async () => {
    if (!newTitle.trim() || !newContent.trim()) return
    setCreating(true)
    setMsg('')
    try {
      const res = await fetch('/api/wavecore/helpdesk/knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
          category: newCategory.trim() || null,
          isPublished: newPublished,
        }),
      })
      const d = await res.json()
      if (res.ok) {
        setShowCreate(false)
        setNewTitle('')
        setNewContent('')
        setNewCategory('')
        setNewPublished(false)
        setMsg('Article created')
        load()
      } else {
        setMsg(d.error || 'Failed to create')
      }
    } catch (e: any) {
      setMsg(e.message)
    }
    setCreating(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <Link href="/wavecore-erp/helpdesk" className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Helpdesk
        </Link>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-400" /> Knowledge Base
            </h1>
            <p className="text-slate-400">Self-service articles for customers</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-xl text-sm font-medium flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Article
          </button>
        </div>

        {msg && (
          <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-sm">{msg}</div>
        )}

        <div className="relative mb-4">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="w-full pl-10 pr-3 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm"
          />
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">No articles yet</p>
            <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-xl text-sm">
              Create First Article
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {filtered.map(a => (
              <button
                key={a.id}
                onClick={() => setSelected(a)}
                className="text-left bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-white line-clamp-1">{a.title}</h3>
                  {a.isPublished ? (
                    <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full shrink-0">Published</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded-full shrink-0">Draft</span>
                  )}
                </div>
                <p className="text-sm text-slate-400 line-clamp-2 mb-3">{a.content}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {a.viewCount}</span>
                  <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {a.helpfulCount}</span>
                  {a.category && <span className="ml-auto">{a.category}</span>}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Article view modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">{selected.title}</h2>
                  {selected.category && <span className="text-xs text-slate-500">{selected.category}</span>}
                </div>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                {selected.content}
              </div>
            </div>
          </div>
        )}

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setShowCreate(false)}>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">New Article</h2>
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Title"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white mb-3"
              />
              <input
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                placeholder="Category (optional)"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white mb-3"
              />
              <textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="Content"
                rows={8}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white mb-3 font-mono text-sm"
              />
              <label className="flex items-center gap-2 text-sm text-slate-300 mb-4 cursor-pointer">
                <input type="checkbox" checked={newPublished} onChange={e => setNewPublished(e.target.checked)} />
                Publish immediately
              </label>
              <div className="flex gap-2">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl">Cancel</button>
                <button onClick={createArticle} disabled={creating || !newTitle.trim() || !newContent.trim()} className="flex-1 py-3 bg-blue-500 hover:bg-blue-400 rounded-xl font-bold disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}