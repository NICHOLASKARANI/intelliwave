'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Scan, Search, Download, Loader2, Package } from 'lucide-react'

export default function BarcodePage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [barcode, setBarcode] = useState('')
  const [scannedProduct, setScannedProduct] = useState<any>(null)
  const [scanHistory, setScanHistory] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/wavecore/inventory/products')
      .then(r => r.json())
      .then(d => setProducts(d.products || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value
    setBarcode(code)
    const found = products.find(p => p.sku === code || p.barcode === code)
    if (found) {
      setScannedProduct(found)
      setScanHistory(prev => [{ ...found, scannedAt: new Date().toLocaleTimeString() }, ...prev])
      setBarcode('')
    }
  }

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Barcode Scan History', '='.repeat(50), '', ...scanHistory.map((s, i) => `${i+1}. ${s.name} (SKU: ${s.sku}) - ${s.scannedAt}`), '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'barcode-scan.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/inventory" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Barcode Scanner</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Scan className="w-6 h-6 text-purple-500" /> Barcode Scanner</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
        </div>

        {/* Scan Input */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Scan Barcode</label>
          <div className="relative">
            <Scan className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500" />
            <input type="text" value={barcode} onChange={handleScan}
              className="w-full pl-12 pr-4 py-4 rounded-xl border text-lg font-mono" placeholder="Scan or type barcode..." autoFocus />
          </div>
        </div>

        {/* Scanned Product */}
        {scannedProduct && (
          <div className="bg-green-50 dark:bg-green-950 rounded-2xl border border-green-200 p-6 mb-6">
            <p className="font-bold text-green-700 dark:text-green-400 mb-2">✓ Product Found!</p>
            <p className="text-lg font-bold">{scannedProduct.name}</p>
            <p className="text-sm">SKU: {scannedProduct.sku}</p>
            <p className="text-sm">Stock: {scannedProduct.stock_level || 0}</p>
          </div>
        )}

        {/* Scan History */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
          <p className="font-bold p-4 border-b">Scan History ({scanHistory.length})</p>
          {scanHistory.map((s, i) => (
            <div key={i} className="flex justify-between p-3 border-b">
              <span className="font-medium">{s.name}</span>
              <span className="text-xs text-muted-foreground">{s.scannedAt}</span>
            </div>
          ))}
          {scanHistory.length === 0 && <p className="text-center py-8 text-muted-foreground">No scans yet</p>}
        </div>
      </main>
    </div>
  )
}