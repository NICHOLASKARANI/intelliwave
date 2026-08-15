'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Plus, Search, Trash2, Save, Truck, AlertCircle, CheckCircle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Product {
  id: string
  name: string
  sku: string
  total_stock: number
  costPrice: number
}

interface StockItem {
  productId: string
  name: string
  quantity: number
  costPrice: number
}

export default function StockInPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [items, setItems] = useState<StockItem[]>([])
  const [search, setSearch] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetch('/api/wavecore/inventory/products').then(r => r.json()).then(d => setProducts(d.products || [])).catch(() => {})
  }, [])

  const addItem = (product: Product) => {
    const existing = items.find(i => i.productId === product.id)
    if (existing) {
      setItems(items.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i))
    } else {
      setItems([...items, { productId: product.id, name: product.name, quantity: 1, costPrice: product.costPrice || 0 }])
    }
  }

  const removeItem = (productId: string) => setItems(items.filter(i => i.productId !== productId))

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) { removeItem(productId); return }
    setItems(items.map(i => i.productId === productId ? { ...i, quantity } : i))
  }

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  )

  const handleStockIn = async () => {
    if (items.length === 0) { setError('Add at least one product'); return }
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      for (const item of items) {
        await fetch('/api/wavecore/inventory/movements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'RECEIPT', productId: item.productId, quantity: item.quantity }),
        })
      }
      setSuccess(`Stock In completed! ${items.length} products received from ${supplierName || 'supplier'}`)
      setItems([])
      setSupplierName('')
    } catch { setError('Failed to process stock in') } finally { setLoading(false) }
  }

  const handleExport = () => {
    const csv = 'Product,Quantity,Cost Price,Total\n' + items.map(i => `${i.name},${i.quantity},${i.costPrice},${i.quantity * i.costPrice}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'stock-in.csv'
    a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Stock In</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Truck className="w-6 h-6 text-orange-500" /> Stock In</h1>

        {error && <div className="p-4 mb-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
        {success && <div className="p-4 mb-4 rounded-xl bg-green-50 text-green-600 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {success}</div>}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Supplier Name</label>
          <input type="text" value={supplierName} onChange={(e) => setSupplierName(e.target.value)}
            className="w-full md:w-80 px-4 py-2.5 rounded-xl border" placeholder="Supplier name (optional)" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Product List */}
          <div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2.5 rounded-xl border text-sm w-full" placeholder="Search products..." />
            </div>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filtered.map((p) => (
                <button key={p.id} onClick={() => addItem(p)}
                  className="w-full p-4 rounded-xl border bg-white dark:bg-neutral-900 text-left hover:border-orange-300 hover:shadow-md transition-all">
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.sku} • Stock: {p.total_stock || 0}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Stock In Items */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 h-fit sticky top-20">
            <h3 className="font-bold mb-3">Items to Receive ({items.length})</h3>
            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-2 py-2 border-b">
                  <div className="flex-1"><p className="text-sm font-medium">{item.name}</p></div>
                  <input type="number" value={item.quantity} min="1"
                    onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 rounded-lg border text-sm text-center" />
                  <button onClick={() => removeItem(item.productId)} className="p-1 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Click products to add them</p>}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleStockIn} disabled={loading || items.length === 0} className="flex-1 gap-2 bg-orange-600 hover:bg-orange-700">
                <Save className="w-4 h-4" /> {loading ? 'Processing...' : 'Complete Stock In'}
              </Button>
              {items.length > 0 && <Button variant="outline" onClick={handleExport}><Download className="w-4 h-4" /></Button>}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}