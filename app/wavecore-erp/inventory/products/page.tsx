'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Loader2, Package, Plus, Trash2, Printer, Search, X,
  ArrowLeft, RefreshCw, CheckCircle2, AlertTriangle
} from 'lucide-react'

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState('')
  const [form, setForm] = useState({
    name: '', sku: '', category: '', costPrice: '', sellingPrice: '',
    minStock: '10', maxStock: '100', initialStock: '0', unit: 'pcs', barcode: '', description: ''
  })

  const fetchProducts = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/inventory/products')
      const data = await res.json()
      setProducts(data.products || [])
    } catch (err) {
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!form.name || !form.sellingPrice) {
      setError('Product name and selling price are required')
      return
    }
    try {
      const res = await fetch('/api/wavecore/inventory/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          costPrice: Number(form.costPrice || 0),
          sellingPrice: Number(form.sellingPrice || 0),
          minStock: Number(form.minStock || 10),
          maxStock: Number(form.maxStock || 100),
          initialStock: Number(form.initialStock || 0)
        })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess('Product created successfully!')
        setTimeout(() => setSuccess(''), 3000)
        setForm({ name: '', sku: '', category: '', costPrice: '', sellingPrice: '', minStock: '10', maxStock: '100', initialStock: '0', unit: 'pcs', barcode: '', description: '' })
        setShowForm(false)
        fetchProducts()
      } else {
        setError(data.error || 'Failed to create product')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm('Delete product "' + name + '"?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/inventory/products?id=' + id, { method: 'DELETE' })
      if (res.ok) {
        setSuccess('Product deleted!')
        setTimeout(() => setSuccess(''), 3000)
        fetchProducts()
      }
    } catch (err) {
      setError('Delete failed')
    } finally {
      setDeleting('')
    }
  }

  const downloadPdf = (id: string) => {
    window.open('/api/wavecore/inventory/products/' + id + '/pdf', '_blank')
  }

  const filtered = products.filter(p => 
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Dark Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-neutral-900 border-r border-neutral-800 z-50">
        <div className="p-4 border-b border-neutral-800">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
        </div>
        <nav className="p-4 space-y-2">
          <Link href="/wavecore-erp/inventory" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <ArrowLeft className="w-5 h-5" /> Back to Inventory
          </Link>
          <Link href="/wavecore-erp/inventory/products" className="flex items-center gap-3 p-3 rounded-xl bg-indigo-600 text-white font-bold">
            <Package className="w-5 h-5" /> Products
          </Link>
          <Link href="/wavecore-erp/inventory/warehouses" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <Package className="w-5 h-5" /> Warehouses
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-indigo-500" /> Products ({products.length})
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Manage your inventory products</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(!showForm)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg">
              <Plus className="w-4 h-4" /> Add Product
            </button>
            <button onClick={fetchProducts}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 text-white font-bold flex items-center gap-2 hover:bg-neutral-700">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {showForm && (
          <form onSubmit={createProduct} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 mb-6">
            <div className="flex justify-between mb-4">
              <h2 className="font-bold text-lg text-white">New Product</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">SKU</label>
                <input type="text" value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Category</label>
                <input type="text" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Cost Price (KSh)</label>
                <input type="number" value={form.costPrice} onChange={(e) => setForm({...form, costPrice: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Selling Price (KSh) *</label>
                <input type="number" value={form.sellingPrice} onChange={(e) => setForm({...form, sellingPrice: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Initial Stock</label>
                <input type="number" value={form.initialStock} onChange={(e) => setForm({...form, initialStock: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Min Stock</label>
                <input type="number" value={form.minStock} onChange={(e) => setForm({...form, minStock: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Max Stock</label>
                <input type="number" value={form.maxStock} onChange={(e) => setForm({...form, maxStock: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Unit</label>
                <select value={form.unit} onChange={(e) => setForm({...form, unit: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="pcs">Pieces</option>
                  <option value="kg">Kilograms</option>
                  <option value="l">Liters</option>
                  <option value="box">Box</option>
                  <option value="carton">Carton</option>
                </select>
              </div>
            </div>
            <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold shadow-lg hover:bg-indigo-700">Create Product</button>
          </form>
        )}

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white w-full focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Search products..." />
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-neutral-400">No products found</p>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-800">
                <tr>
                  <th className="text-left p-4 text-neutral-400">Product</th>
                  <th className="text-left p-4 text-neutral-400">SKU</th>
                  <th className="text-left p-4 text-neutral-400">Category</th>
                  <th className="text-right p-4 text-neutral-400">Cost</th>
                  <th className="text-right p-4 text-neutral-400">Selling</th>
                  <th className="text-right p-4 text-neutral-400">Stock</th>
                  <th className="text-right p-4 text-neutral-400">Value</th>
                  <th className="text-center p-4 text-neutral-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p: any) => {
                  const stock = Number(p.stock_level || 0)
                  const price = Number(p.sellingPrice || 0)
                  return (
                    <tr key={p.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                      <td className="p-4 font-bold text-white">{p.name}</td>
                      <td className="p-4 font-mono text-sm text-neutral-400">{p.sku || 'N/A'}</td>
                      <td className="p-4"><span className="px-2 py-1 rounded-full text-xs bg-indigo-900/50 text-indigo-300">{p.category || 'Uncategorized'}</span></td>
                      <td className="p-4 text-right text-neutral-400">KSh {(Number(p.costPrice) || 0).toLocaleString()}</td>
                      <td className="p-4 text-right text-white font-bold">KSh {price.toLocaleString()}</td>
                      <td className="p-4 text-right">
                        <span className={stock === 0 ? 'text-red-400 font-bold' : stock < Number(p.minStock || 10) ? 'text-yellow-400 font-bold' : 'text-green-400 font-bold'}>
                          {stock}
                        </span>
                      </td>
                      <td className="p-4 text-right text-indigo-300 font-bold">KSh {(stock * price).toLocaleString()}</td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => downloadPdf(p.id)} className="p-2 rounded-lg bg-blue-900/50 text-blue-300 hover:bg-blue-800" title="PDF">
                            <Printer className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteProduct(p.id, p.name)} disabled={deleting === p.id} className="p-2 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800" title="Delete">
                            {deleting === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}