'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Webhook, Plus, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [search, setSearch] = useState('')

  const handleAdd = () => {
    if (!name || !url) return
    setWebhooks([{ id: Date.now().toString(), name, url, active: true }, ...webhooks])
    setShowAdd(false); setName(''); setUrl('')
  }

  const filtered = webhooks.filter(w => w.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/automation" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Webhooks</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Webhook className="w-6 h-6 text-purple-500" /> Webhooks</h1>
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-purple-600"><Plus className="w-4 h-4" /> Add Webhook</Button>
        </div>

        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-6">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Name *" />
              <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="https://..." />
            </div>
            <Button onClick={handleAdd} className="mt-3">Add</Button>
          </div>
        )}

        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(w => (
              <div key={w.id} className="p-4 rounded-xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
                <div><p className="font-medium">{w.name}</p><p className="text-xs text-muted-foreground">{w.url}</p></div>
                <span className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded-full">Active</span>
              </div>
            ))}
          </div>
        ) : <p className="text-center py-12 text-muted-foreground">No webhooks yet</p>}
      </main>
    </div>
  )
}