'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  FolderKanban, Plus, Search, Trash2, Loader2, AlertCircle, CheckCircle,
  Calendar, DollarSign, Users, Clock, TrendingUp, BarChart3, GanttChart, Kanban
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'board' | 'list'>('board')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [formData, setFormData] = useState({
    title: '', description: '', budget: '', startDate: '', endDate: '', status: 'PENDING',
  })
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

  const update = (field: string, value: string) => setFormData({ ...formData, [field]: value })

  const handleAdd = async () => {
    setError(''); setSuccess('')
    if (!formData.title) { setError('Project title required'); return }
    try {
      const res = await fetch('/api/wavecore/projects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, budget: parseFloat(formData.budget) || 0 }),
      })
      const data = await res.json()
      if (res.ok) { setSuccess('Project created!'); setShowAdd(false); fetchProjects() }
      else { setError(data.error || 'Failed') }
    } catch { setError('Network error') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return
    try { await fetch(`/api/wavecore/projects/${id}`, { method: 'DELETE' }); fetchProjects() } catch {}
  }

  const filtered = projects.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()))

  const formatKES = (a: number) => 'KSh ' + (a || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

  const columns = [
    { title: 'Pending', status: 'PENDING', color: 'bg-gray-400' },
    { title: 'In Progress', status: 'IN_PROGRESS', color: 'bg-blue-500' },
    { title: 'Completed', status: 'COMPLETED', color: 'bg-green-500' },
    { title: 'On Hold', status: 'ON_HOLD', color: 'bg-amber-500' },
  ]

  const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0)
  const activeProjects = projects.filter(p => p.status === 'IN_PROGRESS').length
  const completedProjects = projects.filter(p => p.status === 'COMPLETED').length

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
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3"><FolderKanban className="w-8 h-8" /> Projects</h1>
              <p className="text-white/80 text-sm">Total Budget: {formatKES(totalBudget)}</p>
            </div>
            <div className="flex gap-3">
              <div className="bg-white/20 rounded-xl px-4 py-2 text-white text-center">
                <p className="text-xl font-bold">{activeProjects}</p>
                <p className="text-xs">Active</p>
              </div>
              <div className="bg-white/20 rounded-xl px-4 py-2 text-white text-center">
                <p className="text-xl font-bold">{completedProjects}</p>
                <p className="text-xs">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="p-4 mb-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
        {success && <div className="p-4 mb-4 rounded-xl bg-green-50 text-green-600 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {success}</div>}

        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl border text-sm w-full" placeholder="Search projects..." />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setView('board')} className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1 ${view === 'board' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-neutral-800'}`}>
              <Kanban className="w-4 h-4" /> Kanban
            </button>
            <button onClick={() => setView('list')} className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1 ${view === 'list' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-neutral-800'}`}>
              <GanttChart className="w-4 h-4" /> List
            </button>
          </div>
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-teal-600"><Plus className="w-4 h-4" /> New Project</Button>
        </div>

        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <h3 className="font-bold mb-4">Create Project</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="col-span-3"><label className="block text-sm font-medium mb-2">Title *</label>
                <input type="text" value={formData.title} onChange={(e) => update('title', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" placeholder="Project title" />
              </div>
              <div className="col-span-3"><label className="block text-sm font-medium mb-2">Description</label>
                <textarea value={formData.description} onChange={(e) => update('description', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" rows={2} />
              </div>
              <div><label className="block text-sm font-medium mb-2">Budget (KSh)</label>
                <input type="number" value={formData.budget} onChange={(e) => update('budget', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" />
              </div>
              <div><label className="block text-sm font-medium mb-2">Status</label>
                <select value={formData.status} onChange={(e) => update('status', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border">
                  <option value="PENDING">Pending</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option><option value="ON_HOLD">On Hold</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium mb-2">Start Date</label>
                <input type="date" value={formData.startDate} onChange={(e) => update('startDate', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" />
              </div>
            </div>
            <Button onClick={handleAdd} className="mt-4">Create Project</Button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-500" /></div>
        ) : view === 'board' ? (
          <div className="grid md:grid-cols-4 gap-4">
            {columns.map(col => (
              <div key={col.status} className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl p-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${col.color}`} />
                  <span className="font-bold text-sm">{col.title}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{filtered.filter(p => p.status === col.status).length}</span>
                </div>
                <div className="space-y-2">
                  {filtered.filter(p => p.status === col.status).map(p => (
                    <div key={p.id} className="p-3 rounded-xl border bg-white dark:bg-neutral-900 hover:shadow-md transition-all">
                      <p className="font-medium text-sm">{p.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatKES(p.budget)}</p>
                      <button onClick={() => handleDelete(p.id)} className="mt-2 p-1 text-red-500"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                <th className="text-left p-4">Project</th><th className="text-left p-4">Status</th>
                <th className="text-right p-4">Budget</th><th className="text-left p-4">Start</th>
                <th className="text-center p-4">Actions</th>
              </tr></thead>
              <tbody>{filtered.map(p => (
                <tr key={p.id} className="border-b hover:bg-neutral-50 dark:hover:bg-neutral-800">
                  <td className="p-4 font-medium">{p.title}</td>
                  <td className="p-4">{p.status}</td>
                  <td className="p-4 text-right">{formatKES(p.budget)}</td>
                  <td className="p-4">{p.startDate ? new Date(p.startDate).toLocaleDateString() : '-'}</td>
                  <td className="p-4 text-center"><button onClick={() => handleDelete(p.id)} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}