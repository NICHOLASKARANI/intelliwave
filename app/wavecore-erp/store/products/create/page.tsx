'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Loader2, CheckCircle, ArrowLeft, Package } from 'lucide-react'

export default function CreateProductPage() {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    description: '',
    category: '',
    unit: 'Unit',
    costPrice: '',
    sellingPrice: '',
    minStock: '0',
    maxStock: '100',
    initialStock: '0',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.name.trim()) {
      setError('Product name is required')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/wavecore/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          sku: formData.sku,
          barcode: formData.barcode || null,
          description: formData.description || null,
          category: formData.category || 'General',
          unit: formData.unit,
          costPrice: parseFloat(formData.costPrice) || 0,
          sellingPrice: parseFloat(formData.sellingPrice) || 0,
          minStock: parseFloat(formData.minStock) || 0,
          maxStock: parseFloat(formData.maxStock) || 100,
          initialStock: parseFloat(formData.initialStock) || 0,
        }),
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          window.location.href = '/wavecore-erp/store/products'
        }, 1500)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to create product')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500"

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp/store/products" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">New Product</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-3 sm:p-4 lg:p-8">
        <Link href="/wavecore-erp/store/products" className="flex items-center gap-1 text-sm text-blue-600 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Link>

        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Package className="w-6 h-6 text-orange-500" /> Add New Product
        </h1>

        {success ? (
          <div className="bg-green-50 rounded-2xl border border-green-200 p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-green-700">Product Created!</h2>
            <p className="text-muted-foreground">Redirecting...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Product name" className={inputClass} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">SKU *</label>
                <input type="text" value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  placeholder="SKU-001" className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Barcode</label>
                <input type="text" value={formData.barcode} onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                  placeholder="Barcode" className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <input type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}
                  placeholder="e.g. Electronics" className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Unit</label>
                <select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  className={inputClass}>
                  <option>Unit</option>
                  <option>Piece</option>
                  <option>Box</option>
                  <option>Kg</option>
                  <option>Liter</option>
                  <option>Meter</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Cost Price (KSh)</label>
                <input type="number" value={formData.costPrice} onChange={(e) => setFormData({...formData, costPrice: e.target.value})}
                  placeholder="0" className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Selling Price (KSh) *</label>
                <input type="number" value={formData.sellingPrice} onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})}
                  placeholder="0" className={inputClass} required />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Min Stock</label>
                <input type="number" value={formData.minStock} onChange={(e) => setFormData({...formData, minStock: e.target.value})}
                  placeholder="0" className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Max Stock</label>
                <input type="number" value={formData.maxStock} onChange={(e) => setFormData({...formData, maxStock: e.target.value})}
                  placeholder="100" className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Initial Stock *</label>
                <input type="number" value={formData.initialStock} onChange={(e) => setFormData({...formData, initialStock: e.target.value})}
                  placeholder="0" className={inputClass} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Product description..." className={inputClass} rows={3} />
            </div>

            {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-orange-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}