'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Tag, Download, Loader2, Plus } from 'lucide-react'

export default function CategoriesPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Record<string, number>>({})

  useEffect(() => {
    fetch('/api/wavecore/store')
      .then(r => r.json())
      .then(data => {
        setProducts(data.products || [])
        const cats: Record<string, number> = {}
        data.products?.forEach((p: any) => {
          const cat = p.category || 'Uncategorized'
          cats[cat] = (cats[cat] || 0) + 1
        })
        setCategories(cats)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - Categories',
      '='.repeat(50),
      'Generated: ' + new Date().toLocaleString(),
      '',
      ...Object.entries(categories).map(([cat, count]) => `${cat}: ${count} products`),
      '',
      '© 2026 IntelliWavve'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'categories.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Categories</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Tag className="w-6 h-6 text-pink-500" /> Categories</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(categories).map(([cat, count]) => (
              <div key={cat} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <p className="font-bold">{cat}</p>
                <p className="text-sm text-muted-foreground">{count} products</p>
              </div>
            ))}
            {Object.keys(categories).length === 0 && (
              <p className="col-span-3 text-center py-8 text-muted-foreground">No categories yet</p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}