'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Settings, Save, Bell, Shield, CheckCircle } from 'lucide-react'

export default function AutomationSettingsPage() {
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState({
    notifications: true,
    autoRetry: true,
    maxRetries: '3',
    emailNotifications: true,
    webhookTimeout: '30',
  })

  useEffect(() => {
    const savedSettings = localStorage.getItem('automation-settings')
    if (savedSettings) setSettings(JSON.parse(savedSettings))
  }, [])

  const handleSave = () => {
    localStorage.setItem('automation-settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/automation" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Automation Settings</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Settings className="w-6 h-6 text-teal-500" /> Automation Settings</h1>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium flex items-center gap-2"><Bell className="w-4 h-4 text-blue-500" /> Notifications</p>
              <p className="text-xs text-muted-foreground">Receive alerts on workflow execution</p>
            </div>
            <button onClick={() => setSettings({...settings, notifications: !settings.notifications})}
              className={`w-12 h-6 rounded-full ${settings.notifications ? 'bg-green-500' : 'bg-neutral-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full transition-all ${settings.notifications ? 'ml-6' : 'ml-1'}`} />
            </button>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium flex items-center gap-2"><Shield className="w-4 h-4 text-green-500" /> Auto Retry</p>
              <p className="text-xs text-muted-foreground">Retry failed workflows</p>
            </div>
            <button onClick={() => setSettings({...settings, autoRetry: !settings.autoRetry})}
              className={`w-12 h-6 rounded-full ${settings.autoRetry ? 'bg-green-500' : 'bg-neutral-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full transition-all ${settings.autoRetry ? 'ml-6' : 'ml-1'}`} />
            </button>
          </div>

          <div>
            <p className="font-medium mb-2">Max Retries</p>
            <input type="number" value={settings.maxRetries} onChange={(e) => setSettings({...settings, maxRetries: e.target.value})}
              className="w-24 px-3 py-2 rounded-xl border" />
          </div>

          <div>
            <p className="font-medium mb-2">Webhook Timeout (seconds)</p>
            <input type="number" value={settings.webhookTimeout} onChange={(e) => setSettings({...settings, webhookTimeout: e.target.value})}
              className="w-24 px-3 py-2 rounded-xl border" />
          </div>

          <button onClick={handleSave}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${saved ? 'bg-green-600 text-white' : 'bg-teal-600 text-white'}`}>
            {saved ? <><CheckCircle className="w-5 h-5" /> Saved!</> : <><Save className="w-5 h-5" /> Save Settings</>}
          </button>
        </div>
      </main>
    </div>
  )
}