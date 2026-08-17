'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Coins, Plus, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CurrencyPage() {
  const [currencies, setCurrencies] = useState([
    { code: 'KES', name: 'Kenyan Shilling', rate: '1.00', default: true },
    { code: 'USD', name: 'US Dollar', rate: '0.0072', default: false },
    { code: 'EUR', name: 'Euro', rate: '0.0065', default: false },
  ])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/settings" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Currency</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Coins className="w-6 h-6 text-amber-500" /> Currency Settings</h1>

        <div className="space-y-3">
          {currencies.map(c => (
            <div key={c.code} className="p-4 rounded-xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Coins className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="font-medium">{c.code} - {c.name}</p>
                  <p className="text-xs text-muted-foreground">Rate: {c.rate}</p>
                </div>
              </div>
              {c.default && <CheckCircle className="w-5 h-5 text-green-500" />}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}