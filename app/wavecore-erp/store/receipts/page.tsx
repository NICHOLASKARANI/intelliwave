'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Receipt, Printer, Loader2, Search, Package } from 'lucide-react'

interface SaleRow {
  id: string
  number: string
  total: number
  createdAt: string
  status?: string
  customerName?: string
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<SaleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  const fetchReceipts = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true); else setRefreshing(true)
    try {
      const res = await fetch('/api/wavecore/store/sales', { cache: 'no-store' })
      const data = await res.json()
      setReceipts(data.sales || [])
    } catch (e) {
      setError('Failed to load receipts')
    } finally {
      if (!opts?.silent) setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchReceipts() /* eslint-disable-next-line */ }, [])
  useEffect(() => {
    const t = setInterval(() => { fetchReceipts({ silent: true }) }, 30000)
    return () => clearInterval(t)
  }, [])

  const printReceipt = (saleId: string) => {
    window.open(`/api/wavecore/store/sales/${saleId}/pdf`, '_blank')
  }

  const filtered = receipts.filter(r =>
    (r.number || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.customerName || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Receipts</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="w-6 h-6 text-pink-500" /> Receipts ({receipts.length})
          </h1>
          <Link href="/wavecore-erp/store/sales/create" className="px-4 py-2 rounded-xl bg-pink-600 text-white font-bold text-sm">
            New Sale
          </Link>
        </div>

        <p className="text-xs text-muted-foreground mb-6">
          Every POS sale is a receipt. Click print to open the printable version.
        </p>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search by sale number or customer..." />
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No receipts yet</p>
            <p className="text-sm text-muted-foreground mt-1">Record a sale from the store to see receipts here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(receipt => (
              <div key={receipt.id} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
                <div>
                  <p className="font-mono font-bold">{receipt.number}</p>
                  <p className="text-green-600 font-medium">KSh {Number(receipt.total || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    {receipt.customerName ? receipt.customerName + ' · ' : ''}
                    {new Date(receipt.createdAt).toLocaleString('en-KE')}
                  </p>
                </div>
                <button onClick={() => printReceipt(receipt.id)} title="Print receipt"
                  className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                  <Printer className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}