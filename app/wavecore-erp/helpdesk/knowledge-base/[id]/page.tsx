'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  BookOpen, ArrowLeft, Loader2, ThumbsUp, ThumbsDown, Eye, Calendar,
  FileEdit, AlertTriangle, CheckCircle2, Hash,
} from 'lucide-react'

export default function ArticleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [article, setArticle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchArticle = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/helpdesk/knowledge-base/' + id)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      setArticle(data.article)
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { if (id) fetchArticle() }, [id])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 2500) }

  const vote = async (helpful: boolean) => {
    await fetch('/api/wavecore/helpdesk/knowledge-base/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(helpful ? { helpful: 1 } : { notHelpful: 1 }),
    })
    flash(helpful ? 'Thank you for the feedback!' : 'Thanks — we\'ll improve this')
    fetchArticle()
  }

  if (loading) return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
    </div>
  )

  if (error || !article) return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
        <p className="text-red-300">{error || 'Article not found'}</p>
        <Link href="/wavecore-erp/helpdesk/knowledge-base" className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold">
          Back to Knowledge Base
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/helpdesk" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Helpdesk · Article</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <button onClick={() => router.back()} className="text-sm text-neutral-400 hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        <article className="bg-neutral-900 rounded-2xl border border-neutral-800 p-8">
          <div className="flex justify-between items-start gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-900/40 text-purple-300">{article.category}</span>
                <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (article.status === 'PUBLISHED' ? 'bg-green-900/40 text-green-300' : 'bg-yellow-900/40 text-yellow-300')}>{article.status}</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">{article.title}</h1>
              <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {article.views || 0} views</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(article.updatedAt || article.createdAt).toLocaleDateString('en-GB')}</span>
                <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {article.helpful || 0} helpful</span>
                {article.slug && <span className="flex items-center gap-1 font-mono"><Hash className="w-3 h-3" />{article.slug}</span>}
              </div>
            </div>
            <Link href="/wavecore-erp/helpdesk/knowledge-base" className="px-3 py-2 rounded-xl bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-bold flex items-center gap-1">
              <FileEdit className="w-3 h-3" /> Edit
            </Link>
          </div>

          <div className="prose prose-invert max-w-none">
            <p className="text-sm text-neutral-200 whitespace-pre-wrap leading-relaxed">{article.body}</p>
          </div>

          {article.tags && (
            <div className="mt-6 pt-6 border-t border-neutral-800">
              <p className="text-xs text-neutral-500 uppercase tracking-wide font-bold mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {article.tags.split(',').map((tag: string) => (
                  <span key={tag} className="px-2 py-1 rounded-lg bg-neutral-800 text-neutral-300 text-xs">{tag.trim()}</span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-neutral-800">
            <p className="text-sm text-white font-bold mb-3">Was this article helpful?</p>
            <div className="flex gap-2">
              <button onClick={() => vote(true)} className="px-5 py-2.5 rounded-xl bg-green-900/50 hover:bg-green-800 text-green-300 font-bold flex items-center gap-2">
                <ThumbsUp className="w-4 h-4" /> Yes ({article.helpful || 0})
              </button>
              <button onClick={() => vote(false)} className="px-5 py-2.5 rounded-xl bg-red-900/50 hover:bg-red-800 text-red-300 font-bold flex items-center gap-2">
                <ThumbsDown className="w-4 h-4" /> No ({article.notHelpful || 0})
              </button>
            </div>
          </div>
        </article>
      </main>
    </div>
  )
}