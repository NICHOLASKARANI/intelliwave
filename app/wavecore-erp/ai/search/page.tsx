'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, Loader2, ArrowRight, FileText, Users, Package, DollarSign } from 'lucide-react'

export default function AISearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    setLoading(true)
    const debounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/wavecore/search?q=${encodeURIComponent(query)}&limit=10`)
        if (res.ok) { const data = await res.json(); setResults(data.results || []) }
      } catch {} finally { setLoading(false) }
    }, 400)
    return () => clearTimeout(debounce)
  }, [query])

  const typeIcons: Record<string, any> = {
    customer: Users, invoice: FileText, product: Package,
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/ai" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">AI Search</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Search className="w-6 h-6 text-purple-500" /> AI Smart Search</h1>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-xl border text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Search across customers, invoices, products..."
            autoFocus
          />
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500" /></div>
        ) : results.length > 0 ? (
          <div className="space-y-3">
            {results.map(r => {
              const Icon = typeIcons[r.type] || FileText
              return (
                <div key={`${r.type}-${r.id}`} className="p-4 rounded-xl border bg-white dark:bg-neutral-900 flex items-center gap-3 hover:border-purple-300 cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.subtitle} • {r.type}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              )
            })}
          </div>
        ) : query.length >= 2 ? (
          <p className="text-center py-12 text-muted-foreground">No results found for "{query}"</p>
        ) : (
          <div className="text-center py-16">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">Type to search across all your business data</p>
          </div>
        )}
      </main>
    </div>
  )
}