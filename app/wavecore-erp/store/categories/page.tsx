'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Loader2, Trash2, Tag, X, Search, Package, Printer, CheckCircle2, AlertTriangle, BarChart3, Layers, Tags } from 'lucide-react'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState('')
  const [search, setSearch] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [activeView, setActiveView] = useState('all')

  const fetchCategories = async () => {
    setLoading(true)
    setError('')
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
    setError('')
    setSuccess('')
    if (!newCategory.trim()) {
      setError('Please enter a category name')
      return
    }
    try {
      const res = await fetch('/api/wavecore/store/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory.trim() })
      })
      const data = await res.json()
      if (res.ok) {
        setNewCategory('')
        setShowForm(false)
        setSuccess('Category created successfully!')
        setTimeout(() => setSuccess(''), 3000)
        fetchCategories()
      } else {
        setError(data.error || 'Failed to create category')
      }
    } catch (err) {
      setError('Network error - failed to create')
    }
  }

  const deleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return
    setDeleting(id)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`/api/wavecore/store/categories?id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`, { 
        method: 'DELETE' 
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(`Category "${name}" deleted successfully`)
        setTimeout(() => setSuccess(''), 3000)
        fetchCategories()
      } else {
        setError(data.error || 'Delete failed')
      }
    } catch (err) {
      setError('Network error - delete failed')
    } finally {
      setDeleting('')
    }
  }

  const downloadPdf = (id: string) => {
    if (!id) {
      setError('Category ID missing')
      return
    }
    window.open(`/api/wavecore/store/categories/${id}/pdf`, '_blank')
  }

  const filtered = categories.filter(c => 
    (c.name || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalProducts = categories.reduce((sum, c) => sum + Number(c.productCount || 0), 0)
  const activeCategories = categories.filter(c => Number(c.productCount || 0) > 0).length
  const emptyCategories = categories.filter(c => Number(c.productCount || 0) === 0).length

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

      <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tag className="w-6 h-6 text-pink-500" /> Categories ({categories.length})
          </h1>
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2.5 rounded-xl bg-pink-600 text-white font-bold flex items-center gap-2 hover:bg-pink-700 transition-colors">
            <Plus className="w-4 h-4" /> New Category
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-600 border border-red-200">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-50 text-green-600 border border-green-200 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {showForm && (
          <form onSubmit={createCategory} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2"><Layers className="w-5 h-5 text-pink-500" /> New Category</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-red-500 hover:bg-red-50 p-1 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex gap-3">
              <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter category name" className="flex-1 px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-pink-500" autoFocus />
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-pink-600 text-white font-bold hover:bg-pink-700 transition-colors">Create</button>
            </div>
          </form>
        )}

        {/* CLICKABLE KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button onClick={() => setActiveView('all')}
            className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'all' ? 'ring-4 ring-pink-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #db2777, #be185d)' }}>
            <Tags className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{categories.length}</p>
            <p className="text-xs opacity-80">Total Categories</p>
          </button>
          <button onClick={() => setActiveView('products')}
            className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'products' ? 'ring-4 ring-blue-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
            <Package className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalProducts}</p>
            <p className="text-xs opacity-80">Total Products</p>
          </button>
          <button onClick={() => setActiveView('active')}
            className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'active' ? 'ring-4 ring-green-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #16a34a, #059669)' }}>
            <CheckCircle2 className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{activeCategories}</p>
            <p className="text-xs opacity-80">Active Categories</p>
          </button>
          <button onClick={() => setActiveView('empty')}
            className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'empty' ? 'ring-4 ring-yellow-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #d97706, #b45309)' }}>
            <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{emptyCategories}</p>
            <p className="text-xs opacity-80">Empty Categories</p>
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full focus:outline-none focus:ring-2 focus:ring-pink-500" placeholder="Search categories..." />
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-pink-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No categories found</p>
            <button onClick={() => setShowForm(true)} className="mt-4 px-4 py-2 rounded-xl bg-pink-600 text-white font-bold">
              Create First Category
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered
              .filter(c => {
                if (activeView === 'products') return Number(c.productCount || 0) > 0
                if (activeView === 'active') return Number(c.productCount || 0) > 0
                if (activeView === 'empty') return Number(c.productCount || 0) === 0
                return true
              })
              .map((cat, i) => (
                <div key={cat.id || i} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-bold text-lg">{cat.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Package className="w-4 h-4" /> {cat.productCount || 0} products
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => downloadPdf(cat.id)}
                        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        title="Download PDF">
                        <Printer className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteCategory(cat.id, cat.name)}
                        disabled={deleting === cat.id}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                        title="Delete category">
                        {deleting === cat.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>
    </div>
  )
}