'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, CheckCircle2, Loader2, Save } from 'lucide-react'

type SLA = {
  id: string
  priority: string
  firstResponseMinutes: number
  resolutionMinutes: number
  isActive: boolean
}

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

const DEFAULT_SLAS: Record<string, { first: number; resolution: number }> = {
  LOW: { first: 240, resolution: 4320 },      // 4h first, 3 days resolution
  MEDIUM: { first: 120, resolution: 2880 },   // 2h first, 2 days
  HIGH: { first: 60, resolution: 1440 },      // 1h first, 1 day
  URGENT: { first: 15, resolution: 240 },     // 15m first, 4 hours
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-slate-400',
  MEDIUM: 'text-blue-400',
  HIGH: 'text-orange-400',
  URGENT: 'text-red-400',
}

export default function SLAPage() {
  const [slas, setSlas] = useState<Record<string, SLA>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/api/wavecore/helpdesk/sla')
      .then(r => r.json())
      .then(d => {
        const map: Record<string, SLA> = {}
        ;(d.slas || []).forEach((s: SLA) => { map[s.priority] = s })
        setSlas(map)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const saveSLA = async (priority: string) => {
    setSaving(priority)
    setMsg('')
    const existing = slas[priority]
    const first = existing?.firstResponseMinutes ?? DEFAULT_SLAS[priority].first
    const res = existing?.resolutionMinutes ?? DEFAULT_SLAS[priority].resolution
    try {
      const r = await fetch('/api/wavecore/helpdesk/sla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priority,
          firstResponseMinutes: first,
          resolutionMinutes: res,
          isActive: existing?.isActive !== false,
        }),
      })
      if (r.ok) {
        setMsg(priority + ' SLA saved')
        setTimeout(() => setMsg(''), 2000)
      }
    } catch {}
    setSaving(null)
  }

  const updateField = (priority: string, field: 'firstResponseMinutes' | 'resolutionMinutes', value: number) => {
    setSlas(prev => ({
      ...prev,
      [priority]: {
        id: prev[priority]?.id || 'new-' + priority,
        priority,
        firstResponseMinutes: field === 'firstResponseMinutes' ? value : (prev[priority]?.firstResponseMinutes ?? DEFAULT_SLAS[priority].first),
        resolutionMinutes: field === 'resolutionMinutes' ? value : (prev[priority]?.resolutionMinutes ?? DEFAULT_SLAS[priority].resolution),
        isActive: prev[priority]?.isActive !== false,
      },
    }))
  }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-400 animate-spin" /></div>

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/wavecore-erp/helpdesk" className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Helpdesk
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-400" /> SLA Configuration
          </h1>
          <p className="text-slate-400">Response & resolution time targets per priority level</p>
        </div>

        {msg && (
          <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {msg}
          </div>
        )}

        <div className="space-y-4">
          {PRIORITIES.map(priority => {
            const sla = slas[priority]
            const first = sla?.firstResponseMinutes ?? DEFAULT_SLAS[priority].first
            const res = sla?.resolutionMinutes ?? DEFAULT_SLAS[priority].resolution

            return (
              <div key={priority} className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className={'text-xl font-bold ' + PRIORITY_COLORS[priority]}>{priority}</h2>
                  <button
                    onClick={() => saveSLA(priority)}
                    disabled={saving === priority}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving === priority ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">First Response (minutes)</label>
                    <input
                      type="number"
                      value={first}
                      onChange={e => updateField(priority, 'firstResponseMinutes', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                    />
                    <p className="text-xs text-slate-500 mt-1">Default: {DEFAULT_SLAS[priority].first} min ({Math.round(DEFAULT_SLAS[priority].first / 60 * 10) / 10}h)</p>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Resolution Time (minutes)</label>
                    <input
                      type="number"
                      value={res}
                      onChange={e => updateField(priority, 'resolutionMinutes', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                    />
                    <p className="text-xs text-slate-500 mt-1">Default: {DEFAULT_SLAS[priority].resolution} min ({Math.round(DEFAULT_SLAS[priority].resolution / 60 * 10) / 10}h)</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}