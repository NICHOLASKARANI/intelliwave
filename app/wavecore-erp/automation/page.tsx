import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  LayoutDashboard, Plus, Search, Filter, Workflow,
  GitBranch, Play, Pause, StopCircle, CheckCircle,
  AlertCircle, Clock, Zap, Settings, Trash2, Copy,
  Edit3, Eye, ArrowRight, GitMerge, Split, Timer,
  Mail, Bell, MessageSquare, FileText, Calculator,
  Users, Package, Factory, Briefcase, Globe, Webhook,
  Layers, GanttChart, Repeat, RotateCcw, TrendingUp,
  Activity, BarChart3, ChevronDown, MoreHorizontal, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Workflow Automation - WaveCore ERP | IntelliWavve',
  description: 'Visual workflow builder, approval chains, business rules, and automation triggers.',
}

const workflowStats = [
  { label: 'Total Workflows', value: '0', icon: Workflow, color: 'text-blue-500', change: 'All workflows' },
  { label: 'Active', value: '0', icon: Play, color: 'text-green-500', change: 'Running' },
  { label: 'Paused', value: '0', icon: Pause, color: 'text-yellow-500', change: 'On hold' },
  { label: 'Failed', value: '0', icon: AlertCircle, color: 'text-red-500', change: 'Requires attention' },
  { label: 'Executions Today', value: '0', icon: Activity, color: 'text-purple-500', change: 'Today' },
  { label: 'Success Rate', value: '0%', icon: CheckCircle, color: 'text-emerald-500', change: 'Last 30 days' },
]

