'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowLeft, Package, AlertCircle } from 'lucide-react'

const CATEGORIES = ['Food', 'Beverages', 'Appetizers', 'Main Course', 'Desserts', 'Snacks', 'Other']

export default function EditMenuItemPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params?.id as string

  const [form, setForm] = useState({ name: '', category: 'Food', sellingPrice: '', costPrice: '', unit: 'Unit', description: '' })
  const [original, setOriginal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!productId) return
    fetch(`/api/wavve-si/restaurant/menu/${productId}`, { cache: 'no-store' })
      .then(async r => {
        if (r.status === 404) { setError('Product not found'); setLoading(false); return }
        if (!r.ok) throw new Error('Failed to load')
        return r.json()
      })
      .then(data => {
        if (data?.product) {
          const p = data.product
          setOriginal(p)
          setForm({
            name: p.name || '',
            category: p.category || 'Food',
            sellingPrice: String(p.sellingPrice || ''),
            costPrice: String(p.costPrice || ''),
            unit: p.unit || 'Unit',
            description: p.description || '',
          })
        }
        setLoading(false)
      })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [productId])

  function update(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.name.trim()) { setError('Name is required'); return }
    if (!form.sellingPrice || isNaN(Number(form.sellingPrice))) { setError('Selling price must be a number'); return }

    setSaving(true)
    try {
      const res = await fetch(`/api/wavve-si/restaurant/menu/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category,
          sellingPrice: Number(form.sellingPrice),
          costPrice: form.costPrice ? Number(form.costPrice) : 0,
          unit: form.unit || 'Unit',
          description: form.description.trim(),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update')
      }
      toast.success('Item updated')
      router.push('/wavve-si/modules/restaurant-hospitality/menu')
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  if (error && !original) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-lg text-white mb-1">{error}</p>
        <Link href="/wavve-si/modules/restaurant-hospitality/menu" className="text-sm text-blue-400 hover:underline">Back to Menu</Link>
      </div>
    )
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
          <h2 className="text-xl font-bold text-white">Edit Menu Item</h2>
          <p className="text-sm text-slate-400 font-mono">{original?.sku || productId}</p>
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
          <label className="block text-sm font-bold text-white mb-2">Name</label>
          <input type="text" required value={form.name} onChange={e => update('name', e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-bold text-white mb-2">Category</label>
          <select value={form.category} onChange={e => update('category', e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-white mb-2">Selling Price</label>
            <input type="number" required min="0" step="0.01" value={form.sellingPrice} onChange={e => update('sellingPrice', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-bold text-white mb-2">Cost Price</label>
            <input type="number" min="0" step="0.01" value={form.costPrice} onChange={e => update('costPrice', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-bold text-white mb-2">Unit</label>
            <input type="text" value={form.unit} onChange={e => update('unit', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-white mb-2">Description</label>
          <textarea value={form.description} onChange={e => update('description', e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 text-white font-bold rounded-lg transition-colors">
            {saving ? 'Saving...' : 'Save Changes'}
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