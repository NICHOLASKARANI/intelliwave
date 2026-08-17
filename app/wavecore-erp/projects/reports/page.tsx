'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BarChart3, Download, TrendingUp, DollarSign, FolderKanban, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ProjectReportsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/projects').then(r => r.json()).then(d => setProjects(d.projects || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0)
  const inProgress = projects.filter(p => p.status === 'IN_PROGRESS')
  const completed = projects.filter(p => p.status === 'COMPLETED')
  const pending = projects.filter(p => p.status === 'PENDING')
  const onHold = projects.filter(p => p.status === 'ON_HOLD')

  const formatKES = (a: number) => 'KSh ' + (a || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

  const handleExport = () => {
    const csv = 'Project,Status,Budget,Start Date\n' + projects.map(p => `${p.title},${p.status},${p.budget},${p.startDate || ''}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'project-report.csv'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/projects" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Project Reports</span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6 text-purple-500" /> Project Reports</h1>
          <Button variant="outline" onClick={handleExport}><Download className="w-4 h-4 mr-1" /> Export CSV</Button>
        </div>

        {loading ? <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500" /></div> : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
                <FolderKanban className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{projects.length}</p>
                <p className="text-xs text-muted-foreground">Total Projects</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
                <DollarSign className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{formatKES(totalBudget)}</p>
                <p className="text-xs text-muted-foreground">Total Budget</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
                <TrendingUp className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{inProgress.length}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
                <BarChart3 className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{completed.length}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>

            {/* Status Distribution */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
              <h3 className="font-bold mb-4">Status Distribution</h3>
              <div className="space-y-3">
                {[
                  { label: 'Pending', count: pending.length, color: 'bg-gray-400' },
                  { label: 'In Progress', count: inProgress.length, color: 'bg-blue-500' },
                  { label: 'Completed', count: completed.length, color: 'bg-green-500' },
                  { label: 'On Hold', count: onHold.length, color: 'bg-amber-500' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${s.color}`} />
                    <span className="flex-1">{s.label}</span>
                    <span className="font-bold">{s.count}</span>
                    <div className="w-24 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                      <div className={`h-full rounded-full ${s.color}`} style={{ width: `${projects.length > 0 ? (s.count / projects.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}