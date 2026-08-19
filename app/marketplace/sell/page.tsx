'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Image as ImageIcon, DollarSign, MapPin, Loader2, Upload, X, Camera } from 'lucide-react'

export default function SellPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [condition, setCondition] = useState('Used')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Resize image to 800x800 and return base64
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size > 10 * 1024 * 1024) {
        reject('Image must be less than 10MB')
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new window.Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = 800
          canvas.height = 800
          const ctx = canvas.getContext('2d')
          
          const size = Math.min(img.width, img.height)
          const sx = (img.width - size) / 2
          const sy = (img.height - size) / 2
          
          ctx?.drawImage(img, sx, sy, size, size, 0, 0, 800, 800)
          
          const resizedImage = canvas.toDataURL('image/jpeg', 0.85)
          resolve(resizedImage)
        }
        img.onerror = () => reject('Invalid image')
        img.src = event.target?.result as string
      }
      reader.onerror = () => reject('Read failed')
      reader.readAsDataURL(file)
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    setUploading(true)

    try {
      for (const file of Array.from(files)) {
        if (images.length >= 8) break
        const resized = await resizeImage(file)
        setImages(prev => [...prev, resized])
      }
    } catch (error) {
      alert(error)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!title || !price || !category) return
    if (images.length === 0) {
      alert('Please add at least one product image')
      return
    }
    setLoading(true)

    try {
      const res = await fetch('/api/marketplace/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          description, 
          price: parseFloat(price), 
          category, 
          condition, 
          location,
          images: images,
        }),
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          window.location.href = '/marketplace'
        }, 2000)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to create listing')
      }
    } catch (error) {
      alert('Network error. Please try again.')
    } finally { setLoading(false) }
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
          {/* Image Upload */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Product Images (800x800) *
            </label>
            <div className="grid grid-cols-4 gap-3 mb-3">
              {images.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border group">
                  <img src={img} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-1 left-1 px-2 py-0.5 rounded bg-green-500 text-white text-[10px] font-bold">
                      MAIN
                    </span>
                  )}
                </div>
              ))}
              
              {images.length < 8 && (
                <button onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-neutral-300 hover:border-indigo-500 flex flex-col items-center justify-center gap-2 transition-all">
                  {uploading ? <Loader2 className="w-6 h-6 animate-spin text-indigo-500" /> : <Camera className="w-6 h-6 text-neutral-400" />}
                  <span className="text-xs text-neutral-500">Add Photo</span>
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleImageUpload} className="hidden" />
            <p className="text-xs text-muted-foreground">
              {images.length}/8 photos • 800x800 • JPEG compressed • Max 10MB each
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border" placeholder="e.g., iPhone 15 Pro Max 256GB" />
          </div>

          {/* Price */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Price (KSh) *</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border" placeholder="e.g., 150000" />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Category *</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border">
              <option value="">Select category</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {/* Condition */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Condition</label>
            <select value={condition} onChange={(e) => setCondition(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border">
              <option>Used</option>
              <option>New</option>
              <option>Refurbished</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Location</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border" placeholder="e.g., Nairobi, Kenya" />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
              className="w-full px-4 py-3 rounded-xl border" placeholder="Describe your item..." />
          </div>

          <button onClick={handleSubmit} disabled={loading || !title || !price || !category || images.length === 0}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Creating...' : 'Post Listing'}
          </button>
        </div>
      </main>
    </div>
  )
}