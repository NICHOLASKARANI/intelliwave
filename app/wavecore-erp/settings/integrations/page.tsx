'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Webhook, Plus, Trash2, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Integration {
  id: number
  name: string
  type: string
  apikey: string
  status: string
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({ name: '', type: '', apikey: '', status: 'Disconnected' })

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      const res = await fetch('/api/wavecore/integrations')
      const data = await res.json()
      setIntegrations(data.integrations || [])
    } catch (err) {
      setError('Failed to load integrations')
    } finally {
      setLoading(false)
    }
  }

  const addIntegration = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/wavecore/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setFormData({ name: '', type: '', apikey: '', status: 'Disconnected' })
        setShowForm(false)
        fetchIntegrations()
      }
    } catch (err) {
      setError('Failed to save integration')
    } finally {
      setSaving(false)
    }
  }

  const deleteIntegration = async (id: number) => {
    if (!confirm('Delete this integration?')) return
    try {
      await fetch(`/api/wavecore/integrations?id=${id}`, { method: 'DELETE' })
      fetchIntegrations()
    } catch (err) {
      setError('Failed to delete integration')
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
          <span className="text-sm">Integrations</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Webhook className="w-6 h-6 text-indigo-500" /> Integrations ({integrations.length})
          </h1>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> Add Integration
          </Button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}

        {showForm && (
          <form onSubmit={addIntegration} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <div className="space-y-4">
              <input type="text" placeholder="Integration Name" required value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border" />
              <select value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border">
                <option value="">Select Type...</option>
                <option value="PAYMENT">Payment Gateway</option>
                <option value="SMS">SMS Gateway</option>
                <option value="EMAIL">Email Service</option>
                <option value="ERP">ERP Integration</option>
                <option value="API">Custom API</option>
              </select>
              <input type="text" placeholder="API Key" value={formData.apikey}
                onChange={(e) => setFormData({...formData, apikey: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border" />
              <Button type="submit" disabled={saving} className="bg-indigo-600">
                {saving ? 'Saving...' : 'Save Integration'}
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : integrations.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Webhook className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No integrations configured</p>
          </div>
        ) : (
          <div className="space-y-3">
            {integrations.map(integration => (
              <div key={integration.id} className="bg-white dark:bg-neutral-900 rounded-2xl border p-5 flex justify-between items-center">
                <div>
                  <p className="font-bold">{integration.name}</p>
                  <p className="text-sm text-muted-foreground">{integration.type}</p>
                  {integration.apikey && <p className="text-xs text-muted-foreground mt-1">Key: {integration.apikey.substring(0, 8)}...</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 text-xs ${integration.status === 'Connected' ? 'text-green-600' : 'text-red-600'}`}>
                    {integration.status === 'Connected' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {integration.status}
                  </span>
                  <button onClick={() => deleteIntegration(integration.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}