'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Layers, Plus, Trash2, Loader2, Package, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function BOMPage() {
  const [boms, setBoms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [productName, setProductName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function fetchBOMs() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/manufacturing/bom')
      if (res.ok) { const data = await res.json(); setBoms(data.boms || []) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchBOMs() }, [])

  const handleAdd = async () => {
    setError(''); setSuccess('')
    if (!name || !productName) { setError('Both fields required'); return }
    try {
      const res = await fetch('/api/wavecore/manufacturing/bom', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, productName, quantity: parseInt(quantity) || 1 }),
      })
      const data = await res.json()
      if (res.ok) { setSuccess('BOM created!'); setShowAdd(false); setName(''); setProductName(''); setQuantity('1'); fetchBOMs() }
      else { setError(data.error || 'Failed') }
    } catch { setError('Network error') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this BOM?')) return
    try { await fetch(`/api/wavecore/manufacturing/bom/${id}`, { method: 'DELETE' }); fetchBOMs() } catch {}
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/manufacturing" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Bill of Materials</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Layers className="w-6 h-6 text-green-500" /> Bill of Materials</h1>
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-green-600"><Plus className="w-4 h-4" /> New BOM</Button>
        </div>

        {error && <div className="p-4 mb-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
        {success && <div className="p-4 mb-4 rounded-xl bg-green-50 text-green-600 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {success}</div>}

        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <h3 className="font-bold mb-4">Create BOM</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium mb-2">BOM Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" placeholder="BOM Name" />
              </div>
              <div><label className="block text-sm font-medium mb-2">Product *</label>
                <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" placeholder="Product" />
              </div>
              <div><label className="block text-sm font-medium mb-2">Quantity</label>
                <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" min="1" />
              </div>
            </div>
            <Button onClick={handleAdd} className="mt-4 gap-2"><Plus className="w-4 h-4" /> Create BOM</Button>
          </div>
        )}

        {loading ? <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-green-500" /></div> :
          boms.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {boms.map(b => (
                <div key={b.id} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg">
                  <div className="flex justify-between items-start">
                    <div><Layers className="w-6 h-6 text-green-500 mb-2" /><p className="font-bold">{b.name}</p><p className="text-sm text-muted-foreground">{b.productName} • Qty: {b.quantity}</p></div>
                    <button onClick={() => handleDelete(b.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border"><Package className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No BOMs yet</p></div>
        }
      </main>
    </div>
  )
}