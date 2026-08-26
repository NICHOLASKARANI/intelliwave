'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Barcode, Loader2, Search } from 'lucide-react'

interface SerialNumber {
  id: string
  serialNumber: string
  productName: string
  status: string
}

export default function SerialNumbersPage() {
  const [serials, setSerials] = useState<SerialNumber[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchSerials()
  }, [])

  const fetchSerials = async () => {
    try {
      const res = await fetch('/api/wavecore/inventory/products')
      const data = await res.json()
      setSerials(data.serials || [])
    } catch (error) {
      console.error('Failed to fetch serial numbers')
    } finally {
      setLoading(false)
    }
  }

  const filtered = serials.filter(s => 
    (s.serialNumber || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.productName || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/inventory" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Serial Numbers</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Barcode className="w-6 h-6 text-orange-500" /> Serial Numbers ({serials.length})
        </h1>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search serial numbers..." />
        </div>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Barcode className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No serial numbers</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(serial => (
              <div key={serial.id} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
                <div>
                  <p className="font-mono font-bold">{serial.serialNumber}</p>
                  <p className="text-sm text-muted-foreground">{serial.productName}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${serial.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {serial.status || 'ACTIVE'}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}