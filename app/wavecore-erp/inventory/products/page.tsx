'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Search, Trash2, Package, Download, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function fetchProducts() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/inventory/products')
      if (res.ok) { const data = await res.json(); setProducts(data.products || []) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchProducts() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return
    try { await fetch(`/api/wavecore/inventory/products/${id}`, { method: 'DELETE' }); fetchProducts() } catch {}
  }

  const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/inventory" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Products</span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold">Products</h1>
          <Link href="/wavecore-erp/inventory/products/create"><Button className="gap-2 bg-orange-600"><Plus className="w-4 h-4" /> Add Product</Button></Link>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl border text-sm w-full" placeholder="Search products..." />
        </div>
        {loading ? <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" /></div> :
          filtered.length > 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                  <th className="text-left p-4">Product</th><th className="text-left p-4">SKU</th>
                  <th className="text-right p-4">Stock</th><th className="text-right p-4">Cost</th>
                  <th className="text-right p-4">Selling</th><th className="text-center p-4">Actions</th>
                </tr></thead>
                <tbody>{filtered.map(p => (
                  <tr key={p.id} className="border-b">
                    <td className="p-4 font-medium">{p.name}</td><td className="p-4">{p.sku}</td>
                    <td className="p-4 text-right">{p.total_stock || 0}</td>
                    <td className="p-4 text-right">{p.costPrice}</td><td className="p-4 text-right">{p.sellingPrice}</td>
                    <td className="p-4 text-center"><button onClick={() => handleDelete(p.id)} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <p className="text-center py-12 text-muted-foreground">No products found</p>
        }
      </main>
    </div>
  )
}