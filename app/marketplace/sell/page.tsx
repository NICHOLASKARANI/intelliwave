'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Image as ImageIcon, DollarSign, MapPin, Loader2 } from 'lucide-react'

export default function SellPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [condition, setCondition] = useState('Used')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const categories = [
    'Vehicles', 'Property to Rent', 'Women\'s Clothing & Shoes', 'Men\'s Clothing and Shoes',
    'Furniture', 'Electronics and Computers', 'Mobile Phones', 'Antiques and Collectibles',
    'Appliances', 'Arts & Crafts', 'Baby and Children', 'Bags and Luggage',
    'Bicycles', 'Books, Films & Music', 'Car Parts', 'Garden',
    'Health and Beauty', 'Household', 'Jewellery and Accessories', 'Musical Instruments',
    'Pet Supplies', 'Property for Sale', 'Sports and Outdoors', 'Tools',
    'Toys and Games', 'Video Games', 'Agriculture and Farming', 'Animals and Pets',
    'Jobs', 'Services', 'Food', 'Commercial Equipment'
  ]

  const handleSubmit = async () => {
    if (!title || !price || !category) return
    setLoading(true)

    try {
      const res = await fetch('/api/marketplace/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, price: parseFloat(price), category, condition, location }),
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          window.location.href = '/marketplace'
        }, 2000)
      }
    } catch {} finally { setLoading(false) }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Listing Created!</h1>
          <p className="text-muted-foreground">Redirecting to Marketplace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/marketplace" className="font-bold text-lg">← Back</Link>
          <span className="font-bold">Create Listing</span>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 lg:p-8">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border" placeholder="e.g., iPhone 15 Pro Max 256GB" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Price (KSh) *</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border" placeholder="e.g., 150000" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Category *</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border">
              <option value="">Select category</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Condition</label>
            <select value={condition} onChange={(e) => setCondition(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border">
              <option>Used</option>
              <option>New</option>
              <option>Refurbished</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Location</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border" placeholder="e.g., Nairobi, Kenya" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
              className="w-full px-4 py-3 rounded-xl border" placeholder="Describe your item..." />
          </div>

          <button onClick={handleSubmit} disabled={loading || !title || !price || !category}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Creating...' : 'Post Listing'}
          </button>
        </div>
      </main>
    </div>
  )
}