const quickActions = [
  { label: 'New Workflow', href: '/wavecore-erp/automation/workflows/create', icon: Plus, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950' },
  { label: 'Templates', href: '/wavecore-erp/automation/templates', icon: Layers, color: 'text-green-600 bg-green-50 dark:bg-green-950' },
  { label: 'Execution Logs', href: '/wavecore-erp/automation/logs', icon: FileText, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950' },
  { label: 'Webhooks', href: '/wavecore-erp/automation/webhooks', icon: Webhook, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950' },
  { label: 'API Keys', href: '/wavecore-erp/automation/api-keys', icon: Globe, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950' },
  { label: 'Settings', href: '/wavecore-erp/automation/settings', icon: Settings, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950' },
]

const triggerTypes = [
  { name: 'Schedule', desc: 'Run at specific times', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
  { name: 'Webhook', desc: 'Triggered by external API', icon: Webhook, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
  { name: 'Email', desc: 'Triggered by incoming email', icon: Mail, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
  { name: 'Database', desc: 'On record create/update', icon: Layers, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
  { name: 'Manual', desc: 'Manually triggered', icon: Play, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950' },
  { name: 'Form Submit', desc: 'On form submission', icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950' },
]

const actionTypes = [
  { name: 'Send Email', desc: 'Send automated emails', icon: Mail, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
  { name: 'Notification', desc: 'Push notifications', icon: Bell, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
  { name: 'Create Record', desc: 'Create database records', icon: Plus, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
  { name: 'Update Record', desc: 'Update existing records', icon: Edit3, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
  { name: 'Webhook Call', desc: 'Call external APIs', icon: Globe, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950' },
  { name: 'Approval', desc: 'Request approval', icon: CheckCircle, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950' },
  { name: 'Calculation', desc: 'Perform calculations', icon: Calculator, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950' },
  { name: 'Condition', desc: 'Branch logic', icon: GitBranch, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950' },
]

const workflowTemplates = [
  { name: 'Invoice Approval', desc: 'Route invoices for manager approval', trigger: 'On Create', steps: 3, category: 'Finance' },
  { name: 'Leave Request', desc: 'Employee leave approval workflow', trigger: 'On Submit', steps: 2, category: 'HR' },
  { name: 'Purchase Order', desc: 'PO approval and processing', trigger: 'On Create', steps: 4, category: 'Finance' },
  { name: 'New Lead Assignment', desc: 'Auto-assign leads to sales reps', trigger: 'On Create', steps: 2, category: 'CRM' },
  { name: 'Low Stock Alert', desc: 'Notify when stock drops below minimum', trigger: 'On Update', steps: 2, category: 'Inventory' },
  { name: 'Welcome Email', desc: 'Send welcome email to new customers', trigger: 'On Create', steps: 1, category: 'CRM' },
  { name: 'Payment Reminder', desc: 'Send reminders for overdue invoices', trigger: 'Schedule', steps: 2, category: 'Finance' },
  { name: 'Quality Check', desc: 'Route products for quality inspection', trigger: 'On Create', steps: 3, category: 'Manufacturing' },
]

const recentExecutions = [
  // Will be populated from API
]

export default function AutomationPage() {
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
            <div className="flex items-center gap-2">
              <Workflow className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-medium">Workflow Automation</span>
            </div>
          </div>
          <Link href="/wavecore-erp" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-neutral-900 border-r min-h-[calc(100vh-64px)] p-4 hidden lg:block">
          <Link href="/wavecore-erp" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted mb-6">
            ← Back to Dashboard
          </Link>

          <Link href="/wavecore-erp/automation/workflows/create" className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors mb-6">
            <Plus className="w-4 h-4" /> New Workflow
          </Link>

          <p className="px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Automation</p>
          <nav className="space-y-1">
            {[
              { icon: LayoutDashboard, label: 'Dashboard', href: '/wavecore-erp/automation', active: true },
              { icon: Workflow, label: 'All Workflows', href: '/wavecore-erp/automation/workflows' },
              { icon: Play, label: 'Active', href: '/wavecore-erp/automation/workflows?status=active' },
              { icon: Pause, label: 'Paused', href: '/wavecore-erp/automation/workflows?status=paused' },
              { icon: Layers, label: 'Templates', href: '/wavecore-erp/automation/templates' },
              { icon: FileText, label: 'Execution Logs', href: '/wavecore-erp/automation/logs' },
              { icon: Webhook, label: 'Webhooks', href: '/wavecore-erp/automation/webhooks' },
              { icon: Settings, label: 'Settings', href: '/wavecore-erp/automation/settings' },
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
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Workflow Automation</h1>
              <p className="text-muted-foreground mt-1">Visual workflow builder, approval chains, business rules, and automation triggers</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2">
                <Layers className="w-4 h-4" /> Templates
              </Button>
              <Link href="/wavecore-erp/automation/workflows/create">
                <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-4 h-4" /> New Workflow
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {workflowStats.map((stat) => {
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

          {/* Triggers & Actions */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Triggers */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
              <h3 className="font-bold mb-4 text-neutral-900 dark:text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" /> Triggers
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {triggerTypes.map((trigger) => {
                  const Icon = trigger.icon
                  return (
                    <div key={trigger.name} className={`p-4 rounded-xl ${trigger.bg} border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 transition-all cursor-pointer`}>
                      <Icon className={`w-6 h-6 ${trigger.color} mb-2`} />
                      <p className="font-medium text-sm">{trigger.name}</p>
                      <p className="text-xs text-muted-foreground">{trigger.desc}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
              <h3 className="font-bold mb-4 text-neutral-900 dark:text-white flex items-center gap-2">
                <Play className="w-5 h-5 text-green-500" /> Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {actionTypes.map((action) => {
                  const Icon = action.icon
                  return (
                    <div key={action.name} className={`p-4 rounded-xl ${action.bg} border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 transition-all cursor-pointer`}>
                      <Icon className={`w-6 h-6 ${action.color} mb-2`} />
                      <p className="font-medium text-sm">{action.name}</p>
                      <p className="text-xs text-muted-foreground">{action.desc}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Workflow Templates */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Workflow Templates</h3>
              <Link href="/wavecore-erp/automation/templates" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {workflowTemplates.map((template) => (
                <div key={template.name} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
                      <Workflow className="w-5 h-5 text-indigo-500" />
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-muted-foreground">
                      {template.category}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm mb-1">{template.name}</h4>
                  <p className="text-xs text-muted-foreground mb-3">{template.desc}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {template.trigger}</span>
                    <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> {template.steps} steps</span>
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <Button size="sm" variant="outline" className="text-xs h-8">Use Template</Button>
                    <Button size="sm" variant="ghost" className="text-xs h-8"><Eye className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Workflow Visual Builder Preview */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white">How It Works</h3>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-8">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                  <Zap className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Trigger</p>
                    <p className="text-xs text-muted-foreground">Event starts workflow</p>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-muted-foreground" />
                <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                  <GitBranch className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Condition</p>
                    <p className="text-xs text-muted-foreground">Check business rules</p>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-muted-foreground" />
                <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800">
                  <Play className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Action</p>
                    <p className="text-xs text-muted-foreground">Execute tasks</p>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-muted-foreground" />
                <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium">Complete</p>
                    <p className="text-xs text-muted-foreground">Workflow finished</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Executions / Empty State */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold text-neutral-900 dark:text-white">Recent Executions</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-1" /> Filter</Button>
                <Button variant="outline" size="sm"><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
              </div>
            </div>
            <div className="p-16 text-center">
              <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mx-auto mb-4">
                <Workflow className="w-10 h-10 text-indigo-500" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">No workflows yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first automated workflow to streamline business processes and save time.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/wavecore-erp/automation/workflows/create">
                  <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4" /> Create First Workflow
                  </Button>
                </Link>
                <Button variant="outline">
                  <Layers className="w-4 h-4 mr-1" /> Browse Templates
                </Button>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
              <Repeat className="w-8 h-8 text-blue-500 mb-3" />
              <h3 className="font-bold mb-1">Recurring Tasks</h3>
              <p className="text-sm text-muted-foreground">Schedule workflows to run automatically at set intervals</p>
            </div>
            <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
              <Users className="w-8 h-8 text-green-500 mb-3" />
              <h3 className="font-bold mb-1">Approval Chains</h3>
              <p className="text-sm text-muted-foreground">Multi-level approval workflows with managers and directors</p>
            </div>
            <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
              <Globe className="w-8 h-8 text-purple-500 mb-3" />
              <h3 className="font-bold mb-1">API Integration</h3>
              <p className="text-sm text-muted-foreground">Connect with external services via webhooks and APIs</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}