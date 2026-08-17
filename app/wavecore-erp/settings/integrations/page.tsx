'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Webhook, Plus, CheckCircle, Key, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function IntegrationsPage() {
  const [integrations] = useState([
    { name: 'MPesa API', status: 'Connected', icon: '💰' },
    { name: 'Email Service', status: 'Connected', icon: '📧' },
    { name: 'SMS Gateway', status: 'Not Connected', icon: '📱' },
    { name: 'Cloud Storage', status: 'Connected', icon: '☁️' },
  ])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/settings" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Integrations</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Webhook className="w-6 h-6 text-indigo-500" /> Integrations</h1>

        <div className="grid md:grid-cols-2 gap-4">
          {integrations.map(i => (
            <div key={i.name} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold">{i.name}</p>
                {i.status === 'Connected' ? <CheckCircle className="w-5 h-5 text-green-500" /> : <RefreshCw className="w-5 h-5 text-muted-foreground" />}
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${i.status === 'Connected' ? 'bg-green-50 text-green-600' : 'bg-neutral-100 text-muted-foreground'}`}>
                {i.status}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}