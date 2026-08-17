'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Mail, Save, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState([
    { name: 'Welcome Email', subject: 'Welcome to WaveCore!', active: true },
    { name: 'Invoice Notification', subject: 'New Invoice Generated', active: true },
    { name: 'Payment Received', subject: 'Payment Confirmation', active: true },
    { name: 'Low Stock Alert', subject: 'Stock Level Warning', active: false },
  ])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/settings" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Email Templates</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Mail className="w-6 h-6 text-pink-500" /> Email Templates</h1>

        <div className="space-y-3">
          {templates.map(t => (
            <div key={t.name} className="p-4 rounded-xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.subject}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${t.active ? 'bg-green-50 text-green-600' : 'bg-neutral-100 text-muted-foreground'}`}>
                {t.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}