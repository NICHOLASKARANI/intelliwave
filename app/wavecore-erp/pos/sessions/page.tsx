'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Clock, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'

type Session = {
  id: string
  terminalId: string
  cashierName?: string
  openingCash: number
  closingCash?: number
  expectedCash?: number
  cashVariance?: number
  status: string
  openedAt: string
  closedAt?: string
}

export default function SessionsPage() {
  const [orgId, setOrgId] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])

  useEffect(() => {
    const cookies = document.cookie.split(';').reduce((acc: any, c) => {
      const [k, v] = c.trim().split('=')
      acc[k] = decodeURIComponent(v || '')
      return acc
    }, {})
    const o = cookies['wavecore_organizationId'] || cookies['organizationId'] || ''
    setOrgId(o)
    if (o) {
      fetch('/api/wavecore/pos/sessions?organizationId=' + o)
        .then(r => r.json())
        .then(d => { if (d.sessions) setSessions(d.sessions) })
        .catch(() => {})
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link href="/wavecore-erp/pos" className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to POS
          </Link>
          <h1 className="text-3xl font-bold">Session History</h1>
          <p className="text-slate-400">All register shifts with cash reconciliation</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          {sessions.length === 0 ? (
            <p className="text-slate-500 text-center py-12">No sessions yet. Open one from POS to start selling.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/50">
                  <tr className="text-left text-slate-400">
                    <th className="p-4">Opened</th>
                    <th className="p-4">Cashier</th>
                    <th className="p-4 text-right">Opening</th>
                    <th className="p-4 text-right">Expected</th>
                    <th className="p-4 text-right">Closing</th>
                    <th className="p-4 text-right">Variance</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.id} className="border-t border-slate-800">
                      <td className="p-4">{new Date(s.openedAt).toLocaleString()}</td>
                      <td className="p-4">{s.cashierName || '—'}</td>
                      <td className="p-4 text-right">KSh {s.openingCash.toLocaleString()}</td>
                      <td className="p-4 text-right">{s.expectedCash != null ? 'KSh ' + s.expectedCash.toLocaleString() : '—'}</td>
                      <td className="p-4 text-right">{s.closingCash != null ? 'KSh ' + s.closingCash.toLocaleString() : '—'}</td>
                      <td className={'p-4 text-right font-bold ' + (s.cashVariance == null ? '' : s.cashVariance < 0 ? 'text-red-400' : 'text-green-400')}>
                        {s.cashVariance != null ? 'KSh ' + s.cashVariance.toLocaleString() : '—'}
                      </td>
                      <td className="p-4">
                        <span className={'inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ' + (s.status === 'OPEN' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300')}>
                          {s.status === 'OPEN' ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}