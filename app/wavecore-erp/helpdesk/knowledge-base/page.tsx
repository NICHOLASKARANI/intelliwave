'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Download, Plus, Trash2, Search } from 'lucide-react'

interface Article {
  id: string
  title: string
  category: string
  views: number
}

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('General')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('kb-articles')
    if (saved) setArticles(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('kb-articles', JSON.stringify(articles))
  }, [articles])

  const addArticle = () => {
    if (!title) return
    setArticles(prev => [...prev, { id: Date.now().toString(), title, category, views: 0 }])
    setTitle('')
  }

  const deleteArticle = (id: string) => {
    setArticles(prev => prev.filter(a => a.id !== id))
  }

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Knowledge Base', '='.repeat(50), `Articles: ${articles.length}`, '', ...articles.map((a, i) => `${i+1}. ${a.title} (${a.category})`), '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'knowledge-base.pdf'; a.click()
  }

  const filtered = articles.filter(a => a.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/helpdesk" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Knowledge Base</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="w-6 h-6 text-purple-500" /> Knowledge Base</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
        </div>
        <div className="flex gap-2 mb-4">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl border" placeholder="Article title" />
          <button onClick={addArticle} className="px-4 py-2.5 rounded-xl bg-purple-600 text-white"><Plus className="w-4 h-4" /></button>
        </div>
        <div className="space-y-2">
          {filtered.map(a => (
            <div key={a.id} className="flex justify-between items-center p-4 rounded-xl bg-white dark:bg-neutral-900 border">
              <div><p className="font-medium">{a.title}</p><p className="text-xs text-muted-foreground">{a.category} • {a.views} views</p></div>
              <button onClick={() => deleteArticle(a.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">No articles</p>}
        </div>
      </main>
    </div>
  )
}