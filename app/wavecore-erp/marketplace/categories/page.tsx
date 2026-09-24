'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Tag, Loader2, Package, ArrowRight, RefreshCw, Sparkles, TrendingUp,
  Car, Home, Shirt, Sofa, Laptop, Smartphone, LayoutGrid, Plus, X,
  Trash2, Pencil,
} from 'lucide-react'

const CATEGORY_ICONS: Record<string, any> = {
  Electronics: Laptop,
  'Mobile Phones': Smartphone,
  Furniture: Sofa,
  Vehicles: Car,
  Fashion: Shirt,
  Property: Home,
  Home: Home,
  Sports: Sparkles,
  GENERAL: Package,
}

const CATEGORY_COLORS: Record<string, string> = {
  Electronics: 'from-blue-500 to-indigo-600',
  'Mobile Phones': 'from-teal-500 to-emerald-600',
  Furniture: 'from-orange-500 to-amber-600',
  Vehicles: 'from-slate-500 to-slate-700',
  Fashion: 'from-pink-500 to-rose-600',
  Property: 'from-green-500 to-emerald-600',
  Home: 'from-lime-500 to-green-600',
  Sports: 'from-cyan-500 to-blue-600',
  GENERAL: 'from-neutral-500 to-neutral-700',
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: '', icon: '📦' })
  const [creating, setCreating] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [catRes, listRes] = await Promise.all([
        fetch('/api/marketplace/categories'),
        fetch('/api/marketplace/listings?limit=500'),
      ])
      const catData = await catRes.json()
      const listData = await listRes.json()
      setCategories(catData.categories || [])
      setListings(listData.listings || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 2500) }

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategory.name.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/marketplace/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory),
      })
      if (res.ok) {
        flash('Category created')
        setNewCategory({ name: '', icon: '📦' })
        setShowCreate(false)
        fetchAll()
      }
    } finally { setCreating(false) }
  }

  const deleteCategory = async (id: number, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return
    const res = await fetch(`/api/marketplace/categories?id=${id}`, { method: 'DELETE' })
    if (res.ok) { flash('Category deleted'); fetchAll() }
  }

  // Count listings per category
  const countByCategory = listings.reduce((acc: Record<string, number>, l: any) => {
    const c = l.category || 'GENERAL'
    acc[c] = (acc[c] || 0) + 1
    return acc
  }, {})

  const totalListings = listings.length

  // Merge API categories with known categories (so we show even empty ones)
  const allCategoryNames = new Set<string>([
    ...categories.map(c => c.name),
    ...Object.keys(countByCategory),
  ])

  const displayCategories = Array.from(allCategoryNames).map(name => {
    const cat = categories.find(c => c.name === name)
    return {
      id: cat?.id,
      name,
      icon: cat?.icon || '📦',
      listingCount: countByCategory[name] || 0,
    }
  }).sort((a, b) => b.listingCount - a.listingCount)

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/marketplace" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveMarket" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveMarket · Categories</span>
          </Link>
          <Link href="/wavecore-erp/marketplace/sell" className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold flex items-center gap-1">
            <Plus className="w-3 h-3" /> Sell
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Tag className="w-7 h-7 text-amber-400" /> Browse Categories
            </h1>
            <p className="text-sm text-neutral-400 mt-1">{displayCategories.length} categories · {totalListings} listings</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} />
            </button>
            <button onClick={() => setShowCreate(true)} className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Category
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800">{success}</div>}

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-amber-500" /></div>
        ) : displayCategories.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400 mb-4">No categories yet</p>
            <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create First Category
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayCategories.map(cat => {
              const Icon = CATEGORY_ICONS[cat.name] || LayoutGrid
              const color = CATEGORY_COLORS[cat.name] || 'from-neutral-500 to-neutral-700'
              return (
                <div key={cat.name} className="relative group">
                  <Link
                    href={'/wavecore-erp/marketplace?category=' + encodeURIComponent(cat.name)}
                    className="block p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-amber-500 transition-all"
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <p className="font-bold text-white mb-1">{cat.name}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-neutral-500">{cat.listingCount} listings</span>
                      <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                  {cat.id && (
                    <button
                      onClick={(e) => { e.preventDefault(); deleteCategory(cat.id, cat.name) }}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-red-900/60 text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete category"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowCreate(false)}>
          <form onSubmit={createCategory} onClick={e => e.stopPropagation()} className="w-full max-w-md bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl">
            <div className="p-5 border-b border-neutral-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-400" /> New Category
              </h2>
              <button type="button" onClick={() => setShowCreate(false)} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Category Name</label>
                <input value={newCategory.name} onChange={e => setNewCategory({ ...newCategory, name: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. Books" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Emoji</label>
                <input value={newCategory.icon} onChange={e => setNewCategory({ ...newCategory, icon: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="📚" maxLength={4} />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800">
              <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300">Cancel</button>
              <button type="submit" disabled={creating} className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}