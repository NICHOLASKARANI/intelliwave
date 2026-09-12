'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Loader2, Package, Warehouse, Printer, Search, Brain, LineChart, PieChart, ShoppingCart, Zap, DollarSign, ShieldAlert, Truck,
  ArrowLeft, ArrowLeftRight, RefreshCw, Sliders, ClipboardList, Layers, Activity,
  CheckCircle2, Clock, Plus, Trash2, ArrowRight
} from 'lucide-react'

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [activeKpi, setActiveKpi] = useState('ALL')
  const [deleting, setDeleting] = useState('')
  const [form, setForm] = useState({ productId: '', fromLocation: '', toLocation: '', quantity: '', buyingPrice: '', sellingPrice: '' })

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [transfersRes, productsRes, warehousesRes] = await Promise.all([
        fetch('/api/wavecore/inventory/transfers'),
        fetch('/api/wavecore/inventory/products'),
        fetch('/api/wavecore/inventory/warehouses')
      ])
      const tData = await transfersRes.json()
      setTransfers(tData.transfers || [])
      setSummary(tData.summary || {})
      setProducts((await productsRes.json()).products || [])
      setWarehouses((await warehousesRes.json()).warehouses || [])
    } catch (err) {
      setError('Failed to load transfers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const createTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!form.productId || !form.fromLocation || !form.toLocation || !form.quantity) {
      setError('All fields required')
      return
    }
    try {
      const res = await fetch('/api/wavecore/inventory/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, quantity: Number(form.quantity), buyingPrice: Number(form.buyingPrice || 0), sellingPrice: Number(form.sellingPrice || 0) })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess('Transfer created!')
        setTimeout(() => setSuccess(''), 3000)
        setForm({ productId: '', fromLocation: '', toLocation: '', quantity: '', buyingPrice: '', sellingPrice: '' })
        setShowForm(false)
        fetchData()
      } else {
        setError(data.error || 'Failed to create transfer')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  const deleteTransfer = async (id: string) => {
    if (!confirm('Delete this transfer?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/inventory/transfers?id=' + id, { method: 'DELETE' })
      if (res.ok) {
        setSuccess('Transfer deleted!')
        setTimeout(() => setSuccess(''), 3000)
        fetchData()
      }
    } catch (err) {
      setError('Delete failed')
    } finally {
      setDeleting('')
    }
  }

  const downloadPdf = (id: string) => {
    window.open('/api/wavecore/inventory/transfers/' + id + '/pdf', '_blank')
  }

  const filtered = transfers.filter(t => 
    activeKpi === 'ALL' || 
    (activeKpi === 'PENDING' && t.status === 'PENDING') ||
    (activeKpi === 'COMPLETED' && t.status === 'COMPLETED')
  )

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="fixed left-0 top-0 h-full w-64 bg-neutral-900 border-r border-neutral-800 z-50">
        <div className="p-4 border-b border-neutral-800">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
        </div>
        <nav className="p-4 space-y-2">
          <Link href="/wavecore-erp/inventory" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><ArrowLeft className="w-5 h-5" /> Dashboard</Link>
          <Link href="/wavecore-erp/inventory/products" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><Package className="w-5 h-5" /> Products</Link>
          <Link href="/wavecore-erp/inventory/warehouses" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><Warehouse className="w-5 h-5" /> Warehouses</Link>
          <Link href="/wavecore-erp/inventory/movements" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><ArrowLeftRight className="w-5 h-5" /> Movements</Link>
          <Link href="/wavecore-erp/inventory/adjustments" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><Sliders className="w-5 h-5" /> Adjustments</Link>
          <Link href="/wavecore-erp/inventory/counts" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><ClipboardList className="w-5 h-5" /> Counts</Link>
          <Link href="/wavecore-erp/inventory/ledger" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><Layers className="w-5 h-5" /> Ledger</Link>
          <Link href="/wavecore-erp/inventory/copilot" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><Brain className="w-5 h-5" /> AI Copilot</Link>
          <Link href="/wavecore-erp/inventory/forecasting" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><LineChart className="w-5 h-5" /> Forecasting</Link>
          <Link href="/wavecore-erp/inventory/abc-xyz" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><PieChart className="w-5 h-5" /> ABC/XYZ</Link>
          <Link href="/wavecore-erp/inventory/reorder" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><ShoppingCart className="w-5 h-5" /> Reorder</Link>
          <Link href="/wavecore-erp/inventory/transfers" className="flex items-center gap-3 p-3 rounded-xl bg-violet-600 text-white font-bold shadow-lg"><Truck className="w-5 h-5" /> Transfers</Link>
          <Link href="/wavecore-erp/inventory/atp" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><Zap className="w-5 h-5" /> ATP</Link>
          <Link href="/wavecore-erp/inventory/valuation" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><DollarSign className="w-5 h-5" /> Valuation</Link>
          <Link href="/wavecore-erp/inventory/anomalies" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><ShieldAlert className="w-5 h-5" /> Anomalies</Link>
        </nav>
      </div>

      <div className="ml-64 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Truck className="w-6 h-6 text-violet-500" /> Multi-Warehouse Transfers</h1>
            <p className="text-sm text-neutral-400 mt-1">Transfer stock between warehouses with tracking</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2.5 rounded-xl bg-violet-600 text-white font-bold flex items-center gap-2 hover:bg-violet-700 shadow-lg"><Plus className="w-4 h-4" /> New Transfer</button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {showForm && (
          <form onSubmit={createTransfer} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <select value={form.productId} onChange={(e) => setForm({...form, productId: e.target.value})} className="px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                <option value="">Select product...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({...form, quantity: e.target.value})} className="px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              <input type="text" placeholder="From Location (e.g. Nairobi Store)" value={form.fromLocation} onChange={(e) => setForm({...form, fromLocation: e.target.value})} className="px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              <input type="text" placeholder="To Location (e.g. Mombasa Warehouse)" value={form.toLocation} onChange={(e) => setForm({...form, toLocation: e.target.value})} className="px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              <input type="number" placeholder="Buying Price (KSh)" value={form.buyingPrice} onChange={(e) => setForm({...form, buyingPrice: e.target.value})} className="px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              <input type="number" placeholder="Selling Price (KSh)" value={form.sellingPrice} onChange={(e) => setForm({...form, sellingPrice: e.target.value})} className="px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
            </div>
            <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700">Create Transfer</button>
          </form>
        )}

        <div className="grid grid-cols-3 gap-4 mb-6">
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-800 text-white shadow-lg ' + (activeKpi === 'ALL' ? 'ring-4 ring-violet-300' : '')}><Truck className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalTransfers || 0}</p><p className="text-xs">Total</p></button>
          <button onClick={() => setActiveKpi('PENDING')} className={'p-4 rounded-2xl bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg ' + (activeKpi === 'PENDING' ? 'ring-4 ring-yellow-300' : '')}><Clock className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.pending || 0}</p><p className="text-xs">Pending</p></button>
          <button onClick={() => setActiveKpi('COMPLETED')} className={'p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg ' + (activeKpi === 'COMPLETED' ? 'ring-4 ring-green-300' : '')}><CheckCircle2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.completed || 0}</p><p className="text-xs">Completed</p></button>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-12 h-12 animate-spin mx-auto text-violet-500" /></div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl">
            <table className="w-full">
              <thead className="bg-neutral-800"><tr><th className="text-left p-4">#</th><th className="text-left p-4">Product</th><th className="text-left p-4">From</th><th className="text-left p-4">To</th><th className="text-right p-4">Qty</th><th className="text-left p-4">Status</th><th className="text-center p-4">Actions</th></tr></thead>
              <tbody>
                {filtered.map((t: any) => (
                  <tr key={t.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                    <td className="p-4 font-mono text-xs text-neutral-400">{t.number}</td>
                    <td className="p-4 font-bold text-white">{t.productName}</td>
                    <td className="p-4 text-neutral-300">{t.fromLocation || 'N/A'}</td>
                    <td className="p-4 text-neutral-300">{t.toLocation || 'N/A'}</td>
                    <td className="p-4 text-right text-white font-bold">{t.quantity}</td>
                    <td className="p-4"><span className={'px-2 py-1 rounded-full text-xs font-bold ' + (t.status === 'COMPLETED' ? 'bg-green-900/50 text-green-300' : 'bg-yellow-900/50 text-yellow-300')}>{t.status}</span></td>
                    <td className="p-4"><div className="flex gap-2 justify-center"><button onClick={() => downloadPdf(t.id)} className="p-2 rounded-lg bg-blue-900/50 text-blue-300"><Printer className="w-4 h-4" /></button><button onClick={() => deleteTransfer(t.id)} className="p-2 rounded-lg bg-red-900/50 text-red-300"><Trash2 className="w-4 h-4" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}