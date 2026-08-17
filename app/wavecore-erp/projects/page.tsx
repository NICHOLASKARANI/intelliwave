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
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState('PENDING')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function fetchProjects() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/projects')
      if (res.ok) { const data = await res.json(); setProjects(data.projects || []) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchProjects() }, [])

  const handleAdd = async () => {
    setError(''); setSuccess('')
    if (!title) { setError('Project title required'); return }
    try {
      const res = await fetch('/api/wavecore/projects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, budget: parseFloat(budget) || 0, startDate, endDate, status }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSuccess('Project created!')
        setShowAdd(false)
        setTitle(''); setDescription(''); setBudget(''); setStartDate(''); setEndDate('')
        fetchProjects()
      } else { setError(data.error || 'Failed') }
    } catch { setError('Network error') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return
    try { await fetch(`/api/wavecore/projects/${id}`, { method: 'DELETE' }); fetchProjects() } catch {}
  }

  const filtered = projects.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()))
  const formatKES = (a: number) => 'KSh ' + (a || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

  const subPages = [
    { label: 'Kanban Board', href: '/wavecore-erp/projects/kanban', icon: Kanban, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
    { label: 'Gantt Chart', href: '/wavecore-erp/projects/gantt', icon: GanttChart, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950' },
    { label: 'Time Tracking', href: '/wavecore-erp/projects/time-tracking', icon: Clock, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950' },
    { label: 'Resources', href: '/wavecore-erp/projects/resources', icon: Users, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
    { label: 'Tasks', href: '/wavecore-erp/projects/tasks', icon: ListTodo, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
    { label: 'Milestones', href: '/wavecore-erp/projects/milestones', icon: Flag, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950' },
    { label: 'Reports', href: '/wavecore-erp/projects/reports', icon: BarChart3, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4" /> New Project
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-teal-600 via-emerald-600 to-green-600 p-6 lg:p-8 mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3"><FolderKanban className="w-8 h-8" /> Project Management</h1>
          <p className="text-white/80 text-sm">Kanban • Gantt • Time Tracking • Resources • Milestones</p>
        </div>

        {error && <div className="p-4 mb-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
        {success && <div className="p-4 mb-4 rounded-xl bg-green-50 text-green-600 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {success}</div>}

        {/* Create Project Form (Modal) */}
        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6 shadow-2xl">
            <h3 className="font-bold mb-4 text-lg">Create New Project</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border" placeholder="Project title" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border" rows={2} placeholder="Project description" />
              </div>
              <div><label className="block text-sm font-medium mb-2">Budget (KSh)</label>
                <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" min="0" />
              </div>
              <div><label className="block text-sm font-medium mb-2">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border">
                  <option value="PENDING">Pending</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option><option value="ON_HOLD">On Hold</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium mb-2">Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" />
              </div>
              <div><label className="block text-sm font-medium mb-2">End Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button onClick={handleAdd} className="gap-2 bg-teal-600 hover:bg-teal-700">
                <Plus className="w-4 h-4" /> Create Project
              </Button>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </div>
        )}

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
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold">{p.title}</h3>
                  <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{p.description}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {formatKES(p.budget)}</span>
                  {p.startDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(p.startDate).toLocaleDateString()}</span>}
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
            <p className="text-sm text-muted-foreground mt-1 mb-4">Create your first project</p>
            <Button onClick={() => setShowAdd(true)} className="gap-2 bg-teal-600">
              <Plus className="w-4 h-4" /> Create Project
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}