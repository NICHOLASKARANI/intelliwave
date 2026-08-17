'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Truck, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function MovementsPage() {
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/inventory/movements').then(r => r.json()).then(d => setMovements(d.movements || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleExport = () => {
    const csv = 'Product,Type,Quantity,Date\n' + movements.map(m => `${m.product_name},${m.type},${m.quantity},${new Date(m.createdAt).toLocaleString()}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'movements.csv'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/inventory" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Stock Movements</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold">Stock Movements</h1>
          {movements.length > 0 && <Button variant="outline" onClick={handleExport}><Download className="w-4 h-4 mr-1" /> Export</Button>}
        </div>
        {loading ? <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" /></div> :
          movements.length > 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-neutral-50 dark:bg-neutral-800"><th className="text-left p-4">Product</th><th className="text-left p-4">Type</th><th className="text-right p-4">Quantity</th><th className="text-left p-4">Date</th></tr></thead>
                <tbody>{movements.map(m => (
                  <tr key={m.id} className="border-b">
                    <td className="p-4 font-medium">{m.product_name}</td>
                    <td className="p-4"><span className={`px-2 py-1 text-xs rounded-full ${m.type === 'RECEIPT' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{m.type}</span></td>
                    <td className={`p-4 text-right font-bold ${m.type === 'RECEIPT' ? 'text-green-600' : 'text-red-600'}`}>{m.type === 'RECEIPT' ? '+' : '-'}{m.quantity}</td>
                    <td className="p-4 text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border"><Truck className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No movements yet</p></div>
        }
      </main>
    </div>
  )
}