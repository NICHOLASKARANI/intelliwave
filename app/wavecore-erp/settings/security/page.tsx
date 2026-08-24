'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Shield, Save, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SecurityPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [settings, setSettings] = useState({
    twoFactorAuth: false,
    passwordExpiry: '90',
    minPasswordLength: '8',
    sessionTimeout: '30',
    lockAfterAttempts: '5'
  })

  useEffect(() => {
    fetchSecuritySettings()
  }, [])

  const fetchSecuritySettings = async () => {
    try {
      const res = await fetch('/api/wavecore/settings')
      const data = await res.json()
      if (data.settings) {
        setSettings({
          twoFactorAuth: data.settings.twoFactorAuth || false,
          passwordExpiry: data.settings.passwordExpiry || '90',
          minPasswordLength: data.settings.minPasswordLength || '8',
          sessionTimeout: data.settings.sessionTimeout || '30',
          lockAfterAttempts: data.settings.lockAfterAttempts || '5'
        })
      }
    } catch (err) {
      setError('Failed to load security settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      setError('Failed to save security settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/settings" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Security Settings</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Shield className="w-6 h-6 text-red-500" /> Security Settings
        </h1>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}
        {saved && <div className="mb-4 p-3 rounded-xl bg-green-50 text-green-600 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Saved!</div>}

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Require 2FA for all users</p>
              </div>
              <button onClick={() => setSettings({...settings, twoFactorAuth: !settings.twoFactorAuth})}
                className={`w-12 h-6 rounded-full ${settings.twoFactorAuth ? 'bg-green-500' : 'bg-neutral-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-all ${settings.twoFactorAuth ? 'ml-6' : 'ml-1'}`} />
              </button>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Password Expiry (days)</label>
              <input type="number" value={settings.passwordExpiry}
                onChange={(e) => setSettings({...settings, passwordExpiry: e.target.value})}
                className="w-32 px-4 py-2 rounded-xl border" />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Minimum Password Length</label>
              <input type="number" value={settings.minPasswordLength}
                onChange={(e) => setSettings({...settings, minPasswordLength: e.target.value})}
                className="w-32 px-4 py-2 rounded-xl border" />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Session Timeout (minutes)</label>
              <input type="number" value={settings.sessionTimeout}
                onChange={(e) => setSettings({...settings, sessionTimeout: e.target.value})}
                className="w-32 px-4 py-2 rounded-xl border" />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Lock After Failed Attempts</label>
              <input type="number" value={settings.lockAfterAttempts}
                onChange={(e) => setSettings({...settings, lockAfterAttempts: e.target.value})}
                className="w-32 px-4 py-2 rounded-xl border" />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full bg-red-600 hover:bg-red-700">
              {saving ? 'Saving...' : 'Save Security Settings'}
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}