'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Activity, Download, Loader2, Search, Trash2 } from 'lucide-react'
import { authedFetch } from '@/lib/wavecore/csrf-client'

interface LogItem {
  id: string
  workflowName: string
  status: string
  duration: string
  createdAt: string
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await authedFetch('/api/wavecore/logs')
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
      }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const deleteLog = (id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id))
  }

  const clearAllLogs = async () => {
    if (!confirm('Clear all execution logs?')) return
    try {
      await authedFetch('/api/wavecore/logs', { method: 'DELETE' })
      setLogs([])
    } catch {}
  }

  const filtered = logs.filter(l =>
    (l.workflowName || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/automation" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Execution Logs</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="w-6 h-6 text-orange-500" /> Execution Logs ({logs.length})</h1>
          <button onClick={clearAllLogs} className="text-sm text-red-500">Clear All</button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search logs..." />
        </div>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No execution logs yet</p>
            <p className="text-sm text-muted-foreground mt-1">Logs will appear when workflows run</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            {filtered.map(log => (
              <div key={log.id} className="flex justify-between items-center p-4 border-b">
                <div>
                  <p className="font-medium">{log.workflowName}</p>
                  <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${log.status === 'SUCCESS' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{log.status}</span>
                  <span className="text-xs text-muted-foreground">{log.duration}</span>
                  <button onClick={() => deleteLog(log.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}