'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Monitor, Loader2, ArrowLeft } from 'lucide-react'

type Terminal = { id: string; name: string; location?: string; isActive: boolean; createdAt: string }

export default function TerminalsPage() {
  const [orgId, setOrgId] = useState('')
  const [terminals, setTerminals] = useState<Terminal[]>([])
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const cookies = document.cookie.split(';').reduce((acc: any, c) => {
      const [k, v] = c.trim().split('=')
      acc[k] = decodeURIComponent(v || '')
      return acc
    }, {})
    const o = cookies['wavecore_organizationId'] || cookies['organizationId'] || ''
    setOrgId(o)
    if (o) loadTerminals(o)
  }, [])

  const loadTerminals = (org: string) => {
    fetch('/api/wavecore/pos/terminals?organizationId=' + org)
      .then(r => r.json())
      .then(d => { if (d.terminals) setTerminals(d.terminals) })
      .catch(() => {})
  }

  const createTerminal = async () => {
    if (!name.trim() || !orgId) return
    setLoading(true)
    setMsg('')
    try {
      const res = await fetch('/api/wavecore/pos/terminals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId, name: name.trim(), location: location.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setName('')
        setLocation('')
        setMsg('Terminal created')
        loadTerminals(orgId)
      } else {
        setMsg(data.error || 'Failed to create')
      }
    } catch (e: any) {
      setMsg(e.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/wavecore-erp/pos" className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to POS
          </Link>
          <h1 className="text-3xl font-bold">POS Terminals</h1>
          <p className="text-slate-400">Manage your register machines</p>
        </div>

        {msg && (
          <div className="mb-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm">{msg}</div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Add New Terminal</h2>
          <div className="grid md:grid-cols-2 gap-3 mb-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Terminal name (e.g., Front Counter)" className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white" />
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location (e.g., Shop 1)" className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white" />
          </div>
          <button onClick={createTerminal} disabled={!name.trim() || loading} className="px-6 py-3 bg-blue-500 hover:bg-blue-400 rounded-xl font-bold disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            Add Terminal
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h2 className="text-lg font-bold mb-4">Your Terminals ({terminals.length})</h2>
          {terminals.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No terminals yet. Create one above to start selling.</p>
          ) : (
            <div className="space-y-2">
              {terminals.map(t => (
                <div key={t.id} className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl">
                  <Monitor className="w-8 h-8 text-blue-400" />
                  <div className="flex-1">
                    <p className="font-bold">{t.name}</p>
                    {t.location && <p className="text-sm text-slate-400">{t.location}</p>}
                  </div>
                  <span className={'text-xs px-2 py-1 rounded-full ' + (t.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300')}>
                    {t.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}