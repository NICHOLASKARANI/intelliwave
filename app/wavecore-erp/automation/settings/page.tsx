'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Settings, Save, Bell, Shield, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AutomationSettingsPage() {
  const [notifications, setNotifications] = useState(true)
  const [autoRetry, setAutoRetry] = useState(true)
  const [maxRetries, setMaxRetries] = useState('3')

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

        <div className="space-y-4 bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <div className="flex justify-between items-center">
            <div><p className="font-medium">Enable Notifications</p><p className="text-xs text-muted-foreground">Get notified on workflow execution</p></div>
            <button onClick={() => setNotifications(!notifications)} className={`w-12 h-6 rounded-full ${notifications ? 'bg-green-500' : 'bg-neutral-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full transition-all ${notifications ? 'ml-6' : 'ml-1'}`} />
            </button>
          </div>
          <div className="flex justify-between items-center">
            <div><p className="font-medium">Auto Retry</p><p className="text-xs text-muted-foreground">Retry failed workflows</p></div>
            <button onClick={() => setAutoRetry(!autoRetry)} className={`w-12 h-6 rounded-full ${autoRetry ? 'bg-green-500' : 'bg-neutral-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full transition-all ${autoRetry ? 'ml-6' : 'ml-1'}`} />
            </button>
          </div>
          <div>
            <p className="font-medium mb-2">Max Retries</p>
            <input type="number" value={maxRetries} onChange={(e) => setMaxRetries(e.target.value)} className="w-24 px-3 py-2 rounded-xl border" />
          </div>
          <Button className="gap-2 bg-teal-600"><Save className="w-4 h-4" /> Save Settings</Button>
        </div>
      </main>
    </div>
  )
}