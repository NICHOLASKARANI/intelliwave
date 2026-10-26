'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Trash2, Edit, PlusCircle, CheckCircle, AlertCircle } from 'lucide-react'

export default function AdminDashboard() {
  const [password, setPassword] = useState('')
  const [auth, setAuth] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const [products, setProducts] = useState<any[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formKey, setFormKey] = useState(0)

  const fetchProducts = async () => {
    const res = await fetch('/api/shop/products?store=all')
    const data = await res.json()
    setProducts(data.products || [])
  }

  useEffect(() => {
    if (auth) fetchProducts()
  }, [auth])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length > 5) setAuth(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setMessage('')
    setFormKey(prev => prev + 1)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product and its image?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/shop/products/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
      })
      if (res.ok) {
        setMessage('Product deleted')
        fetchProducts()
      } else {
        setMessage('Delete failed: ' + (await res.json()).error)
      }
    } finally { setLoading(false) }
  }

  const handleEdit = (product: any) => {
    setEditingId(product.id)
    setMessage('')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    const formData = new FormData(e.currentTarget)
    formData.append('password', password)

    try {
      if (editingId) {
        const bodyObj = {
          password,
          name: formData.get('name'),
          description: formData.get('description'),
          price: formData.get('price'),
          category: formData.get('category'),
          subCategory: formData.get('subCategory')
        }
        const res = await fetch(`/api/shop/products/${editingId}`, { 
          method: 'PATCH', 
          body: JSON.stringify(bodyObj), 
          headers: { 'Content-Type': 'application/json' } 
        })
        if (res.ok) { 
          setMessage('Product updated successfully!')
          fetchProducts()
          resetForm() 
        }
        else { setMessage('Update failed') }
      } else {
        const res = await fetch('/api/shop/admin', { method: 'POST', body: formData })
        const data = await res.json()
        if (res.ok) { 
          setMessage('Product published successfully!')
          fetchProducts()
          resetForm() 
        }
        else { setMessage(data.error || 'Upload failed') }
      }
    } catch (err: any) {
      setMessage(err.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  const editingProduct = products.find(p => p.id === editingId)

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
    <div className="min-h-screen bg-slate-950 pt-24 pb-20 px-4 text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{editingId ? 'Edit Product' : 'Upload New Product'}</h1>
            {editingId && (
              <button onClick={resetForm} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                <PlusCircle className="w-4 h-4" /> Create New Instead
              </button>
            )}
          </div>
          
          {message && (
            <div className={`p-4 rounded-xl mb-6 flex items-center gap-2 ${message.includes('success') ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
              {message.includes('success') ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {message}
            </div>
          )}

          <form key={formKey} onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-1">Storefront</label>
                <select name="store" defaultValue={editingProduct?.store || 'wavvemarket'} required disabled={!!editingId} className="w-full px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-white disabled:opacity-50">
                  <option value="wavvemarket">WavveMarket</option>
                  <option value="wavecore">WaveCore ERP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-1">Product Name</label>
                <input name="name" defaultValue={editingProduct?.name || ''} required className="w-full px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-white focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-1">Category</label>
                <select name="category" defaultValue={editingProduct?.category || 'Men'} required className="w-full px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-white">
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Kids">Kids</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Wavvemarket">Wavvemarket</option>
                  <option value="ERP Modules">ERP Modules</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-1">Sub-Category</label>
                <select name="subCategory" defaultValue={editingProduct?.subcategory || 'View All'} required className="w-full px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-white">
                  <option value="Shirts">Shirts</option>
                  <option value="Outerwear">Outerwear</option>
                  <option value="Drones">Drones</option>
                  <option value="Hats">Hats</option>
                  <option value="View All">View All</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-1">Price (KSh)</label>
                <input name="price" type="number" defaultValue={editingProduct?.price || ''} required className="w-full px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-white" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-400 mb-1">Description</label>
              <textarea name="description" defaultValue={editingProduct?.description || ''} className="w-full px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-white h-24" />
            </div>

            {!editingId && (
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-1">Image (800x800 px)</label>
                <input type="file" name="image" accept="image/*" required className="w-full px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-white" />
                <p className="text-xs text-slate-500 mt-1">To replace an image, delete the product and create a new one.</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2">
              {loading ? 'Processing...' : editingId ? 'Update Product' : 'Publish Product'}
            </button>
          </form>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl p-8">
          <h2 className="text-xl font-bold mb-6">Manage Products ({products.length})</h2>
          <div className="space-y-3">
            {products.map(p => (
              <div key={p.id} className="flex items-center gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                  {p.imageUrl && <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{p.name}</h3>
                  <p className="text-sm text-slate-400">{p.store.toUpperCase()} • {p.category} / {p.subCategory}</p>
                </div>
                <p className="font-bold text-lg text-pink-400">KSh {Number(p.price).toLocaleString()}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleEdit(p)} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-blue-400">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => handleDelete(p.id)} className="p-2 bg-slate-700 hover:bg-red-900/50 rounded-lg text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {products.length === 0 && <p className="text-slate-500">No products uploaded yet.</p>}
          </div>
        </div>

      </div>
    </div>
  )
}