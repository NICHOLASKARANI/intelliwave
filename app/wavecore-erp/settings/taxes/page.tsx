'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Percent, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TaxSettingsPage() {
  const [taxes, setTaxes] = useState([
    { id: '1', name: 'VAT Standard', rate: '16%', type: 'VAT', active: true },
    { id: '2', name: 'VAT Reduced', rate: '8%', type: 'VAT', active: true },
    { id: '3', name: 'Zero Rated', rate: '0%', type: 'VAT', active: true },
    { id: '4', name: 'Withholding Tax', rate: '5%', type: 'WHT', active: true },
  ])
  const [showAdd, setShowAdd] = useState(false)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/settings" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Tax Settings</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Percent className="w-6 h-6 text-orange-500" /> Tax Settings</h1>
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-orange-600"><Plus className="w-4 h-4" /> Add Tax Rate</Button>
        </div>

        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-6 grid grid-cols-3 gap-3">
            <input type="text" className="px-4 py-2.5 rounded-xl border" placeholder="Tax Name" />
            <input type="text" className="px-4 py-2.5 rounded-xl border" placeholder="Rate (%)" />
            <select className="px-4 py-2.5 rounded-xl border"><option>VAT</option><option>WHT</option><option>Custom</option></select>
          </div>
        )}

        <div className="space-y-3">
          {taxes.map(tax => (
            <div key={tax.id} className="p-4 rounded-xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
              <div>
                <p className="font-medium">{tax.name}</p>
                <p className="text-xs text-muted-foreground">{tax.type}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-orange-600">{tax.rate}</span>
                <button className="text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}