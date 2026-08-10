import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  LayoutDashboard, Plus, Search, Filter, FolderKanban,
  TrendingUp, Calendar, CheckCircle, Clock, AlertCircle,
  ArrowRight, BarChart3, Users, DollarSign, Target,
  GanttChart, Kanban, List, Grid3X3, MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Projects - WaveCore ERP | IntelliWavve',
  description: 'Manage projects, tasks, milestones, and track progress.',
}

const projectStats = [
  { label: 'Total Projects', value: '0', icon: FolderKanban, color: 'text-blue-500', change: '0 active' },
  { label: 'In Progress', value: '0', icon: Clock, color: 'text-orange-500', change: '0 projects' },
  { label: 'Completed', value: '0', icon: CheckCircle, color: 'text-green-500', change: 'This month' },
  { label: 'Overdue', value: '0', icon: AlertCircle, color: 'text-red-500', change: 'Requires attention' },
  { label: 'Total Budget', value: 'KSh 0.00', icon: DollarSign, color: 'text-purple-500', change: 'Across all projects' },
  { label: 'Team Members', value: '0', icon: Users, color: 'text-teal-500', change: 'Active' },
]

const quickActions = [
  { label: 'New Project', href: '/wavecore-erp/projects/create', icon: Plus, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950' },
  { label: 'Gantt View', href: '/wavecore-erp/projects?view=gantt', icon: GanttChart, color: 'text-green-600 bg-green-50 dark:bg-green-950' },
  { label: 'Kanban Board', href: '/wavecore-erp/projects?view=kanban', icon: Kanban, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950' },
  { label: 'Calendar', href: '/wavecore-erp/projects?view=calendar', icon: Calendar, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950' },
  { label: 'Reports', href: '/wavecore-erp/projects/reports', icon: BarChart3, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950' },
  { label: 'All Tasks', href: '/wavecore-erp/projects/tasks', icon: List, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950' },
]

const recentProjects = [
  // Sample data - will be replaced with API data
]

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-800 shadow-lg">
                <Image src="/images/Wavecore.jpeg" alt="WaveCore ERP" width={40} height={40} className="object-cover" priority />
              </div>
              <span className="font-bold text-xl text-neutral-900 dark:text-white">WaveCore</span>
              <span className="ml-2 px-2 py-0.5 text-[10px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-medium">ERP</span>
            </Link>
            <span className="text-neutral-300">/</span>
            <span className="text-sm font-medium">Projects</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/wavecore-erp" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-neutral-900 border-r min-h-[calc(100vh-64px)] p-4 hidden lg:block">
          <Link href="/wavecore-erp" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted mb-6">
            ← Back to Dashboard
          </Link>
          <p className="px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Projects</p>
          <nav className="space-y-1">
            {[
              { icon: LayoutDashboard, label: 'Dashboard', href: '/wavecore-erp/projects', active: true },
              { icon: FolderKanban, label: 'All Projects', href: '/wavecore-erp/projects' },
              { icon: List, label: 'Tasks', href: '/wavecore-erp/projects/tasks' },
              { icon: Kanban, label: 'Kanban Board', href: '/wavecore-erp/projects/kanban' },
              { icon: GanttChart, label: 'Gantt Chart', href: '/wavecore-erp/projects/gantt' },
              { icon: Calendar, label: 'Calendar', href: '/wavecore-erp/projects/calendar' },
              { icon: Users, label: 'Team', href: '/wavecore-erp/projects/team' },
              { icon: BarChart3, label: 'Reports', href: '/wavecore-erp/projects/reports' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.label} href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                    (item as any).active
                      ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold shadow-sm'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-muted'
                  }`}>
                  <Icon className="w-4 h-4" /> {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Projects</h1>
              <p className="text-muted-foreground mt-1">Manage your projects, track progress, and collaborate with your team</p>
            </div>
            <Link href="/wavecore-erp/projects/create">
              <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4" /> New Project
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {projectStats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg transition-all">
                  <Icon className={`w-5 h-5 ${stat.color} mb-3`} />
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                  <div className="text-[10px] text-neutral-400 mt-1">{stat.change}</div>
                </div>
              )
            })}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link key={action.label} href={action.href}
                    className="flex items-center gap-3 p-4 rounded-xl border bg-white dark:bg-neutral-900 hover:border-indigo-300 hover:shadow-md transition-all">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${action.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">{action.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Projects Table / Empty State */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-4">
                <h2 className="font-bold text-neutral-900 dark:text-white">All Projects</h2>
                <div className="flex gap-1">
                  {['All', 'Active', 'Completed', 'On Hold'].map((filter) => (
                    <button key={filter} className="px-3 py-1 text-xs rounded-lg hover:bg-muted transition-colors">
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" placeholder="Search projects..." className="pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48" />
                </div>
                <Button variant="outline" size="sm"><Filter className="w-4 h-4" /></Button>
              </div>
            </div>
            
            {/* Empty State */}
            <div className="p-16 text-center">
              <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mx-auto mb-4">
                <FolderKanban className="w-10 h-10 text-indigo-500" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start managing your projects, track milestones, and collaborate with your team.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/wavecore-erp/projects/create">
                  <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4" /> Create Your First Project
                  </Button>
                </Link>
                <Button variant="outline">
                  <Target className="w-4 h-4 mr-1" /> Import Projects
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}