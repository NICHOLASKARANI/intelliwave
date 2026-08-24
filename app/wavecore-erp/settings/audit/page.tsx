'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FileText, Download, Loader2, Search, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId: string
  changes: string
  userId: string
  createdAt: string
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/wavecore/audit-logs')
      const data = await res.json()
      setLogs(data.logs || [])
    } catch (err) {
      setError('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head>
          <title>Audit Logs</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #333; border-bottom: 3px solid #059669; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #059669; color: white; padding: 12px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            .header { display: flex; justify-content: space-between; align-items: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Audit Logs</h1>
            <div>Generated: ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead><tr><th>Action</th><th>Entity</th><th>User</th><th>Date</th></tr></thead>
            <tbody>
              ${logs.map(log => `<tr><td>${log.action}</td><td>${log.entityType}</td><td>${log.userId || 'System'}</td><td>${new Date(log.createdAt).toLocaleString()}</td></tr>`).join('')}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const filtered = logs.filter(log => 
    (log.action || '').toLowerCase().includes(search.toLowerCase()) ||
    (log.entityType || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/settings" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Audit Logs</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-500" /> Audit Logs ({logs.length})
          </h1>
          <Button onClick={downloadPDF} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Download className="w-4 h-4" /> Export PDF
          </Button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search audit logs..." />
        </div>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No audit logs found</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  <th className="text-left p-4 text-sm">Action</th>
                  <th className="text-left p-4 text-sm">Entity</th>
                  <th className="text-left p-4 text-sm">User</th>
                  <th className="text-left p-4 text-sm">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => (
                  <tr key={log.id} className="border-t">
                    <td className="p-4"><span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-600">{log.action}</span></td>
                    <td className="p-4 text-sm">{log.entityType}</td>
                    <td className="p-4 text-sm">{log.userId || 'System'}</td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}