'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Package, Loader2, ChevronLeft, Search, Check, X, Save, AlertTriangle,
  Upload, FileText, Eye, EyeOff, Store, TrendingUp, RefreshCw,
} from 'lucide-react'

export default function InventoryPage() {
  const [listings, setListings] = useState<any[]>([])
  const [counts, setCounts] = useState({ all: 0, active: 0, draft: 0, outOfStock: 0, lowStock: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<{ id: number, field: 'stock' | 'price', value: string } | null>(null)
  const [saving, setSaving] = useState<number | null>(null)
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [csvResult, setCsvResult] = useState<any>(null)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchListings = async () => {
    setLoading(true)
    try {
      const url = `/api/marketplace/seller/inventory?filter=${filter}&search=${encodeURIComponent(search)}`
      const res = await fetch(url)
      if (res.ok) {
        const d = await res.json()
        setListings(d.listings || [])
        setCounts(d.counts || { all: 0, active: 0, draft: 0, outOfStock: 0, lowStock: 0 })
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchListings() }, [filter])

  const updateField = async (id: number, field: 'stock' | 'price', value: number) => {
    setSaving(id)
    try {
      const res = await fetch('/api/marketplace/seller/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: id, [field]: value }),
      })
      if (res.ok) {
        setEditing(null)
        fetchListings()
      } else {
        const d = await res.json()
        alert(d.error || 'Failed to update')
      }
    } finally { setSaving(null) }
  }

  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'DRAFT' : 'ACTIVE'
    setSaving(id)
    try {
      const res = await fetch('/api/marketplace/seller/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: id, status: newStatus }),
      })
      if (res.ok) fetchListings()
    } finally { setSaving(null) }
  }

  const handleCsvUpload = async () => {
    setImporting(true)
    setCsvResult(null)
    try {
      const lines = csvText.trim().split('\n').filter(l => l.trim())
      if (lines.length === 0) { alert('CSV is empty'); return }

      const header = lines[0].split(',').map(h => h.trim().toLowerCase())
      const idIdx = header.indexOf('id')
      const skuIdx = header.indexOf('sku')
      const priceIdx = header.indexOf('price')
      const stockIdx = header.indexOf('stock')
      const statusIdx = header.indexOf('status')

      if (idIdx < 0 && skuIdx < 0) {
        alert('CSV must have "id" or "sku" column to match listings')
        return
      }
      if (priceIdx < 0 && stockIdx < 0 && statusIdx < 0) {
        alert('CSV must have at least one of: price, stock, status')
        return
      }

      const rows: any[] = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim())
        const row: any = {}
        if (idIdx >= 0) row.id = cols[idIdx]
        if (skuIdx >= 0) row.sku = cols[skuIdx]
        if (priceIdx >= 0) row.price = cols[priceIdx]
        if (stockIdx >= 0) row.stock = cols[stockIdx]
        if (statusIdx >= 0) row.status = cols[statusIdx]
        rows.push(row)
      }

      const res = await fetch('/api/marketplace/seller/inventory/bulk-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
      if (res.ok) {
        const d = await res.json()
        setCsvResult(d)
        fetchListings()
      } else {
        const d = await res.json()
        alert(d.error || 'Import failed')
      }
    } finally { setImporting(false) }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setCsvText(String(ev.target?.result || ''))
    reader.readAsText(file)
  }

  const filterChips = [
    { key: 'ALL', label: 'All', count: counts.all },
    { key: 'ACTIVE', label: 'Active', count: counts.active },
    { key: 'DRAFT', label: 'Draft', count: counts.draft },
    { key: 'LOW_STOCK', label: 'Low Stock', count: counts.lowStock },
    { key: 'OUT_OF_STOCK', label: 'Out of Stock', count: counts.outOfStock },
  ]

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/marketplace/seller/dashboard" className="flex items-center gap-2 font-bold">
              <ChevronLeft className="w-5 h-5" /> Back
            </Link>
            <span className="text-neutral-700">|</span>
            <span className="font-bold text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-cyan-400" /> Inventory
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCsvModal(true)}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-1"
            >
              <Upload className="w-3.5 h-3.5" /> Bulk CSV
            </button>
            <Link href="/marketplace/seller/orders" className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold">Orders</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-6">
        {/* Filters */}
        <div className="mb-4 space-y-3">
          <div className="flex gap-1 flex-wrap">
            {filterChips.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${filter === f.key ? 'bg-cyan-500 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}
              >
                {f.label} {f.count > 0 && <span className="opacity-70">({f.count})</span>}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchListings()}
              placeholder="Search by title or SKU... (press Enter)"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-bold">No listings</p>
            <Link href="/marketplace/sell" className="inline-block mt-4 px-6 py-3 rounded-xl bg-amber-500 text-white font-bold text-sm">Create Listing</Link>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-2 p-3 border-b border-neutral-800 text-[10px] uppercase font-bold text-neutral-500">
              <div className="col-span-5">Product</div>
              <div className="col-span-2 text-right">Price (KES)</div>
              <div className="col-span-2 text-center">Stock</div>
              <div className="col-span-1 text-center">Views</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            <div className="divide-y divide-neutral-800">
              {listings.map(l => {
                const isLowStock = l.stock > 0 && l.stock <= 3
                const isOutOfStock = l.stock === 0
                const isDraft = l.status === 'DRAFT'
                return (
                  <div key={l.id} className={`grid grid-cols-1 md:grid-cols-12 gap-2 p-3 items-center ${isDraft ? 'opacity-60' : ''}`}>
                    {/* Product */}
                    <div className="md:col-span-5 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-neutral-800 overflow-hidden flex-shrink-0">
                        {l.images?.[0] ? (
                          <img src={l.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-neutral-600" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/marketplace/listing/${l.id}`} className="font-bold text-sm hover:text-cyan-400 truncate block">{l.title}</Link>
                        <p className="text-xs text-neutral-500">{l.sku || 'No SKU'} · {l.status}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="md:col-span-2 md:text-right">
                      {editing?.id === l.id && editing.field === 'price' ? (
                        <input
                          type="number"
                          value={editing.value}
                          onChange={e => setEditing({ ...editing, value: e.target.value })}
                          onBlur={() => updateField(l.id, 'price', parseFloat(editing.value) || 0)}
                          onKeyDown={e => { if (e.key === 'Enter') updateField(l.id, 'price', parseFloat(editing.value) || 0); if (e.key === 'Escape') setEditing(null) }}
                          className="w-24 px-2 py-1 rounded bg-neutral-800 border border-cyan-500 text-white text-sm text-right"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => setEditing({ id: l.id, field: 'price', value: String(l.price) })}
                          className="text-sm font-bold hover:text-cyan-400 hover:underline"
                        >
                          {Number(l.price).toLocaleString()}
                        </button>
                      )}
                    </div>

                    {/* Stock */}
                    <div className="md:col-span-2 flex md:justify-center items-center gap-1">
                      {editing?.id === l.id && editing.field === 'stock' ? (
                        <input
                          type="number"
                          value={editing.value}
                          onChange={e => setEditing({ ...editing, value: e.target.value })}
                          onBlur={() => updateField(l.id, 'stock', parseInt(editing.value) || 0)}
                          onKeyDown={e => { if (e.key === 'Enter') updateField(l.id, 'stock', parseInt(editing.value) || 0); if (e.key === 'Escape') setEditing(null) }}
                          className="w-20 px-2 py-1 rounded bg-neutral-800 border border-cyan-500 text-white text-sm text-center"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => setEditing({ id: l.id, field: 'stock', value: String(l.stock || 0) })}
                          className={`px-2 py-1 rounded-lg text-xs font-bold hover:underline ${
                            isOutOfStock ? 'bg-red-500/20 text-red-400' :
                            isLowStock ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                          }`}
                        >
                          {l.stock || 0}
                        </button>
                      )}
                    </div>

                    {/* Views */}
                    <div className="md:col-span-1 md:text-center text-xs text-neutral-500">
                      {l.views || 0}
                    </div>

                    {/* Actions */}
                    <div className="md:col-span-2 flex md:justify-end gap-1">
                      <Link
                        href={`/marketplace/listing/${l.id}`}
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
                        title="View"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => toggleStatus(l.id, l.status)}
                        disabled={saving === l.id}
                        className={`p-1.5 rounded-lg text-xs ${
                          isDraft ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400'
                        } disabled:opacity-50`}
                        title={isDraft ? 'Activate' : 'Pause'}
                      >
                        {isDraft ? <Check className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* CSV modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowCsvModal(false)}>
          <div className="bg-neutral-900 rounded-2xl max-w-2xl w-full p-6 border border-neutral-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-cyan-400" /> Bulk CSV Import</h2>
              <button onClick={() => setShowCsvModal(false)} className="text-neutral-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-neutral-400 mb-3">
              CSV format: <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-cyan-300">id,sku,price,stock,status</code> (header row required)<br />
              - Match by <b>id</b> OR <b>sku</b> (one is required)<br />
              - Update <b>price</b>, <b>stock</b>, and/or <b>status</b> (ACTIVE/DRAFT/SUSPENDED)<br />
              - Listings not owned by you are skipped
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full mb-2 py-2 rounded-lg border-2 border-dashed border-neutral-700 text-neutral-400 text-sm hover:border-cyan-500 hover:text-white"
            >
              📁 Choose CSV file
            </button>

            <textarea
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              rows={8}
              placeholder="id,sku,price,stock,status&#10;1,IP15,150000,10,ACTIVE&#10;2,,5000,20,ACTIVE"
              className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white font-mono text-xs mb-3"
            />

            {csvResult && (
              <div className="p-3 rounded-lg bg-green-950/50 border border-green-800 text-green-300 text-sm mb-3">
                ✓ Updated: {csvResult.updated} · Not found: {csvResult.notFound} · Skipped: {csvResult.skipped} (of {csvResult.total})
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleCsvUpload}
                disabled={importing || !csvText.trim()}
                className="flex-1 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {importing ? 'Importing...' : 'Import'}
              </button>
              <button
                onClick={() => { setShowCsvModal(false); setCsvText(''); setCsvResult(null) }}
                className="px-5 py-3 rounded-xl bg-neutral-800 font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}