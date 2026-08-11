import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { 
  LayoutDashboard, Settings, Search, Bell, ChevronDown, Plus,
  TrendingUp, DollarSign, Receipt, CreditCard, Users, Package,
  Calculator, FileText, BarChart3, Bot, Workflow, Globe,
  ArrowRight, Sparkles, Activity, Clock, Target, Zap, Shield,
  Building2, Factory, Briefcase, FolderKanban, HeadphonesIcon,
  ArrowUpRight, ArrowDownRight, Filter, Download,
  ChevronRight, Wrench, Truck, Store, Plane,
  Ship, HardHat, Stethoscope, GraduationCap, Heart, Landmark,
  Scale, ShoppingCart, Dumbbell, Scissors, CheckCircle,
  Cloud, Server, Database, HardDrive, Layers
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'WaveCore ERP - Enterprise Business Operating System | IntelliWavve',
  description: 'WaveCore ERP — Complete enterprise business operating system. Finance, CRM, Inventory, Manufacturing, HR, Projects, Helpdesk, AI Copilot, and more.',
  keywords: ['ERP', 'Enterprise', 'Business', 'Finance', 'CRM', 'Inventory', 'Manufacturing', 'HR', 'AI'],
}

const executiveKPIs = [
  { label: 'Revenue (MTD)', value: 'KSh 0.00', change: '+0%', trend: 'up', icon: TrendingUp, color: 'from-emerald-500 to-green-500', bg: 'bg-emerald-50 dark:bg-emerald-950', textColor: 'text-emerald-600', insight: 'vs. previous month' },
  { label: 'Outstanding Receivables', value: 'KSh 0.00', change: '0 overdue', trend: 'neutral', icon: DollarSign, color: 'from-orange-500 to-red-500', bg: 'bg-orange-50 dark:bg-orange-950', textColor: 'text-orange-600', insight: '0 invoices pending' },
  { label: 'Accounts Payable', value: 'KSh 0.00', change: '0 due', trend: 'neutral', icon: CreditCard, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50 dark:bg-blue-950', textColor: 'text-blue-600', insight: '0 bills pending' },
  { label: 'Bank Balance', value: 'KSh 0.00', change: 'Updated', trend: 'up', icon: Building2, color: 'from-purple-500 to-pink-500', bg: 'bg-purple-50 dark:bg-purple-950', textColor: 'text-purple-600', insight: 'Across all accounts' },
  { label: 'Gross Profit', value: 'KSh 0.00', change: '+0%', trend: 'up', icon: TrendingUp, color: 'from-green-500 to-emerald-500', bg: 'bg-green-50 dark:bg-green-950', textColor: 'text-green-600', insight: 'Revenue - COGS' },
  { label: 'Net Profit', value: 'KSh 0.00', change: '+0%', trend: 'up', icon: BarChart3, color: 'from-indigo-500 to-blue-500', bg: 'bg-indigo-50 dark:bg-indigo-950', textColor: 'text-indigo-600', insight: 'After all expenses' },
  { label: 'Active Customers', value: '0', change: '0 new', trend: 'neutral', icon: Users, color: 'from-teal-500 to-green-500', bg: 'bg-teal-50 dark:bg-teal-950', textColor: 'text-teal-600', insight: 'Customer database' },
  { label: 'Inventory Value', value: 'KSh 0.00', change: '0 items', trend: 'neutral', icon: Package, color: 'from-rose-500 to-pink-500', bg: 'bg-rose-50 dark:bg-rose-950', textColor: 'text-rose-600', insight: 'Stock on hand' },
  { label: 'Open Tasks', value: '0', change: '0 due', trend: 'neutral', icon: Activity, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950', textColor: 'text-amber-600', insight: 'Across all projects' },
  { label: 'System Status', value: 'Online', change: '99.9%', trend: 'up', icon: Zap, color: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-50 dark:bg-cyan-950', textColor: 'text-cyan-600', insight: 'All systems operational' },
  { label: 'Journal Entries', value: '0', change: 'MTD', trend: 'neutral', icon: FileText, color: 'from-violet-500 to-purple-500', bg: 'bg-violet-50 dark:bg-violet-950', textColor: 'text-violet-600', insight: 'Financial transactions' },
  { label: 'Pending Approvals', value: '0', change: 'None', trend: 'neutral', icon: CheckCircle, color: 'from-red-500 to-rose-500', bg: 'bg-red-50 dark:bg-red-950', textColor: 'text-red-600', insight: 'Workflow approvals' },
]

const modules = [
  { icon: Calculator, title: 'Finance & Accounting', desc: 'GL, AP/AR, Bank Rec, Budgets, Reports, Tax Management', href: '/wavecore-erp/finance', status: 'active', color: 'from-emerald-500 to-green-500', bg: 'bg-emerald-50 dark:bg-emerald-950', submodules: ['Chart of Accounts', 'Journal Entries', 'Invoices', 'Payments', 'Bank Reconciliation', 'Trial Balance', 'Income Statement', 'Balance Sheet'] },
  { icon: Users, title: 'CRM & Sales', desc: 'Leads, Opportunities, Pipeline, Quotations, Sales Orders, Customer Portal', href: '/wavecore-erp/crm', status: 'active', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50 dark:bg-blue-950', submodules: ['Leads', 'Opportunities', 'Customers', 'Quotations', 'Sales Orders', 'Customer Portal'] },
  { icon: Package, title: 'Inventory & Warehouse', desc: 'Multi-Warehouse, Stock Movements, Barcode, Serial Numbers, Batch Tracking', href: '/wavecore-erp/inventory', status: 'active', color: 'from-orange-500 to-red-500', bg: 'bg-orange-50 dark:bg-orange-950', submodules: ['Warehouses', 'Stock Levels', 'Transfers', 'Adjustments', 'Cycle Counts'] },
  { icon: Factory, title: 'Manufacturing (MRP)', desc: 'Bill of Materials, Work Orders, Production Scheduling, Quality Control', href: '/wavecore-erp/manufacturing', status: 'active', color: 'from-purple-500 to-pink-500', bg: 'bg-purple-50 dark:bg-purple-950', submodules: ['BOM', 'Work Orders', 'Production Orders', 'Routing', 'Quality Checks'] },
  { icon: Briefcase, title: 'Human Resources', desc: 'Employees, Recruitment, Payroll, Attendance, Leave, Performance', href: '/wavecore-erp/hr', status: 'active', color: 'from-indigo-500 to-blue-500', bg: 'bg-indigo-50 dark:bg-indigo-950', submodules: ['Employees', 'Recruitment', 'Payroll', 'Attendance', 'Leave'] },
  { icon: FolderKanban, title: 'Projects', desc: 'Tasks, Kanban Boards, Gantt Charts, Time Tracking, Resource Planning', href: '/wavecore-erp/projects', status: 'active', color: 'from-teal-500 to-green-500', bg: 'bg-teal-50 dark:bg-teal-950', submodules: ['Projects', 'Tasks', 'Kanban', 'Gantt', 'Timesheets'] },
  { icon: HeadphonesIcon, title: 'Helpdesk', desc: 'Tickets, SLA Management, Knowledge Base, Live Chat, AI Chatbot', href: '/wavecore-erp/helpdesk', status: 'active', color: 'from-pink-500 to-rose-500', bg: 'bg-pink-50 dark:bg-pink-950', submodules: ['Tickets', 'SLA', 'Knowledge Base', 'Live Chat'] },
  { icon: FileText, title: 'Documents', desc: 'Document Storage, OCR, Version Control, Digital Signatures', href: '/wavecore-erp/documents', status: 'active', color: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-50 dark:bg-cyan-950', submodules: ['Storage', 'OCR', 'Version Control', 'E-Signatures'] },
  { icon: BarChart3, title: 'Business Intelligence', desc: 'Executive Dashboards, KPIs, Interactive Charts, AI Forecasting', href: '/wavecore-erp/analytics', status: 'active', color: 'from-violet-500 to-purple-500', bg: 'bg-violet-50 dark:bg-violet-950', submodules: ['Dashboards', 'Reports', 'KPIs', 'Forecasts'] },
  { icon: Bot, title: 'AI Copilot', desc: 'Natural Language Queries, AI Business Assistant, Smart Insights', href: '/wavecore-erp/ai', status: 'active', color: 'from-rose-500 to-pink-500', bg: 'bg-rose-50 dark:bg-rose-950', submodules: ['AI Assistant', 'Smart Search', 'Predictions'] },
  { icon: Workflow, title: 'Workflow Automation', desc: 'Visual Workflow Builder, Approval Chains, Business Rules', href: '/wavecore-erp/automation', status: 'coming', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950', submodules: ['Workflows', 'Approvals', 'Rules', 'Triggers'] },
  { icon: Globe, title: 'Website & Commerce', desc: 'Website Builder, CMS, E-Commerce, Product Pages, Checkout', href: '/wavecore-erp/website', status: 'coming', color: 'from-sky-500 to-blue-500', bg: 'bg-sky-50 dark:bg-sky-950', submodules: ['Website', 'CMS', 'E-Commerce', 'Checkout'] },
  { icon: Settings, title: 'Administration', desc: 'Users, Roles, Permissions, Companies, Branches, Localization', href: '/wavecore-erp/settings', status: 'active', color: 'from-gray-500 to-slate-500', bg: 'bg-gray-50 dark:bg-gray-950', submodules: ['Users', 'Roles', 'Permissions', 'Settings', 'Monitoring'] },
]

const quickActions = [
  { label: 'Create Invoice', href: '/wavecore-erp/finance/invoices/create', icon: FileText, shortcut: '⌘I', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950' },
  { label: 'Record Payment', href: '/wavecore-erp/finance/payments/create', icon: CreditCard, shortcut: '⌘P', color: 'text-green-600 bg-green-50 dark:bg-green-950' },
  { label: 'New Journal Entry', href: '/wavecore-erp/finance/journal/create', icon: Calculator, shortcut: '⌘J', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950' },
  { label: 'Bank Reconciliation', href: '/wavecore-erp/finance/reconciliation', icon: Building2, shortcut: '⌘R', color: 'text-orange-600 bg-orange-50 dark:bg-orange-950' },
  { label: 'Add Customer', href: '/wavecore-erp/crm/customers/create', icon: Users, shortcut: '⌘C', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950' },
  { label: 'Add Lead', href: '/wavecore-erp/crm/leads/create', icon: Target, shortcut: '⌘L', color: 'text-teal-600 bg-teal-50 dark:bg-teal-950' },
  { label: 'View Reports', href: '/wavecore-erp/finance/reports', icon: BarChart3, shortcut: '⌘R', color: 'text-violet-600 bg-violet-50 dark:bg-violet-950' },
  { label: 'System Settings', href: '/wavecore-erp/settings', icon: Settings, shortcut: '⌘S', color: 'text-gray-600 bg-gray-50 dark:bg-gray-950' },
]

const recentActivity = [
  { action: 'WaveCore ERP initialized', time: 'Just now', type: 'system', icon: Zap },
  { action: 'Chart of Accounts configured — 20 accounts ready', time: 'Just now', type: 'setup', icon: Calculator },
  { action: 'General Ledger module active', time: 'Just now', type: 'success', icon: CheckCircle },
  { action: 'CRM & Sales module ready', time: 'Just now', type: 'success', icon: Users },
  { action: 'Inventory & Warehouse module active', time: 'Just now', type: 'success', icon: Package },
  { action: 'Manufacturing (MRP) module active', time: 'Just now', type: 'success', icon: Factory },
  { action: 'Accounts Receivable module ready', time: 'Just now', type: 'success', icon: DollarSign },
  { action: 'Accounts Payable module ready', time: 'Just now', type: 'success', icon: CreditCard },
  { action: 'Financial Reports available', time: 'Just now', type: 'info', icon: BarChart3 },
  { action: 'Settings module active', time: 'Just now', type: 'success', icon: Settings },
]

const industries = [
  { icon: Landmark, name: 'Government' }, { icon: Heart, name: 'Healthcare' },
  { icon: GraduationCap, name: 'Education' }, { icon: Factory, name: 'Manufacturing' },
  { icon: Store, name: 'Retail' }, { icon: Truck, name: 'Logistics' },
  { icon: Building2, name: 'Real Estate' }, { icon: Plane, name: 'Aviation' },
  { icon: Ship, name: 'Shipping' }, { icon: Briefcase, name: 'Professional Services' },
  { icon: HardHat, name: 'Construction' }, { icon: ShoppingCart, name: 'E-Commerce' },
  { icon: Stethoscope, name: 'Medical' }, { icon: Scale, name: 'Legal' },
  { icon: Dumbbell, name: 'Fitness' }, { icon: Wrench, name: 'Automotive' },
]

const capabilities = ['Multi-Tenant SaaS', 'Multi-Company', 'Multi-Currency', 'Multi-Language', 'Multi-Warehouse', 'RBAC', 'Audit Logs', 'API Gateway', 'Webhooks', 'GraphQL API', 'REST API', 'SDK', 'White Label', 'Dark/Light Mode', 'SSO', 'MFA', 'Encryption', 'Automated Backups']

const systemHealth = [
  { name: 'Database', status: 'Online', icon: Database, color: 'text-green-500' },
  { name: 'API Server', status: 'Online', icon: Server, color: 'text-green-500' },
  { name: 'Storage', status: 'Online', icon: HardDrive, color: 'text-green-500' },
  { name: 'Cache', status: 'Online', icon: Zap, color: 'text-green-500' },
  { name: 'Queue', status: 'Online', icon: Layers, color: 'text-green-500' },
  { name: 'CDN', status: 'Online', icon: Globe, color: 'text-green-500' },
]

export default function WaveCoreERPPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3 group">
              <div className="relative w-11 h-11 rounded-xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-800 shadow-lg group-hover:shadow-xl group-hover:border-indigo-400 transition-all duration-300">
                <Image src="/images/Wavecore.jpeg" alt="WaveCore ERP" width={44} height={44} className="object-cover" priority />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-xl text-neutral-900 dark:text-white tracking-tight">WaveCore</span>
                <span className="ml-2 px-2 py-0.5 text-[10px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-semibold uppercase tracking-wider">ERP</span>
              </div>
            </Link>
            <span className="hidden lg:inline text-neutral-300 dark:text-neutral-700 mx-2">|</span>
            <span className="hidden lg:inline text-sm font-medium text-neutral-500">Enterprise Business Operating System</span>
          </div>
          <div className="hidden md:flex items-center gap-4 flex-1 max-w-xl mx-8">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-indigo-500 transition-colors" />
              <input type="text" placeholder="Search anything... (Ctrl+K)" className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-neutral-400" />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[10px] font-semibold text-neutral-400 bg-neutral-100 dark:bg-neutral-700 rounded-md border border-neutral-200 dark:border-neutral-600">⌘K</kbd>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"><Bell className="w-5 h-5 text-neutral-600 dark:text-neutral-400" /><span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-neutral-900 animate-pulse" /></button>
            <Link href="/wavecore-erp/settings" className="p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"><Settings className="w-5 h-5 text-neutral-600 dark:text-neutral-400" /></Link>
            <div className="flex items-center gap-2 pl-3 ml-1 border-l border-neutral-200 dark:border-neutral-700 cursor-pointer">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg ring-2 ring-indigo-100 dark:ring-indigo-900">IW</div>
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 min-h-[calc(100vh-64px)] p-4 hidden lg:block overflow-y-auto">
          <div className="mb-6">
            <Link href="/wavecore-erp" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 text-indigo-700 dark:text-indigo-300 text-sm font-semibold shadow-sm border border-indigo-100 dark:border-indigo-900"><LayoutDashboard className="w-5 h-5" /> Dashboard</Link>
          </div>
          <div className="space-y-1">
            <p className="px-4 text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Main Modules</p>
            {modules.map((mod) => {
              const Icon = mod.icon; const isActive = mod.status === 'active'
              return (
                <Link key={mod.title} href={isActive ? mod.href : '#'} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all group ${isActive ? 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer' : 'text-neutral-400 dark:text-neutral-600 cursor-not-allowed opacity-60'}`}>
                  <div className={`w-8 h-8 rounded-lg ${mod.bg} flex items-center justify-center flex-shrink-0`}><Icon className="w-4 h-4 text-indigo-600" /></div>
                  <span className="flex-1 truncate">{mod.title}</span>
                  {!isActive && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-500 font-medium">Soon</span>}
                  {isActive && <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </Link>
              )
            })}
          </div>
          <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <Link href="/" className="flex items-center gap-2 px-4 text-sm text-neutral-400 hover:text-indigo-600 transition-colors"><ArrowRight className="w-4 h-4" /> Back to IntelliWavve</Link>
          </div>
        </aside>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="relative rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 lg:p-10 mb-10 overflow-hidden shadow-2xl shadow-indigo-500/20">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
            <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2 tracking-tight">Welcome to WaveCore ERP</h2>
                <p className="text-white/80 text-sm lg:text-base max-w-2xl leading-relaxed">Your enterprise business operating system is ready. Finance, CRM, Inventory, Manufacturing, and Settings are active.</p>
                <div className="flex flex-wrap gap-3 mt-5">
                  <Link href="/wavecore-erp/finance"><Button className="bg-white text-indigo-700 hover:bg-gray-100 font-semibold shadow-lg group">Go to Finance <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" /></Button></Link>
                  <Link href="/wavecore-erp/crm"><Button variant="outline" className="border-white/30 text-white hover:bg-white/10 font-medium">Go to CRM <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
                  <Link href="/wavecore-erp/manufacturing"><Button variant="outline" className="border-white/30 text-white hover:bg-white/10 font-medium">Go to Manufacturing <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
                </div>
              </div>
              <div className="hidden lg:flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center"><Sparkles className="w-8 h-8 text-white" /></div>
                <div className="text-white/80 text-sm"><div className="font-bold text-white">v1.0</div><div>5 Modules Active</div></div>
              </div>
            </div>
          </div>

          <div className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">Executive Overview</h3>
              <div className="flex gap-2"><Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-1" /> Filter</Button><Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Export</Button></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {executiveKPIs.map((kpi) => { const Icon = kpi.icon; return (
                <div key={kpi.label} className="group p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300 cursor-default">
                  <div className="flex items-center justify-between mb-3"><div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}><Icon className={`w-5 h-5 ${kpi.textColor}`} /></div><div className={`flex items-center gap-1 text-xs font-semibold ${kpi.trend === 'up' ? 'text-green-500' : kpi.trend === 'down' ? 'text-red-500' : 'text-neutral-500'}`}>{kpi.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : kpi.trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}{kpi.change}</div></div>
                  <div className="text-xl lg:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">{kpi.value}</div>
                  <div className="text-xs text-neutral-500 mt-1">{kpi.label}</div>
                  <div className="text-[10px] text-neutral-400 mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">{kpi.insight}</div>
                </div>
              )})}
            </div>
          </div>

          <div className="mb-10">
            <h3 className="text-lg font-bold mb-5 text-neutral-900 dark:text-white tracking-tight">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickActions.map((action) => { const Icon = action.icon; return (
                <Link key={action.label} href={action.href} className="flex items-center gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${action.color}`}><Icon className="w-4 h-4" /></div>
                  <div className="flex-1"><span className="text-sm font-medium text-neutral-900 dark:text-white block">{action.label}</span><span className="text-[10px] text-neutral-400">{action.shortcut}</span></div>
                  <ArrowRight className="w-4 h-4 text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              )})}
            </div>
          </div>

          <div className="mb-10">
            <h3 className="text-lg font-bold mb-5 text-neutral-900 dark:text-white tracking-tight">System Health</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {systemHealth.map((sys) => { const Icon = sys.icon; return (
                <div key={sys.name} className="flex items-center gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                  <Icon className={`w-5 h-5 ${sys.color}`} /><div><p className="text-sm font-medium text-neutral-900 dark:text-white">{sys.name}</p><p className="text-xs text-green-500">{sys.status}</p></div>
                </div>
              )})}
            </div>
          </div>

          <div className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">All Modules</h3>
              <span className="text-xs text-neutral-500">{modules.filter(m => m.status === 'active').length} active • {modules.filter(m => m.status === 'coming').length} coming soon</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((mod) => { const Icon = mod.icon; const isActive = mod.status === 'active'; return (
                <Link key={mod.title} href={isActive ? mod.href : '#'} className={`group p-5 rounded-2xl border transition-all duration-300 ${isActive ? 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg cursor-pointer' : 'border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 opacity-60 cursor-not-allowed'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${mod.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}><Icon className="w-6 h-6 text-indigo-600" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1"><h3 className="font-bold text-neutral-900 dark:text-white text-sm">{mod.title}</h3>{isActive ? <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-semibold">Active</span> : <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-500 font-medium">Coming</span>}</div>
                      <p className="text-xs text-neutral-500 leading-relaxed mb-3">{mod.desc}</p>
                      <div className="flex flex-wrap gap-1">{mod.submodules.slice(0, 4).map((sub) => (<span key={sub} className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500">{sub}</span>))}{mod.submodules.length > 4 && (<span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-400">+{mod.submodules.length - 4} more</span>)}</div>
                    </div>
                  </div>
                </Link>
              )})}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-10">
            <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white tracking-tight">Industry Solutions</h3>
              <div className="grid grid-cols-4 gap-3">{industries.map((ind) => { const Icon = ind.icon; return (<div key={ind.name} className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-default"><Icon className="w-6 h-6 text-indigo-500" /><span className="text-[10px] text-neutral-500 text-center leading-tight">{ind.name}</span></div>)})}</div>
            </div>
            <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white tracking-tight">Platform Capabilities</h3>
              <div className="flex flex-wrap gap-2">{capabilities.map((cap) => (<span key={cap} className="text-[11px] px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-medium">{cap}</span>))}</div>
            </div>
            <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white tracking-tight">Recent Activity</h3>
              <div className="space-y-3">
                {recentActivity.map((activity, i) => { const Icon = activity.icon; return (
                  <div key={i} className="flex items-center gap-3 text-sm py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activity.type === 'system' ? 'bg-blue-50 dark:bg-blue-950' : activity.type === 'setup' ? 'bg-green-50 dark:bg-green-950' : activity.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950' : 'bg-neutral-100 dark:bg-neutral-800'}`}><Icon className={`w-4 h-4 ${activity.type === 'system' ? 'text-blue-600' : activity.type === 'setup' ? 'text-green-600' : activity.type === 'success' ? 'text-emerald-600' : 'text-neutral-500'}`} /></div>
                    <span className="flex-1 text-neutral-700 dark:text-neutral-300">{activity.action}</span><span className="text-xs text-neutral-400">{activity.time}</span>
                  </div>
                )})}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}