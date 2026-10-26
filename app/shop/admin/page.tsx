'use client'
import { useState } from 'react'
import { upload } from '@vercel/blob/client'
import { Upload, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react'

export default function AdminDashboard() {
  const [password, setPassword] = useState('')
  const [auth, setAuth] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState<string | null>(null)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length > 5) setAuth(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPreview(URL.createObjectURL(file))
    } else {
      setPreview(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const form = e.currentTarget
    const formData = new FormData(form)
    const file = formData.get('image') as File
    const store = formData.get('store') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = formData.get('price') as string
    const category = formData.get('category') as string
    const subCategory = formData.get('subCategory') as string

    if (!file || file.size === 0) {
      setMessage('Please select an image file.')
      setLoading(false)
      return
    }

    try {
      // 1. Upload image directly to Vercel Blob (Client-side)
      // We use a simple filename to avoid issues
      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`
      
      const blob = await upload(safeName, file, {
        access: 'public',
        handleUploadUrl: '/api/shop/admin',
        clientPayload: password,
      })

      // 2. Save product details to database
      const res = await fetch('/api/shop/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          store,
          name,
          description,
          price,
          imageUrl: blob.url,
          category,
          subCategory,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setMessage('Product published successfully!')
        form.reset()
        setPreview(null)
      } else {
        setMessage(data.error || 'Failed to save product')
      }
    } catch (err) {
      console.error(err)
      setMessage((err as Error).message || 'Upload failed. Check console.')
    } finally {
      setLoading(false)
    }
  }

  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <form onSubmit={handleLogin} className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-slate-700">
          <h1 className="text-2xl font-bold text-white mb-6">Secure Admin Login</h1>
          <input type="password" placeholder="Enter Admin Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-900 text-white border border-slate-700 mb-4 focus:outline-none focus:border-blue-500" required />
          <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors">Unlock Dashboard</button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Upload New Product</h1>
        
        {message && (
          <div className={`p-4 rounded-xl mb-6 flex items-center gap-2 ${message.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.includes('success') ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Storefront</label>
            <select name="store" required className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500">
              <option value="wavvemarket">WavveMarket</option>
              <option value="wavecore">WaveCore ERP</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
              <select name="category" required className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500">
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Kids">Kids</option>
                <option value="Accessories">Accessories</option>
                <option value="Wavvemarket">Wavvemarket</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Sub-Category</label>
              <select name="subCategory" required className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500">
                <option value="Shirts">Shirts</option>
                <option value="Outerwear">Outerwear</option>
                <option value="Drones">Drones</option>
                <option value="Hats">Hats</option>
                <option value="View All">View All</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Product Name</label>
            <input name="name" required className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500" placeholder="e.g. Classic Cotton Shirt" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Price (KSh)</label>
            <input name="price" type="number" required className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500" placeholder="1500" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
            <textarea name="description" className="w-full px-4 py-2 rounded-xl border border-slate-300 h-24 focus:ring-2 focus:ring-blue-500" placeholder="Product details..." />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Image (800x800 px)</label>
            <div className="flex items-center gap-4">
              <label className="flex-1 cursor-pointer bg-white border-2 border-dashed border-slate-300 rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-slate-50">
                <ImageIcon className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-600">Select Image</span>
                <input type="file" name="image" accept="image/*" required onChange={handleFileChange} className="hidden" />
              </label>
              {preview && (
                <div className="w-20 h-20 rounded-lg overflow-hidden border">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
            {loading ? 'Uploading & Saving...' : <><Upload className="w-5 h-5" /> Publish Product</>}
          </button>
        </form>
      </div>
    </div>
  )
}