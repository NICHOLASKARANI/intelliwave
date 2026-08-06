import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { 
  LayoutDashboard, Calculator, FileText, Plus, TrendingUp, 
  DollarSign, CreditCard, Building2, ArrowUpRight, ArrowDownRight,
  Activity, Search, Filter, Download, ChevronDown, Bell
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'General Ledger - WaveCore ERP | IntelliWavve',
  description: 'Complete general ledger with journal entries, trial balance, and financial statements.',
}

const kpiData = [
  { label: 'Total Debits (MTD)', value: '0.00', change: '+0%', trend: 'up', icon: ArrowUpRight, color: 'text-green-500' },
  { label: 'Total Credits (MTD)', value: '0.00', change: '+0%', trend: 'down', icon: ArrowDownRight, color: 'text-red-500' },
  { label: 'Journal Entries', value: '0', change: 'This month', icon: FileText, color: 'text-blue-500' },
  { label: 'Pending Review', value: '0', change: 'Requires attention', icon: Activity, color: 'text-orange-500' },
]

export default function GeneralLedgerPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-800 shadow-lg">
                <Image src="/images/Wavecore.jpeg" alt="WaveCore ERP" width={40} height={40} className="object-cover" priority />
              </div>
              <div>
                <span className="font-bold text-xl text-neutral-900 dark:text-white">WaveCore</span>
                <span className="ml-2 px-2 py-0.5 text-[10px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-medium">ERP</span>
              </div>
            </Link>
            <span className="text-neutral-300 dark:text-neutral-700">/</span>
            <span className="text-sm font-medium text-neutral-900 dark:text-white">General Ledger</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/wavecore-erp" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-neutral-900 border-r min-h-[calc(100vh-64px)] p-4 hidden lg:block">
          <div className="mb-6">
            <Link href="/wavecore-erp/finance" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
              ← Back to Finance
            </Link>
          </div>
          <p className="px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">General Ledger</p>
          <nav className="space-y-1">
            {[
              { icon: Calculator, label: 'Dashboard', href: '/wavecore-erp/finance/gl', active: true },
              { icon: FileText, label: 'Journal Entries', href: '/wavecore-erp/finance/journal' },
              { icon: Building2, label: 'Chart of Accounts', href: '/wavecore-erp/finance' },
              { icon: TrendingUp, label: 'Trial Balance', href: '/wavecore-erp/finance/gl/trial-balance' },
              { icon: DollarSign, label: 'Income Statement', href: '/wavecore-erp/finance/gl/income-statement' },
              { icon: CreditCard, label: 'Balance Sheet', href: '/wavecore-erp/finance/gl/balance-sheet' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.label} href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                    item.active 
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
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">General Ledger</h1>
              <p className="text-muted-foreground mt-1">Complete view of all financial transactions</p>
            </div>
            <div className="flex gap-3">
              <Link href="/wavecore-erp/finance/journal/create">
                <Button className="gap-2"><Plus className="w-4 h-4" /> New Journal Entry</Button>
              </Link>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {kpiData.map((kpi) => {
              const Icon = kpi.icon
              return (
                <div key={kpi.label} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <Icon className={`w-5 h-5 ${kpi.color}`} />
                    <span className={`text-xs font-medium ${kpi.trend === 'up' ? 'text-green-500' : 'text-neutral-500'}`}>
                      {kpi.change}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">{kpi.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
                </div>
              )
            })}
          </div>

          {/* Recent Journal Entries */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold text-neutral-900 dark:text-white">Recent Journal Entries</h2>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" placeholder="Search entries..." className="pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48" />
                </div>
                <Button variant="outline" size="sm"><Filter className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm"><Download className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="p-12 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No journal entries yet</p>
              <p className="text-sm mt-1">Create your first journal entry to begin recording financial transactions.</p>
              <Link href="/wavecore-erp/finance/journal/create" className="inline-block mt-4">
                <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> New Journal Entry</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}