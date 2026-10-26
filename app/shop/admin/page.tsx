'use client'
import { useState } from 'react'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'

export default function AdminDashboard() {
  const [password, setPassword] = useState('')
  const [auth, setAuth] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length > 5) setAuth(true) // Simple client-side gate for UI
  }

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    const formData = new FormData(e.currentTarget)
    formData.append('password', password)

    try {
      const res = await fetch('/api/shop/admin', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        setMessage('Product uploaded successfully!')
        ;(e.target as HTMLFormElement).reset()
      } else {
        setMessage(data.error || 'Upload failed')
      }
    } catch {
      setMessage('Network error')
    } finally {
      setLoading(false)
    }
  }

  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <form onSubmit={handleLogin} className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-slate-700">
          <h1 className="text-2xl font-bold text-white mb-6">Secure Admin Login</h1>
          <input type="password" placeholder="Enter Admin Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-900 text-white border border-slate-700 mb-4 focus:outline-none focus:border-blue-500" />
          <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">Unlock Dashboard</button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Upload New Product</h1>
        
        {message && (
          <div className={`p-4 rounded-xl mb-6 flex items-center gap-2 ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.includes('success') ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Storefront</label>
            <select name="store" required className="w-full px-4 py-2 rounded-xl border border-slate-300">
              <option value="wavvemarket">WavveMarket</option>
              <option value="wavecore">WaveCore ERP</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
              <select name="category" required className="w-full px-4 py-2 rounded-xl border border-slate-300">
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Kids">Kids</option>
                <option value="Accessories">Accessories</option>
                <option value="Wavvemarket">Wavvemarket</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Sub-Category</label>
              <select name="subCategory" required className="w-full px-4 py-2 rounded-xl border border-slate-300">
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
            <input name="name" required className="w-full px-4 py-2 rounded-xl border border-slate-300" placeholder="e.g. Classic Cotton Shirt" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Price (KSh)</label>
            <input name="price" type="number" required className="w-full px-4 py-2 rounded-xl border border-slate-300" placeholder="1500" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
            <textarea name="description" className="w-full px-4 py-2 rounded-xl border border-slate-300 h-24" placeholder="Product details..." />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Image (800x800 px)</label>
            <input type="file" name="image" accept="image/*" required className="w-full px-4 py-2 rounded-xl border border-slate-300 bg-slate-50" />
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
            {loading ? 'Uploading...' : <><Upload className="w-5 h-5" /> Publish Product</>}
          </button>
        </form>
      </div>
    </div>
  )
}