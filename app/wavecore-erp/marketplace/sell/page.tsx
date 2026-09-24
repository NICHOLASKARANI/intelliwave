'use client'

import { authedFetch, redirectToLogin } from '@/lib/wavecore/csrf-client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus, Loader2, X, Package, Tag, Store, MapPin, DollarSign, Image as ImageIcon,
  CheckCircle2, Sparkles, Warehouse, Truck, Clock, ArrowLeft, Zap,
} from 'lucide-react'

const CATEGORIES = ['Electronics', 'Mobile Phones', 'Furniture', 'Vehicles', 'Fashion', 'Property', 'Home', 'Sports', 'GENERAL']
const CONDITIONS = ['New', 'Like New', 'Used', 'Refurbished', 'For Parts']
const FULFILLMENT = [
  { value: 'SELLER_SHIP', label: 'Seller ships', icon: Truck },
  { value: 'ERP_WAREHOUSE', label: 'From my warehouse', icon: Warehouse },
  { value: 'PICKUP', label: 'Buyer pickup', icon: Store },
]

export default function SellPage() {
  const router = useRouter()
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    title: '', description: '', price: '', category: 'GENERAL', condition: 'New',
    location: '', images: [] as string[], sku: '', stock: '1',
    fulfillmentType: 'SELLER_SHIP', slaHours: '48', warehouseId: '',
    latitude: '', longitude: '',
  })
  const [imageUrl, setImageUrl] = useState('')
  const [imageError, setImageError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    // Fetch warehouses from ERP
    fetch('/api/marketplace/erp-sync')
      .then(r => r.json())
      .then(d => setWarehouses(d.warehouses || []))
      .catch(() => {})
  }, [])

  const addImage = () => {
    if (!imageUrl.trim()) return
    setForm({ ...form, images: [...form.images, imageUrl.trim()] })
    setImageUrl('')
  }

  const removeImage = (i: number) => {
    setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) })
  }

  const detectLocation = () => {
    navigator.geolocation.getCurrentPosition(
      pos => setForm({ ...form, latitude: String(pos.coords.latitude), longitude: String(pos.coords.longitude) }),
      () => alert('Location access denied')
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) { setError('Title required'); return }
    if (!form.price || Number(form.price) <= 0) { setError('Valid price required'); return }

    setSubmitting(true)
    try {
      const res = await authedFetch('/api/marketplace/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          stock: Number(form.stock || 1),
          slaHours: Number(form.slaHours || 48),
          latitude: form.latitude ? Number(form.latitude) : null,
          longitude: form.longitude ? Number(form.longitude) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      setSuccess('Listing created! Redirecting...')
      setTimeout(() => router.push('/wavecore-erp/marketplace/listing/' + data.listing.id), 1000)
    } catch { setError('Network error') }
    finally { setSubmitting(false) }
  }

  // ===== IMAGE HANDLING =====
  const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB per image
  const MAX_IMAGES = 8

  const addImageFromUrl = () => {
    setImageError('')
    const url = imageUrl.trim()
    if (!url) {
      setImageError('Type a URL or pick a file first')
      return
    }
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
      setImageError('URL must start with http:// or https:// or /')
      return
    }
    if (form.images.length >= MAX_IMAGES) {
      setImageError('Maximum ' + MAX_IMAGES + ' images')
      return
    }
    setForm({ ...form, images: [...form.images, url] })
    setImageUrl('')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError('')
    const files = e.target.files
    if (!files || files.length === 0) return
    if (form.images.length + files.length > MAX_IMAGES) {
      setImageError('Maximum ' + MAX_IMAGES + ' images total')
      return
    }
    setUploading(true)
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        setImageError('Only image files allowed')
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        setImageError('Each image must be under 2MB (got ' + Math.round(file.size / 1024) + 'KB)')
        return
      }
      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string
        if (dataUrl) {
          setForm(prev => ({ ...prev, images: [...prev.images, dataUrl] }))
        }
      }
      reader.readAsDataURL(file)
    })
    setTimeout(() => setUploading(false), 500)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const openFilePicker = () => {
    setImageError('')
    if (form.images.length >= MAX_IMAGES) {
      setImageError('Maximum ' + MAX_IMAGES + ' images reached')
      return
    }
    fileInputRef.current?.click()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const dt = e.dataTransfer
    if (!dt.files || dt.files.length === 0) return
    const fakeEvent = { target: { files: dt.files } } as any
    handleFileUpload(fakeEvent)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const removeImageAt = (i: number) => {
    setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/marketplace" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveMarket" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveMarket · Sell</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <button onClick={() => router.back()} className="text-sm text-neutral-400 hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Plus className="w-7 h-7 text-cyan-400" /> List a New Product
          </h1>
          <p className="text-sm text-neutral-400 mt-1">Reach buyers across WaveMarket. Smart routing handles delivery.</p>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        <form onSubmit={submit} className="space-y-6">
          {/* Basic info */}
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-cyan-400 flex items-center gap-2">
              <Package className="w-4 h-4" /> Product Details
            </h2>
            <div>
              <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Title *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. iPhone 15 Pro Max 256GB" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Description</label>
              <textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="Key features, condition details, warranty..." />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Condition</label>
                <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing & stock */}
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-amber-400 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Pricing & Stock
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Price (KES) *</label>
                <input type="number" min="1" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="0" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Stock Qty</label>
                <input type="number" min="1" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">SKU (optional)</label>
                <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. IP15-256" />
              </div>
            </div>
          </div>

          {/* Fulfillment */}
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-indigo-400 flex items-center gap-2">
              <Truck className="w-4 h-4" /> Fulfillment
            </h2>
            <div className="grid md:grid-cols-3 gap-3">
              {FULFILLMENT.map(f => {
                const Icon = f.icon
                // ===== IMAGE HANDLING =====
  const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB per image
  const MAX_IMAGES = 8

  const addImageFromUrl = () => {
    setImageError('')
    const url = imageUrl.trim()
    if (!url) {
      setImageError('Type a URL or pick a file first')
      return
    }
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
      setImageError('URL must start with http:// or https:// or /')
      return
    }
    if (form.images.length >= MAX_IMAGES) {
      setImageError('Maximum ' + MAX_IMAGES + ' images')
      return
    }
    setForm({ ...form, images: [...form.images, url] })
    setImageUrl('')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError('')
    const files = e.target.files
    if (!files || files.length === 0) return
    if (form.images.length + files.length > MAX_IMAGES) {
      setImageError('Maximum ' + MAX_IMAGES + ' images total')
      return
    }
    setUploading(true)
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        setImageError('Only image files allowed')
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        setImageError('Each image must be under 2MB (got ' + Math.round(file.size / 1024) + 'KB)')
        return
      }
      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string
        if (dataUrl) {
          setForm(prev => ({ ...prev, images: [...prev.images, dataUrl] }))
        }
      }
      reader.readAsDataURL(file)
    })
    setTimeout(() => setUploading(false), 500)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const openFilePicker = () => {
    setImageError('')
    if (form.images.length >= MAX_IMAGES) {
      setImageError('Maximum ' + MAX_IMAGES + ' images reached')
      return
    }
    fileInputRef.current?.click()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const dt = e.dataTransfer
    if (!dt.files || dt.files.length === 0) return
    const fakeEvent = { target: { files: dt.files } } as any
    handleFileUpload(fakeEvent)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const removeImageAt = (i: number) => {
    setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) })
  }

  return (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setForm({ ...form, fulfillmentType: f.value })}
                    className={'p-4 rounded-xl border-2 transition-all text-left ' + (form.fulfillmentType === f.value ? 'border-cyan-500 bg-cyan-900/20' : 'border-neutral-800 hover:border-neutral-700')}
                  >
                    <Icon className={'w-5 h-5 mb-2 ' + (form.fulfillmentType === f.value ? 'text-cyan-400' : 'text-neutral-500')} />
                    <p className={'text-sm font-bold ' + (form.fulfillmentType === f.value ? 'text-white' : 'text-neutral-300')}>{f.label}</p>
                  </button>
                )
              })}
            </div>
            {warehouses.length > 0 && form.fulfillmentType === 'ERP_WAREHOUSE' && (
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Warehouse</label>
                <select value={form.warehouseId} onChange={e => setForm({ ...form, warehouseId: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  <option value="">Select warehouse...</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} — {w.location || 'no location'}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold flex items-center gap-1">
                <Clock className="w-3 h-3" /> SLA (dispatch within hours)
              </label>
              <input type="number" min="1" value={form.slaHours} onChange={e => setForm({ ...form, slaHours: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
            </div>
          </div>

          {/* Location */}
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-green-400 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Location (for smart routing)
            </h2>
            <div>
              <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Location label</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. Nairobi CBD, Westlands" />
            </div>
            <button type="button" onClick={detectLocation} className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Auto-detect coordinates
            </button>
            {form.latitude && form.longitude && (
              <p className="text-xs text-cyan-400">Coordinates: {form.latitude}, {form.longitude}</p>
            )}
          </div>

          {/* Images */}
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold uppercase tracking-wide text-pink-400 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Product Images
              </h2>
              <span className="text-xs text-neutral-500 font-bold">{form.images.length} / 8</span>
            </div>

            {/* Upload from device (primary CTA) */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={openFilePicker}
              disabled={uploading || form.images.length >= 8}
              className="w-full py-4 rounded-xl border-2 border-dashed border-pink-600/50 bg-pink-600/5 hover:bg-pink-600/10 hover:border-pink-500 transition-all flex items-center justify-center gap-2 text-pink-400 font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
              ) : (
                <><Plus className="w-5 h-5" /> Upload from device (or click to browse)</>
              )}
            </button>

            {/* Drag-and-drop hint */}
            <p className="text-[10px] text-center text-neutral-600">
              JPG · PNG · WebP · Max 2MB each · Up to 8 images
            </p>

            {/* OR divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-neutral-800" />
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">or paste URL</span>
              <div className="flex-1 border-t border-neutral-800" />
            </div>

            {/* URL input */}
            <div className="flex gap-2">
              <input
                value={imageUrl}
                onChange={e => { setImageUrl(e.target.value); setImageError('') }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addImageFromUrl() } }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-pink-500"
                placeholder="https://example.com/image.jpg"
              />
              <button
                type="button"
                onClick={addImageFromUrl}
                disabled={!imageUrl.trim()}
                className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                title="Add image by URL"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Inline error */}
            {imageError && (
              <div className="p-2.5 rounded-xl bg-red-900/30 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                <span className="text-red-400">⚠</span> {imageError}
              </div>
            )}

            {/* Image grid */}
            {form.images.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {form.images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-neutral-700 group">
                    <img src={img} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeImageAt(i)}
                        className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="absolute bottom-1 left-1 px-2 py-0.5 rounded bg-black/70 backdrop-blur text-white text-[10px] font-bold">
                      #{i + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Link href="/wavecore-erp/marketplace" className="px-6 py-3 rounded-xl bg-neutral-800 text-white font-bold">Cancel</Link>
            <button type="submit" disabled={submitting} className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold flex items-center gap-2 shadow-lg disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {submitting ? 'Publishing...' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}