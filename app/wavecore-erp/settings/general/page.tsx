'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Settings, Save, Building2, Globe, Phone, Mail, MapPin, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GeneralSettingsPage() {
  const [saved, setSaved] = useState(false)
  const [company, setCompany] = useState({
    name: 'WaveCore ERP',
    email: 'admin@wavecore.com',
    phone: '+254 700 000000',
    address: 'Nairobi, Kenya',
    website: 'https://wavecore.com',
    timezone: 'Africa/Nairobi',
    language: 'English',
    currency: 'KES',
    dateFormat: 'DD/MM/YYYY',
  })

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/settings" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">General Settings</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Settings className="w-6 h-6 text-blue-500" /> General Settings</h1>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 space-y-6">
          <div>
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-500" /> Company Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Company Name</label>
                <input type="text" value={company.name} onChange={(e) => setCompany({...company, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                <input type="email" value={company.email} onChange={(e) => setCompany({...company, email: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
                <input type="text" value={company.phone} onChange={(e) => setCompany({...company, phone: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Website</label>
                <input type="text" value={company.website} onChange={(e) => setCompany({...company, website: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Address</label>
                <input type="text" value={company.address} onChange={(e) => setCompany({...company, address: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border" />
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-green-500" /> Regional Settings</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Timezone</label>
                <select value={company.timezone} onChange={(e) => setCompany({...company, timezone: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border">
                  <option>Africa/Nairobi</option>
                  <option>Africa/Lagos</option>
                  <option>Africa/Johannesburg</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Language</label>
                <select value={company.language} onChange={(e) => setCompany({...company, language: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border">
                  <option>English</option>
                  <option>Swahili</option>
                  <option>French</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Currency</label>
                <select value={company.currency} onChange={(e) => setCompany({...company, currency: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border">
                  <option>KES - Kenyan Shilling</option>
                  <option>USD - US Dollar</option>
                  <option>EUR - Euro</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Date Format</label>
                <select value={company.dateFormat} onChange={(e) => setCompany({...company, dateFormat: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border">
                  <option>DD/MM/YYYY</option>
                  <option>MM/DD/YYYY</option>
                  <option>YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </div>

          <Button onClick={handleSave} className="gap-2 bg-blue-600 w-full">
            {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Settings</>}
          </Button>
        </div>
      </main>
    </div>
  )
}