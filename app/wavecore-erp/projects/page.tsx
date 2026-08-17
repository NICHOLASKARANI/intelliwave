'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  FolderKanban, Plus, Search, Trash2, Loader2, AlertCircle, CheckCircle,
  Calendar, DollarSign, GanttChart, Kanban, Clock, Users, Flag, BarChart3, ListTodo
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function fetchProjects() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/projects')
      if (res.ok) { const data = await res.json(); setProjects(data.projects || []) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchProjects() }, [])

  const filtered = projects.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()))
  const formatKES = (a: number) => 'KSh ' + (a || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

  const subPages = [
    { label: 'Kanban Board', href: '/wavecore-erp/projects/kanban', icon: Kanban, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950', desc: 'Drag & drop project cards' },
    { label: 'Gantt Chart', href: '/wavecore-erp/projects/gantt', icon: GanttChart, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950', desc: 'Visual timeline of projects' },
    { label: 'Time Tracking', href: '/wavecore-erp/projects/time-tracking', icon: Clock, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950', desc: 'Log hours and track time' },
    { label: 'Resources', href: '/wavecore-erp/projects/resources', icon: Users, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950', desc: 'Plan team resources' },
    { label: 'Tasks', href: '/wavecore-erp/projects/tasks', icon: ListTodo, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950', desc: 'Tasks with dependencies' },
    { label: 'Milestones', href: '/wavecore-erp/projects/milestones', icon: Flag, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950', desc: 'Track project milestones' },
    { label: 'Reports', href: '/wavecore-erp/projects/reports', icon: BarChart3, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950', desc: 'Analytics and export' },
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
        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-teal-600 via-emerald-600 to-green-600 p-6 lg:p-8 mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <FolderKanban className="w-8 h-8" /> Project Management
          </h1>
          <p className="text-white/80 text-sm">Kanban • Gantt • Time Tracking • Resources • Milestones</p>
        </div>

        {/* Sub-pages Navigation */}
        <h2 className="text-lg font-bold mb-4">Project Tools</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {subPages.map(page => {
            const Icon = page.icon
            return (
              <Link key={page.label} href={page.href}
                className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 hover:border-teal-300 hover:shadow-lg transition-all group">
                <div className={`w-10 h-10 rounded-xl ${page.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${page.color}`} />
                </div>
                <p className="font-medium text-sm">{page.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{page.desc}</p>
              </Link>
            )
          })}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border text-sm w-full" placeholder="Search projects..." />
        </div>

        {/* Project List */}
        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-500" /></div>
        ) : filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => (
              <div key={p.id} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg transition-all">
                <h3 className="font-bold">{p.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {formatKES(p.budget)}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {p.startDate ? new Date(p.startDate).toLocaleDateString() : '-'}</span>
                </div>
                <span className={`mt-3 inline-block px-2 py-1 text-xs rounded-full ${
                  p.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : p.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'
                }`}>{p.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No projects yet</p>
            <Link href="/wavecore-erp/projects/create" className="inline-block mt-4">
              <Button className="gap-2 bg-teal-600"><Plus className="w-4 h-4" /> Create Project</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}