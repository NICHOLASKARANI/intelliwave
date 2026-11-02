'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowLeft, Package, AlertCircle } from 'lucide-react'

const CATEGORIES = ['Food', 'Beverages', 'Appetizers', 'Main Course', 'Desserts', 'Snacks', 'Other']

export default function NewMenuItemPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: 'Food',
    sellingPrice: '',
    costPrice: '',
    unit: 'Unit',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.name.trim()) {
      setError('Name is required')
      return
    }
    if (!form.sellingPrice || isNaN(Number(form.sellingPrice))) {
      setError('Selling price must be a valid number')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/wavve-si/restaurant/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          sku: form.sku.trim() || undefined,
          category: form.category,
          sellingPrice: Number(form.sellingPrice),
          costPrice: form.costPrice ? Number(form.costPrice) : 0,
          unit: form.unit || 'Unit',
          description: form.description.trim(),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create item')
      }
      const data = await res.json()
      toast.success(`Item "${data.product.name}" created`)
      router.push('/wavve-si/modules/restaurant-hospitality/menu')
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <Link href="/wavve-si/modules/restaurant-hospitality/menu" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Menu
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Package className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Add Menu Item</h2>
          <p className="text-sm text-slate-400">Add a new product or dish to your menu</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 text-red-300 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-bold text-white mb-2">Name <span className="text-red-400">*</span></label>
          <input type="text" required value={form.name} onChange={e => update('name', e.target.value)}
            placeholder="e.g. Chicken Burger"
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-white mb-2">SKU</label>
            <input type="text" value={form.sku} onChange={e => update('sku', e.target.value)}
              placeholder="Auto-generated if empty"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 font-mono text-sm" />
          </div>
          <div>
            <label className="block text-sm font-bold text-white mb-2">Category</label>
            <select value={form.category} onChange={e => update('category', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-white mb-2">Selling Price (KSh) <span className="text-red-400">*</span></label>
            <input type="number" required min="0" step="0.01" value={form.sellingPrice} onChange={e => update('sellingPrice', e.target.value)}
              placeholder="500"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-bold text-white mb-2">Cost Price (KSh)</label>
            <input type="number" min="0" step="0.01" value={form.costPrice} onChange={e => update('costPrice', e.target.value)}
              placeholder="200"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-bold text-white mb-2">Unit</label>
            <input type="text" value={form.unit} onChange={e => update('unit', e.target.value)}
              placeholder="Plate, Cup, Piece"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-white mb-2">Description</label>
          <textarea value={form.description} onChange={e => update('description', e.target.value)}
            rows={3}
            placeholder="Brief description (optional)"
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 text-white font-bold rounded-lg transition-colors">
            {loading ? 'Creating...' : 'Create Item'}
          </button>
          <Link href="/wavve-si/modules/restaurant-hospitality/menu"
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}