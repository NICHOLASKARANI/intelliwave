import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { 
  LayoutDashboard, FileText, TrendingUp, DollarSign, 
  Calculator, Download, ArrowRight, BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Financial Reports - WaveCore ERP | IntelliWavve',
  description: 'Financial statements, reports, and analytics.',
}

const reports = [
  { icon: Calculator, title: 'Trial Balance', desc: 'Summary of all account balances', href: '/wavecore-erp/finance/gl/trial-balance', color: 'from-blue-500 to-cyan-500' },
  { icon: TrendingUp, title: 'Income Statement', desc: 'Profit & Loss Statement', href: '/wavecore-erp/finance/gl/income-statement', color: 'from-green-500 to-emerald-500' },
  { icon: DollarSign, title: 'Balance Sheet', desc: 'Statement of Financial Position', href: '/wavecore-erp/finance/gl/balance-sheet', color: 'from-purple-500 to-pink-500' },
  { icon: BarChart3, title: 'Cash Flow Statement', desc: 'Cash inflows and outflows', href: '/wavecore-erp/finance/reports/cash-flow', color: 'from-orange-500 to-red-500' },
  { icon: FileText, title: 'Aging Receivables', desc: 'Customer payment aging', href: '/wavecore-erp/finance/ar/aging', color: 'from-indigo-500 to-blue-500' },
  { icon: FileText, title: 'Aging Payables', desc: 'Supplier payment aging', href: '/wavecore-erp/finance/ap/aging', color: 'from-teal-500 to-green-500' },
  { icon: TrendingUp, title: 'Budget vs Actual', desc: 'Compare budget to actuals', href: '/wavecore-erp/finance/reports/budget-vs-actual', color: 'from-pink-500 to-rose-500' },
  { icon: Calculator, title: 'General Ledger', desc: 'Full transaction listing', href: '/wavecore-erp/finance/gl', color: 'from-cyan-500 to-blue-500' },
]

export default function FinancialReportsPage() {
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
            <span className="text-sm font-medium">Financial Reports</span>
          </div>
          <Link href="/wavecore-erp" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Financial Reports</h1>
          <p className="text-muted-foreground mt-1">Generate and export financial statements and reports</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reports.map((report) => {
            const Icon = report.icon
            return (
              <Link key={report.title} href={report.href}
                className="group p-6 rounded-2xl border bg-white dark:bg-neutral-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg transition-all">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${report.color} p-2.5 mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-full h-full text-white" />
                </div>
                <h3 className="font-bold text-neutral-900 dark:text-white mb-1">{report.title}</h3>
                <p className="text-xs text-muted-foreground">{report.desc}</p>
                <div className="flex items-center gap-1 mt-3 text-indigo-600 text-sm font-medium">
                  View Report <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}