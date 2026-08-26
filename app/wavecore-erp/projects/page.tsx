'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  FolderKanban, Download, Loader2, TrendingUp, CheckCircle,
  Clock, Users, BarChart3, Plus, Calendar, GanttChartSquare,
  Timer, GitBranch, Target, FileText, DollarSign
 } from 'lucide-react'

export default function ProjectsPage() {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/projects')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - Project Management',
      '='.repeat(50),
      'Generated: ' + new Date().toLocaleString(),
      'Total Projects: ' + (data.projects?.length || 0),
      '',
      '© 2026 IntelliWavve'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'projects.pdf'; a.click()
  }

  const modules = [
    { name: 'Kanban Board', href: '/wavecore-erp/projects/kanban', icon: GanttChartSquare, color: 'from-blue-500 to-indigo-600', desc: 'Visual task board' },
    { name: 'Gantt Timeline', href: '/wavecore-erp/projects/gantt', icon: Calendar, color: 'from-purple-500 to-violet-600', desc: 'Project timeline' },
    { name: 'Time Tracking', href: '/wavecore-erp/projects/time-tracking', icon: Timer, color: 'from-green-500 to-emerald-600', desc: 'Track hours' },
    { name: 'Resources', href: '/wavecore-erp/projects/resources', icon: Users, color: 'from-amber-500 to-orange-600', desc: 'Resource planning' },
    { name: 'Tasks', href: '/wavecore-erp/projects/tasks', icon: GitBranch, color: 'from-cyan-500 to-teal-600', desc: 'Tasks & dependencies' },
    { name: 'Milestones', href: '/wavecore-erp/projects/milestones', icon: Target, color: 'from-pink-500 to-rose-600', desc: 'Key milestones' },
    { name: 'Budget', href: '/wavecore-erp/projects/budget', icon: DollarSign, color: 'from-emerald-500 to-green-600', desc: 'Budget tracking' },
    { name: 'Reports', href: '/wavecore-erp/projects/reports', icon: FileText, color: 'from-indigo-500 to-blue-600', desc: 'Project reports' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Projects</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-700 p-6 lg:p-8 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <FolderKanban className="w-8 h-8" /> Project Management
              </h1>
              <p className="text-white/80 text-sm">8 Modules • Kanban • Gantt • Budget</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
              <Link href="/wavecore-erp/projects/create" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-teal-700 text-sm font-bold"><Plus className="w-4 h-4" /> New</Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-teal-500" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
                <FolderKanban className="w-8 h-8 text-teal-500 mb-3" />
                <p className="text-3xl font-extrabold">{data.projects?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Total Projects</p>
              </div>
              <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
                <CheckCircle className="w-8 h-8 text-green-500 mb-3" />
                <p className="text-3xl font-extrabold">{data.projects?.filter((p: any) => p.status === 'ACTIVE').length || 0}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
                <Clock className="w-8 h-8 text-amber-500 mb-3" />
                <p className="text-3xl font-extrabold">0</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
                <DollarSign className="w-8 h-8 text-emerald-500 mb-3" />
                <p className="text-3xl font-extrabold">KSh 5M</p>
                <p className="text-xs text-muted-foreground">Budget</p>
              </div>
            </div>

            <h2 className="text-xl font-bold mb-4">Project Modules (8)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {modules.map(module => {
                const Icon = module.icon
                return (
                  <Link key={module.name} href={module.href}
                    className="p-6 rounded-2xl border bg-white dark:bg-neutral-900 hover:border-teal-300 hover:shadow-2xl transition-all group">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${module.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <p className="font-bold text-lg">{module.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{module.desc}</p>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}