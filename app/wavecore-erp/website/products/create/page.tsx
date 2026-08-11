'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, ArrowLeft, Save, Package,
  Tag, DollarSign, AlignLeft, Image as ImageIcon,
  Globe, AlertCircle, Upload, Grid3X3
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CreateProductPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    comparePrice: '',
    sku: '',
    category: '',
    status: 'draft',
    featured: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/wavecore/website/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error('Failed to create product')
      
      router.push('/wavecore-erp/website/products')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-800 shadow-lg">
                <Image src="/images/Wavecore.jpeg" alt="WaveCore ERP" width={40} height={40} className="object-cover" priority />
              </div>
              <span className="font-bold text-xl text-neutral-900 dark:text-white">WaveCore</span>
              <span className="ml-2 px-2 py-0.5 text-[10px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-medium">ERP</span>
            </Link>
            <span className="text-neutral-300">/</span>
            <span className="text-sm font-medium">New Product</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <div className="mb-8">
          <Link href="/wavecore-erp/website" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-indigo-600 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Store
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Add New Product</h1>
          <p className="text-muted-foreground mt-1">Create a product listing for your online store</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 mb-6 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 space-y-6">
            {/* Product Image */}
            <div>
              <label className="block text-sm font-medium mb-2">Product Image</label>
              <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-indigo-300 transition-colors cursor-pointer">
                <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Drag and drop product image here</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                <Button variant="outline" size="sm" className="mt-3">
                  <Upload className="w-4 h-4 mr-1" /> Upload Image
                </Button>
              </div>
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter product name"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <div className="relative">
                <AlignLeft className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Describe your product..."
                />
              </div>
            </div>

            {/* Price & Compare Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Price <span className="text-red-500">*</span></label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Compare at Price</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="number"
                    value={formData.comparePrice}
                    onChange={(e) => setFormData({ ...formData, comparePrice: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* SKU & Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Product SKU"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select category</option>
                  <option value="electronics">Electronics</option>
                  <option value="clothing">Clothing</option>
                  <option value="home">Home & Garden</option>
                  <option value="sports">Sports</option>
                  <option value="books">Books</option>
                </select>
              </div>
            </div>

            {/* Status & Featured */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex items-center pt-8">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium">Featured Product</span>
                </label>
              </div>
            </div>

            {/* SEO Preview */}
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
              <p className="text-xs font-medium text-muted-foreground mb-2">Store Preview</p>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{formData.name || 'Product Name'}</p>
                  <p className="text-lg font-bold text-indigo-600">
                    {formData.price ? `KSh ${formData.price}` : 'KSh 0.00'}
                    {formData.comparePrice && (
                      <span className="ml-2 text-sm text-muted-foreground line-through">KSh {formData.comparePrice}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link href="/wavecore-erp/website">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button type="submit" className="gap-2 bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
              <Save className="w-4 h-4" />
              {loading ? 'Creating...' : 'Create Product'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}