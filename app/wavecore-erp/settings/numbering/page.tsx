'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Hash, Save, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NumberingPage() {
  const [prefixes, setPrefixes] = useState({
    invoice: 'INV',
    quote: 'QTE',
    purchaseOrder: 'PO',
    receipt: 'RCT',
    journal: 'JRN',
  })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/settings" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Numbering</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Hash className="w-6 h-6 text-teal-500" /> Document Numbering</h1>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 space-y-4">
          {Object.entries(prefixes).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              <input type="text" value={value} onChange={(e) => setPrefixes({...prefixes, [key]: e.target.value})} className="w-32 px-3 py-2 rounded-xl border text-center font-mono" />
            </div>
          ))}
          <Button onClick={handleSave} className="gap-2 bg-teal-600 w-full">
            {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Numbering</>}
          </Button>
        </div>
      </main>
    </div>
  )
}