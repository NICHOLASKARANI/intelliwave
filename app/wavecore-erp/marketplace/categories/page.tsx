'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/marketplace/categories')
      .then(r => r.json())
      .then(data => setCategories(data.categories || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/marketplace" className="font-bold text-lg">← Marketplace</Link>
          <span className="font-bold">All Categories</span>
          <div className="w-16"></div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">All Categories</h1>
        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map(cat => (
              <Link key={cat.name} href={`/marketplace?category=${encodeURIComponent(cat.name)}`}
                className="p-4 rounded-xl border bg-white dark:bg-neutral-900 hover:border-blue-300">
                <p className="text-2xl mb-1">{cat.icon || '📦'}</p>
                <p className="font-medium text-sm">{cat.name}</p>
                <p className="text-xs text-muted-foreground">{cat.listingCount || 0} listings</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}