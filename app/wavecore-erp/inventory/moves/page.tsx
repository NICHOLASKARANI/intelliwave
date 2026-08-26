'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeftRight, Loader2, Search, ArrowUp, ArrowDown } from 'lucide-react'

interface StockMove {
  id: string
  productName: string
  type: string
  quantity: number
  createdAt: string
}

export default function StockMovesPage() {
  const [moves, setMoves] = useState<StockMove[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchMoves()
  }, [])

  const fetchMoves = async () => {
    try {
      const res = await fetch('/api/wavecore/inventory/movements')
      const data = await res.json()
      setMoves(data.movements || [])
    } catch (error) {
      console.error('Failed to fetch movements')
    } finally {
      setLoading(false)
    }
  }

  const filtered = moves.filter(m => 
    (m.productName || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/inventory" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Stock Movements</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <ArrowLeftRight className="w-6 h-6 text-orange-500" /> Stock Movements ({moves.length})
        </h1>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search movements..." />
        </div>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <ArrowLeftRight className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No stock movements</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(move => (
              <div key={move.id} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {move.type === 'IN' ? (
                    <ArrowUp className="w-5 h-5 text-green-500" />
                  ) : (
                    <ArrowDown className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-bold">{move.productName}</p>
                    <p className="text-sm text-muted-foreground">{new Date(move.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <span className={`font-bold ${move.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                  {move.type === 'IN' ? '+' : '-'}{move.quantity}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}