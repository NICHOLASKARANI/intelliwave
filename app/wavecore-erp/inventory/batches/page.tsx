'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Layers, Search, Plus, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function BatchesPage() {
  const [batches, setBatches] = useState<any[]>([])
  const [search, setSearch] = useState('')

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/inventory" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Batches</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Layers className="w-6 h-6 text-teal-500" /> Batches</h1>
          <Button className="gap-2 bg-teal-600"><Plus className="w-4 h-4" /> Add Batch</Button>
        </div>
        <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
          <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No batches yet</p>
          <p className="text-sm text-muted-foreground mt-1">Track products by batch/lot numbers</p>
        </div>
      </main>
    </div>
  )
}