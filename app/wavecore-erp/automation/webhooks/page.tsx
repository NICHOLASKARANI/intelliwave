'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Webhook, Plus, Trash2, Edit3, Loader2, RefreshCw } from 'lucide-react'
import { authedFetch } from '@/lib/wavecore/csrf-client'

interface WebhookItem {
  id: string
  name: string
  url: string
  isActive: boolean
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [editing, setEditing] = useState<WebhookItem | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchWebhooks = async () => {
    setLoading(true)
    try {
      const res = await authedFetch('/api/wavecore/webhooks')
      if (res.ok) {
        const data = await res.json()
        setWebhooks(data.webhooks || [])
      }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => {
    fetchWebhooks()
  }, [])

  const addWebhook = async () => {
    if (!name || !url || saving) return
    setSaving(true)
    try {
      const res = await authedFetch('/api/wavecore/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url }),
      })
      if (res.ok) {
        setName('')
        setUrl('')
        await fetchWebhooks()
      }
    } catch {} finally { setSaving(false) }
  }

  const deleteWebhook = async (id: string) => {
    if (!confirm('Delete this webhook?')) return
    try {
      await authedFetch('/api/wavecore/webhooks?id=' + id, { method: 'DELETE' })
      fetchWebhooks()
    } catch {}
  }

  const toggleActive = async (w: WebhookItem) => {
    try {
      const res = await authedFetch('/api/wavecore/webhooks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...w, isActive: !w.isActive }),
      })
      if (res.ok) fetchWebhooks()
    } catch {}
  }

  const saveEdit = async () => {
    if (!editing) return
    try {
      const res = await authedFetch('/api/wavecore/webhooks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      })
      if (res.ok) {
        setEditing(null)
        fetchWebhooks()
      }
    } catch {}
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/automation" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm">Webhooks</span>
            <button onClick={fetchWebhooks} className="p-2 rounded-lg border hover:bg-neutral-100">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Webhook className="w-6 h-6 text-purple-500" /> Webhooks</h1>

        <div className="flex gap-2 mb-6">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl border" placeholder="Webhook name" />
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl border" placeholder="https://..." />
          <button onClick={addWebhook} disabled={saving || !name || !url} className="px-4 py-2.5 rounded-xl bg-purple-600 text-white disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>

        {loading ? <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div> : webhooks.length === 0 ? (
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
                  <button onClick={() => toggleActive(w)} className={"px-3 py-1 rounded-full text-xs font-bold " + (w.isActive ? 'bg-green-100 text-green-600' : 'bg-neutral-100 text-neutral-500')}>
                    {w.isActive ? 'ACTIVE' : 'OFF'}
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