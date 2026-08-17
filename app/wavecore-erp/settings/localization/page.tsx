'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Languages, Save, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LocalizationPage() {
  const [localization, setLocalization] = useState({
    language: 'English',
    timezone: 'Africa/Nairobi',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '1,234.56',
    currencySymbol: 'KSh',
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
          <span className="text-sm">Localization</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Languages className="w-6 h-6 text-cyan-500" /> Localization</h1>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm">Language</span>
            <select value={localization.language} onChange={(e) => setLocalization({...localization, language: e.target.value})} className="w-40 px-3 py-2 rounded-xl border">
              <option>English</option><option>Swahili</option><option>French</option>
            </select>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Timezone</span>
            <select value={localization.timezone} onChange={(e) => setLocalization({...localization, timezone: e.target.value})} className="w-40 px-3 py-2 rounded-xl border">
              <option>Africa/Nairobi</option><option>Africa/Lagos</option><option>Africa/Johannesburg</option>
            </select>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Date Format</span>
            <select value={localization.dateFormat} onChange={(e) => setLocalization({...localization, dateFormat: e.target.value})} className="w-40 px-3 py-2 rounded-xl border">
              <option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option>
            </select>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Currency Symbol</span>
            <input type="text" value={localization.currencySymbol} onChange={(e) => setLocalization({...localization, currencySymbol: e.target.value})} className="w-40 px-3 py-2 rounded-xl border" />
          </div>
          <Button onClick={handleSave} className="gap-2 bg-cyan-600 w-full">
            {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Localization</>}
          </Button>
        </div>
      </main>
    </div>
  )
}