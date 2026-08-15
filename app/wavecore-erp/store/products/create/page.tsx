'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AddProductPage() {
  const [formData, setFormData] = useState({
    name: '', sku: '', barcode: '', description: '', category: '',
    unit: 'Unit', costPrice: '', sellingPrice: '', minStock: '0', maxStock: '100',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const update = (field: string, value: string) => setFormData({ ...formData, [field]: value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.name || !formData.sku) {
      setError('Name and SKU are required')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/wavecore/inventory/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          sku: formData.sku,
          barcode: formData.barcode || null,
          description: formData.description || null,
          category: formData.category || null,
          unit: formData.unit,
          costPrice: parseFloat(formData.costPrice) || 0,
          sellingPrice: parseFloat(formData.sellingPrice) || 0,
          minStock: parseFloat(formData.minStock) || 0,
          maxStock: parseFloat(formData.maxStock) || 100,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to add product'); return }
      router.push('/wavecore-erp/store/products')
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <Link href="/wavecore-erp/store/products" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Add Product</h1>
        {error && <div className="p-4 mb-6 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-2">Name *</label>
              <input type="text" value={formData.name} onChange={(e) => update('name', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" required />
            </div>
            <div><label className="block text-sm font-medium mb-2">SKU *</label>
              <input type="text" value={formData.sku} onChange={(e) => update('sku', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" required />
            </div>
            <div><label className="block text-sm font-medium mb-2">Barcode</label>
              <input type="text" value={formData.barcode} onChange={(e) => update('barcode', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" />
            </div>
            <div><label className="block text-sm font-medium mb-2">Category</label>
              <input type="text" value={formData.category} onChange={(e) => update('category', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" />
            </div>
            <div><label className="block text-sm font-medium mb-2">Unit</label>
              <select value={formData.unit} onChange={(e) => update('unit', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border">
                <option value="Unit">Unit</option><option value="Kg">Kg</option><option value="Litre">Litre</option>
                <option value="Piece">Piece</option><option value="Box">Box</option><option value="Pack">Pack</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium mb-2">Cost Price (KSh)</label>
              <input type="number" value={formData.costPrice} onChange={(e) => update('costPrice', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" min="0" step="0.01" />
            </div>
            <div><label className="block text-sm font-medium mb-2">Selling Price (KSh)</label>
              <input type="number" value={formData.sellingPrice} onChange={(e) => update('sellingPrice', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" min="0" step="0.01" />
            </div>
            <div><label className="block text-sm font-medium mb-2">Min Stock Level</label>
              <input type="number" value={formData.minStock} onChange={(e) => update('minStock', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" min="0" />
            </div>
            <div><label className="block text-sm font-medium mb-2">Max Stock Level</label>
              <input type="number" value={formData.maxStock} onChange={(e) => update('maxStock', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" min="0" />
            </div>
          </div>
          <div><label className="block text-sm font-medium mb-2">Description</label>
            <textarea value={formData.description} onChange={(e) => update('description', e.target.value)} rows={3}
              className="w-full px-4 py-2.5 rounded-xl border resize-none" />
          </div>
          <Button type="submit" disabled={loading} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Save className="w-4 h-4" /> {loading ? 'Adding...' : 'Add Product'}
          </Button>
        </form>
      </main>
    </div>
  )
}