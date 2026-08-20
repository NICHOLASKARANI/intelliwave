'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Shield, Download, Loader2, FileText } from 'lucide-react'

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/settings/audit-logs')
      .then(r => r.json())
      .then(d => setLogs(d.logs || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Audit Trail', '='.repeat(50), `Total Logs: ${logs.length}`, '', ...logs.map((l: any, i) => `${i+1}. ${l.action || 'Action'} - ${l.createdAt || ''}`), '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'audit-trail.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Audit Trail</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-slate-600 to-slate-800 p-6 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Shield className="w-7 h-7" /> Audit Trail</h1>
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
          </div>
        </div>
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            {logs.map((l: any, i: number) => (
              <div key={i} className="flex justify-between p-4 border-b">
                <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" />{l.action || 'Action'}</span>
                <span className="text-xs text-muted-foreground">{l.createdAt}</span>
              </div>
            ))}
            {logs.length === 0 && <p className="text-center py-8 text-muted-foreground">No audit logs</p>}
          </div>
        )}
      </main>
    </div>
  )
}