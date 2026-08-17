'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Globe, Search, Plus, BookOpen, Trash2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('General')

  const handleAdd = () => {
    if (!title) return
    setArticles([{ id: Date.now().toString(), title, content, category, views: 0, helpful: 0 }, ...articles])
    setShowAdd(false); setTitle(''); setContent('')
  }

  const filtered = articles.filter(a => a.title?.toLowerCase().includes(search.toLowerCase()))

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
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="w-6 h-6 text-blue-500" /> Knowledge Base</h1>
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-blue-600"><Plus className="w-4 h-4" /> Add Article</Button>
        </div>

        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Article title *" />
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-4 py-2.5 rounded-xl border">
                <option>General</option><option>Billing</option><option>Technical</option><option>Account</option>
              </select>
            </div>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" rows={5} placeholder="Article content" />
            <Button onClick={handleAdd} className="mt-4">Publish Article</Button>
          </div>
        )}

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-3 rounded-xl border text-sm w-full" placeholder="Search knowledge base..." />
        </div>

        {filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map(a => (
              <div key={a.id} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg">
                <p className="font-bold">{a.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{a.category}</p>
                <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{a.content}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {a.views} views</span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {a.helpful} helpful</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No articles yet</p>
          </div>
        )}
      </main>
    </div>
  )
}