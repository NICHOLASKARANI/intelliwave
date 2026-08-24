'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Settings, Save, Building2, Globe, Phone, Mail, MapPin, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GeneralSettingsPage() {
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [company, setCompany] = useState({
    companyname: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    timezone: 'Africa/Nairobi',
    language: 'English',
    currency: 'KES',
    dateformat: 'DD/MM/YYYY',
    currencysymbol: 'KSh',
    numberformat: '1,234.56',
  })

  // Load existing settings from DB
  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/wavecore/settings')
      const data = await res.json()
      if (data.settings) {
        setCompany(data.settings)
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
      setError('Failed to load settings from database')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setError('')
    setSaved(false)
    
    try {
      const res = await fetch('/api/wavecore/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(company)
      })
      
      const data = await res.json()
      
      if (data.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(data.error || 'Failed to save settings')
      }
    } catch (err) {
      console.error('Save error:', err)
      setError('Network error - failed to save settings')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
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

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 lg:p-8 mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Settings className="w-8 h-8" /> General Settings
          </h1>
          <p className="text-white/80 text-sm">Company information & preferences</p>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 space-y-6">
          {/* Company Information */}
          <div>
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" /> Company Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">Company Name</label>
                <input
                  type="text"
                  value={company.companyname || ''}
                  onChange={(e) => setCompany({ ...company, companyname: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <input
                  type="email"
                  value={company.email || ''}
                  onChange={(e) => setCompany({ ...company, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500"
                  placeholder="company@email.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Phone</label>
                <input
                  type="text"
                  value={company.phone || ''}
                  onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500"
                  placeholder="+254 700 000000"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">Address</label>
                <input
                  type="text"
                  value={company.address || ''}
                  onChange={(e) => setCompany({ ...company, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500"
                  placeholder="Street, City, Country"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">Website</label>
                <input
                  type="url"
                  value={company.website || ''}
                  onChange={(e) => setCompany({ ...company, website: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500"
                  placeholder="https://company.com"
                />
              </div>
            </div>
          </div>

          {/* Localization */}
          <div>
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-green-500" /> Localization
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Timezone</label>
                <select
                  value={company.timezone || 'Africa/Nairobi'}
                  onChange={(e) => setCompany({ ...company, timezone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                  <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                  <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Language</label>
                <select
                  value={company.language || 'English'}
                  onChange={(e) => setCompany({ ...company, language: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500"
                >
                  <option value="English">English</option>
                  <option value="Swahili">Swahili</option>
                  <option value="French">French</option>
                  <option value="Arabic">Arabic</option>
                  <option value="Portuguese">Portuguese</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Currency</label>
                <select
                  value={company.currency || 'KES'}
                  onChange={(e) => setCompany({ ...company, currency: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500"
                >
                  <option value="KES">Kenyan Shilling (KES)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="GBP">British Pound (GBP)</option>
                  <option value="ZAR">South African Rand (ZAR)</option>
                  <option value="NGN">Nigerian Naira (NGN)</option>
                  <option value="AED">UAE Dirham (AED)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Date Format</label>
                <select
                  value={company.dateformat || 'DD/MM/YYYY'}
                  onChange={(e) => setCompany({ ...company, dateformat: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Currency Symbol</label>
                <input
                  type="text"
                  value={company.currencysymbol || ''}
                  onChange={(e) => setCompany({ ...company, currencysymbol: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500"
                  placeholder="KSh"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Number Format</label>
                <input
                  type="text"
                  value={company.numberformat || ''}
                  onChange={(e) => setCompany({ ...company, numberformat: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500"
                  placeholder="1,234.56"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            className="gap-2 bg-blue-600 w-full py-3 text-lg hover:bg-blue-700"
            disabled={saved}
          >
            {saved ? (
              <><CheckCircle className="w-5 h-5" /> Saved Successfully!</>
            ) : (
              <><Save className="w-5 h-5" /> Save Settings</>
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}