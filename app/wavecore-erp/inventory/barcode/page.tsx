'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Loader2, Package, Warehouse, Printer, Search, Brain, LineChart, PieChart, ShoppingCart, Zap, DollarSign, ShieldAlert, Barcode as BarcodeIcon,
  ArrowLeft, ArrowLeftRight, RefreshCw, Sliders, ClipboardList, Layers, Activity,
  CheckCircle2, Scan, QrCode
} from 'lucide-react'

export default function BarcodePage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [scanInput, setScanInput] = useState('')
  const [scanResult, setScanResult] = useState<any>(null)

  const fetchProducts = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/inventory/barcode')
      const data = await res.json()
      setProducts(data.products || [])
    } catch (err) {
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProducts() }, [])

  const generateBarcode = async (productId: string) => {
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/wavecore/inventory/barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess('Barcode generated: ' + data.barcode)
        setTimeout(() => setSuccess(''), 3000)
        fetchProducts()
      } else {
        setError(data.error || 'Failed to generate barcode')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  const scanBarcode = async () => {
    if (!scanInput.trim()) return
    setError('')
    setScanResult(null)
    try {
      const res = await fetch('/api/wavecore/inventory/barcode?barcode=' + encodeURIComponent(scanInput))
      const data = await res.json()
      if (res.ok) {
        setScanResult(data.product)
      } else {
        setError(data.error || 'Product not found')
      }
    } catch (err) {
      setError('Scan failed')
    }
  }

  const filtered = products.filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode || '').toLowerCase().includes(search.toLowerCase())
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
          <Link href="/wavecore-erp/inventory/barcode" className="flex items-center gap-3 p-3 rounded-xl bg-cyan-600 text-white font-bold shadow-lg"><BarcodeIcon className="w-5 h-5" /> Barcode</Link>
          <Link href="/wavecore-erp/inventory/atp" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><Zap className="w-5 h-5" /> ATP</Link>
          <Link href="/wavecore-erp/inventory/valuation" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><DollarSign className="w-5 h-5" /> Valuation</Link>
          <Link href="/wavecore-erp/inventory/anomalies" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><ShieldAlert className="w-5 h-5" /> Anomalies</Link>
        </nav>
      </div>

      <div className="ml-64 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2"><BarcodeIcon className="w-6 h-6 text-cyan-500" /> Barcode / QR Code</h1>
            <p className="text-sm text-neutral-400 mt-1">Generate and scan barcodes</p>
          </div>
          <button onClick={fetchProducts} className="px-4 py-2.5 rounded-xl bg-neutral-800 text-white font-bold flex items-center gap-2 hover:bg-neutral-700"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* SCAN SECTION */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 mb-6">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2"><Scan className="w-5 h-5 text-cyan-400" /> Scan Barcode</h2>
          <div className="flex gap-2">
            <input type="text" value={scanInput} onChange={(e) => setScanInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') scanBarcode() }}
              placeholder="Enter barcode to scan..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            <button onClick={scanBarcode} className="px-4 py-2.5 rounded-xl bg-cyan-600 text-white font-bold flex items-center gap-2 hover:bg-cyan-700">
              <Scan className="w-4 h-4" /> Scan
            </button>
          </div>
          {scanResult && (
            <div className="mt-4 p-4 rounded-xl bg-cyan-900/30 border border-cyan-800">
              <p className="font-bold text-white">{scanResult.name}</p>
              <p className="text-neutral-300">SKU: {scanResult.sku || 'N/A'}</p>
              <p className="text-neutral-300">Stock: {scanResult.currentStock || 0}</p>
              <p className="text-cyan-300 font-bold">KSh {Number(scanResult.sellingPrice || 0).toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* PRODUCTS TABLE */}
        <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white w-full focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Search products..." /></div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-12 h-12 animate-spin mx-auto text-cyan-500" /></div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl">
            <table className="w-full">
              <thead className="bg-neutral-800"><tr><th className="text-left p-4 text-neutral-400 text-sm">Product</th><th className="text-left p-4 text-neutral-400 text-sm">SKU</th><th className="text-left p-4 text-neutral-400 text-sm">Barcode</th><th className="text-right p-4 text-neutral-400 text-sm">Price</th><th className="text-center p-4 text-neutral-400 text-sm">Actions</th></tr></thead>
              <tbody>
                {filtered.map((p: any) => (
                  <tr key={p.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                    <td className="p-4 font-bold text-white">{p.name}</td>
                    <td className="p-4 text-neutral-300 font-mono">{p.sku || 'N/A'}</td>
                    <td className="p-4 text-neutral-300 font-mono">
                      {p.barcode ? (
                        <span className="px-3 py-1 rounded-lg bg-cyan-900/30 text-cyan-300">{p.barcode}</span>
                      ) : (
                        <span className="text-neutral-500">No barcode</span>
                      )}
                    </td>
                    <td className="p-4 text-right text-neutral-300">KSh {Number(p.sellingPrice || 0).toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <button onClick={() => generateBarcode(p.id)} className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-700">
                        <QrCode className="w-3 h-3" /> Generate
                      </button>
                    </td>
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