'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Loader2, Printer, Trash2, Tag, X, Package, Search } from 'lucide-react'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState('')
  const [search, setSearch] = useState('')
  const [newCategory, setNewCategory] = useState('')

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/store/categories')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (err) {
      setError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategory.trim()) return
    try {
      const res = await fetch('/api/wavecore/store/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory })
      })
      if (res.ok) {
        setNewCategory('')
        setShowForm(false)
        fetchCategories()
      }
    } catch (err) {
      setError('Failed to create')
    }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return
    setDeleting(id)
    try {
      await fetch(`/api/wavecore/store/categories?id=${id}`, { method: 'DELETE' })
      fetchCategories()
    } catch (err) {
      setError('Delete failed')
    } finally {
      setDeleting('')
    }
  }

  const filtered = categories.filter(c => (c.name || c.category || '').toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Categories</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tag className="w-6 h-6 text-pink-500" /> Categories ({categories.length})
          </h1>
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2.5 rounded-xl bg-pink-600 text-white font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Category
          </button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600">{error}</div>}

        {showForm && (
          <form onSubmit={createCategory} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">New Category</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-red-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex gap-3">
              <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Category name" className="flex-1 px-4 py-2 rounded-xl border" />
              <button type="submit" className="px-6 py-2 rounded-xl bg-pink-600 text-white font-bold">Create</button>
            </div>
          </form>
        )}

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search categories..." />
        </div>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No categories</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map((cat, i) => (
              <div key={cat.id || i} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
                <div>
                  <p className="font-bold">{cat.name || cat.category}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Package className="w-3 h-3" /> {cat.productCount || 0} products
                  </p>
                </div>
                <button onClick={() => deleteCategory(cat.id)} className="p-2 rounded-lg bg-red-50 text-red-600">
                  {deleting === cat.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}