'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Search, Trash2, Edit3, Download, Loader2, Package } from 'lucide-react'

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<any>(null)
  const [showEdit, setShowEdit] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/wavecore/store')
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch {} finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return
    try {
      await fetch(`/api/wavecore/store?id=${id}`, { method: 'DELETE' })
      fetchProducts()
    } catch {}
  }

  const handleEdit = (product: any) => {
    setEditing(product)
    setShowEdit(true)
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    try {
      await fetch('/api/wavecore/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      })
      setShowEdit(false)
      fetchProducts()
    } catch {}
  }

  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - Products',
      '='.repeat(50),
      'Generated: ' + new Date().toLocaleString(),
      'IntelliWavve - Point of Sale',
      '='.repeat(50),
      '',
      ...filtered.map((p: any, i: number) => 
        'Product #' + (i + 1) + '\n' +
        '  Name: ' + p.name + '\n' +
        '  SKU: ' + (p.sku || 'N/A') + '\n' +
        '  Category: ' + (p.category || 'N/A') + '\n' +
        '  Selling Price: KSh ' + (p.sellingPrice || 0) + '\n' +
        '  Cost Price: KSh ' + (p.costPrice || 0) + '\n' +
        '  Stock: ' + (p.stock_level || 0) + '\n' +
        '-'.repeat(40)
      ),
      '',
      '© 2026 IntelliWavve - All Rights Reserved'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'products.pdf'; a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Products</span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="w-6 h-6 text-orange-500" /> Products</h1>
          <div className="flex gap-2">
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium">
              <Download className="w-4 h-4" /> PDF
            </button>
            <Link href="/wavecore-erp/store/products/create" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Product
            </Link>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border text-sm w-full" placeholder="Search products..." />
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" /></div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">SKU</th>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-right">Selling</th>
                  <th className="p-3 text-right">Stock</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b hover:bg-neutral-50">
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3">{p.sku || '-'}</td>
                    <td className="p-3">{p.category || '-'}</td>
                    <td className="p-3 text-right">KSh {p.sellingPrice || 0}</td>
                    <td className="p-3 text-right">{p.stock_level || 0}</td>
                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleEdit(p)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No products found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {showEdit && editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Edit Product</h2>
            <div className="space-y-3">
              <input type="text" value={editing.name} onChange={(e) => setEditing({...editing, name: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl border" placeholder="Name" />
              <input type="text" value={editing.sku} onChange={(e) => setEditing({...editing, sku: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl border" placeholder="SKU" />
              <input type="text" value={editing.category} onChange={(e) => setEditing({...editing, category: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl border" placeholder="Category" />
              <input type="number" value={editing.sellingPrice} onChange={(e) => setEditing({...editing, sellingPrice: parseFloat(e.target.value)})}
                className="w-full px-4 py-2.5 rounded-xl border" placeholder="Selling Price" />
              <input type="number" value={editing.costPrice} onChange={(e) => setEditing({...editing, costPrice: parseFloat(e.target.value)})}
                className="w-full px-4 py-2.5 rounded-xl border" placeholder="Cost Price" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleSaveEdit} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-medium">Save</button>
              <button onClick={() => setShowEdit(false)} className="flex-1 py-2.5 rounded-xl border font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}