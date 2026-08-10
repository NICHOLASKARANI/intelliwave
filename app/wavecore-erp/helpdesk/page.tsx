import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  LayoutDashboard, Plus, Search, Filter, HeadphonesIcon,
  MessageSquare, Clock, CheckCircle, AlertCircle, TrendingUp,
  Users, Inbox, Tag, ArrowRight, BarChart3, Star, ThumbsUp,
  Zap, Shield, Phone, Mail, Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Helpdesk - WaveCore ERP | IntelliWavve',
  description: 'Manage support tickets, SLAs, knowledge base, and customer support.',
}

const helpdeskStats = [
  { label: 'Total Tickets', value: '0', icon: Inbox, color: 'text-blue-500', change: 'All time' },
  { label: 'Open Tickets', value: '0', icon: AlertCircle, color: 'text-red-500', change: 'Requires attention' },
  { label: 'In Progress', value: '0', icon: Clock, color: 'text-orange-500', change: 'Being worked on' },
  { label: 'Resolved Today', value: '0', icon: CheckCircle, color: 'text-green-500', change: 'Today' },
  { label: 'Avg Response Time', value: '0m', icon: Zap, color: 'text-purple-500', change: 'This week' },
  { label: 'Satisfaction Rate', value: '0%', icon: Star, color: 'text-yellow-500', change: 'This month' },
]

const quickActions = [
  { label: 'New Ticket', href: '/wavecore-erp/helpdesk/tickets/create', icon: Plus, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950' },
  { label: 'My Tickets', href: '/wavecore-erp/helpdesk/tickets?filter=my', icon: MessageSquare, color: 'text-green-600 bg-green-50 dark:bg-green-950' },
  { label: 'Knowledge Base', href: '/wavecore-erp/helpdesk/knowledge-base', icon: Globe, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950' },
  { label: 'SLA Reports', href: '/wavecore-erp/helpdesk/reports', icon: BarChart3, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950' },
  { label: 'Live Chat', href: '/wavecore-erp/helpdesk/chat', icon: Phone, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950' },
  { label: 'Settings', href: '/wavecore-erp/helpdesk/settings', icon: Shield, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950' },
]

const ticketCategories = [
  { name: 'Technical Support', count: 0, color: 'bg-blue-500' },
  { name: 'Billing', count: 0, color: 'bg-green-500' },
  { name: 'Feature Request', count: 0, color: 'bg-purple-500' },
  { name: 'Bug Report', count: 0, color: 'bg-red-500' },
  { name: 'Account', count: 0, color: 'bg-orange-500' },
  { name: 'General Inquiry', count: 0, color: 'bg-teal-500' },
]

const priorityLevels = [
  { name: 'Critical', count: 0, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950' },
  { name: 'High', count: 0, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
  { name: 'Medium', count: 0, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950' },
  { name: 'Low', count: 0, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
]

export default function HelpdeskPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
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
            <span className="text-sm font-medium">Helpdesk</span>
          </div>
          <Link href="/wavecore-erp" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white dark:bg-neutral-900 border-r min-h-[calc(100vh-64px)] p-4 hidden lg:block">
          <Link href="/wavecore-erp" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted mb-6">
            ← Back to Dashboard
          </Link>
          <p className="px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Helpdesk</p>
          <nav className="space-y-1">
            {[
              { icon: LayoutDashboard, label: 'Dashboard', href: '/wavecore-erp/helpdesk', active: true },
              { icon: Inbox, label: 'All Tickets', href: '/wavecore-erp/helpdesk/tickets' },
              { icon: AlertCircle, label: 'Open Tickets', href: '/wavecore-erp/helpdesk/tickets?status=OPEN' },
              { icon: Clock, label: 'In Progress', href: '/wavecore-erp/helpdesk/tickets?status=IN_PROGRESS' },
              { icon: CheckCircle, label: 'Resolved', href: '/wavecore-erp/helpdesk/tickets?status=RESOLVED' },
              { icon: Globe, label: 'Knowledge Base', href: '/wavecore-erp/helpdesk/knowledge-base' },
              { icon: BarChart3, label: 'Reports', href: '/wavecore-erp/helpdesk/reports' },
              { icon: Shield, label: 'Settings', href: '/wavecore-erp/helpdesk/settings' },
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

        <main className="flex-1 p-4 lg:p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Helpdesk</h1>
              <p className="text-muted-foreground mt-1">Manage support tickets, track SLAs, and help your customers</p>
            </div>
            <Link href="/wavecore-erp/helpdesk/tickets/create">
              <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4" /> New Ticket
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {helpdeskStats.map((stat) => {
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

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
              <h3 className="font-bold mb-4 text-neutral-900 dark:text-white">Tickets by Category</h3>
              <div className="space-y-3">
                {ticketCategories.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                    <span className="flex-1 text-sm">{cat.name}</span>
                    <span className="text-sm font-bold">{cat.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
              <h3 className="font-bold mb-4 text-neutral-900 dark:text-white">Priority Overview</h3>
              <div className="grid grid-cols-2 gap-3">
                {priorityLevels.map((p) => (
                  <div key={p.name} className={`p-4 rounded-xl ${p.bg} text-center`}>
                    <p className={`text-2xl font-bold ${p.color}`}>{p.count}</p>
                    <p className={`text-xs ${p.color} mt-1`}>{p.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold text-neutral-900 dark:text-white">Recent Tickets</h2>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" placeholder="Search tickets..." className="pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48" />
                </div>
                <Button variant="outline" size="sm"><Filter className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="p-16 text-center">
              <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mx-auto mb-4">
                <HeadphonesIcon className="w-10 h-10 text-indigo-500" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">No tickets yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Your support desk is empty. Create a new ticket to get started with customer support.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/wavecore-erp/helpdesk/tickets/create">
                  <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4" /> Create First Ticket
                  </Button>
                </Link>
                <Button variant="outline">
                  <Globe className="w-4 h-4 mr-1" /> Knowledge Base
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}