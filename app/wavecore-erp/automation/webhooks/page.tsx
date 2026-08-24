'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Webhook, Plus, Trash2, Edit3, Loader2 } from 'lucide-react'

interface WebhookItem {
  id: string
  name: string
  url: string
  active: boolean
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [editing, setEditing] = useState<WebhookItem | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('webhooks')
    if (saved) setWebhooks(JSON.parse(saved))
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!loading) localStorage.setItem('webhooks', JSON.stringify(webhooks))
  }, [webhooks, loading])

  const addWebhook = () => {
    if (!name || !url) return
    setWebhooks(prev => [...prev, { id: Date.now().toString(), name, url, active: true }])
    setName('')
    setUrl('')
  }

  const deleteWebhook = (id: string) => {
    setWebhooks(prev => prev.filter(w => w.id !== id))
  }

  const toggleActive = (id: string) => {
    setWebhooks(prev => prev.map(w => w.id === id ? { ...w, active: !w.active } : w))
  }

  const saveEdit = () => {
    if (!editing) return
    setWebhooks(prev => prev.map(w => w.id === editing.id ? editing : w))
    setEditing(null)
  }

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
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Webhook className="w-6 h-6 text-purple-500" /> Webhooks</h1>

        <div className="flex gap-2 mb-6">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl border" placeholder="Webhook name" />
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl border" placeholder="https://..." />
          <button onClick={addWebhook} className="px-4 py-2.5 rounded-xl bg-purple-600 text-white"><Plus className="w-4 h-4" /></button>
        </div>

        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : webhooks.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Webhook className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No webhooks yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {webhooks.map(w => (
              <div key={w.id} className="p-4 rounded-xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
                <div>
                  <p className="font-medium">{w.name}</p>
                  <p className="text-xs text-muted-foreground">{w.url}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleActive(w.id)} className={`px-3 py-1 rounded-full text-xs font-bold ${w.active ? 'bg-green-100 text-green-600' : 'bg-neutral-100 text-neutral-500'}`}>
                    {w.active ? 'ACTIVE' : 'OFF'}
                  </button>
                  <button onClick={() => setEditing(w)} className="p-2 text-blue-500"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => deleteWebhook(w.id)} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Edit Webhook</h2>
            <input type="text" value={editing.name} onChange={(e) => setEditing({...editing, name: e.target.value})}
              className="w-full px-4 py-2.5 rounded-xl border mb-3" />
            <input type="url" value={editing.url} onChange={(e) => setEditing({...editing, url: e.target.value})}
              className="w-full px-4 py-2.5 rounded-xl border mb-4" />
            <div className="flex gap-2">
              <button onClick={saveEdit} className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white font-medium">Save</button>
              <button onClick={() => setEditing(null)} className="flex-1 py-2.5 rounded-xl border">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}