'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Barcode, Search, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function BarcodePage() {
  const [barcodeValue, setBarcodeValue] = useState('')
  const [result, setResult] = useState<any>(null)

  const searchBarcode = async () => {
    if (!barcodeValue) return
    try {
      const res = await fetch(`/api/wavecore/inventory/products?barcode=${barcodeValue}`)
      if (res.ok) {
        const data = await res.json()
        setResult(data.products?.[0] || null)
      }
    } catch {}
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
      <main className="max-w-lg mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Barcode className="w-6 h-6 text-indigo-500" /> Barcode Scanner</h1>
        <div className="flex gap-3 mb-4">
          <input type="text" value={barcodeValue} onChange={(e) => setBarcodeValue(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border text-lg" placeholder="Scan or type barcode..." autoFocus />
          <Button onClick={searchBarcode}><Search className="w-4 h-4" /></Button>
        </div>
        {result ? (
          <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
            <Package className="w-8 h-8 text-indigo-500 mb-3" />
            <p className="font-bold text-lg">{result.name}</p>
            <p className="text-sm text-muted-foreground">SKU: {result.sku}</p>
            <p className="text-sm text-muted-foreground">Stock: {result.total_stock}</p>
            <p className="text-green-600 font-bold mt-2">KSh {result.sellingPrice}</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <Barcode className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">Scan a barcode to find product</p>
          </div>
        )}
      </main>
    </div>
  )
}