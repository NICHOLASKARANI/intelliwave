import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { 
  ArrowLeft, Plus, Search, Filter, Download, Upload,
  FileText, Calculator, Building2, CreditCard, Receipt,
  ChevronDown, TrendingUp, DollarSign, LayoutDashboard,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Finance & Accounting - WaveCore ERP | IntelliWavve',
  description: 'General ledger, accounts payable, accounts receivable, bank reconciliation, budgets, and financial reports.',
}

const accounts = [
  { code: '1000', name: 'Cash', type: 'Asset', balance: '0.00' },
  { code: '1100', name: 'Bank Account - KCB', type: 'Asset', balance: '0.00' },
  { code: '1101', name: 'Bank Account - Equity', type: 'Asset', balance: '0.00' },
  { code: '1102', name: 'M-Pesa Account', type: 'Asset', balance: '0.00' },
  { code: '1200', name: 'Accounts Receivable', type: 'Asset', balance: '0.00' },
  { code: '1300', name: 'Inventory', type: 'Asset', balance: '0.00' },
  { code: '1400', name: 'Fixed Assets', type: 'Asset', balance: '0.00' },
  { code: '1500', name: 'Accumulated Depreciation', type: 'Asset', balance: '0.00' },
  { code: '2000', name: 'Accounts Payable', type: 'Liability', balance: '0.00' },
  { code: '2100', name: 'VAT Payable', type: 'Liability', balance: '0.00' },
  { code: '2200', name: 'PAYE Payable', type: 'Liability', balance: '0.00' },
  { code: '3000', name: 'Share Capital', type: 'Equity', balance: '0.00' },
  { code: '3100', name: 'Retained Earnings', type: 'Equity', balance: '0.00' },
  { code: '4000', name: 'Sales Revenue', type: 'Income', balance: '0.00' },
  { code: '4100', name: 'Service Revenue', type: 'Income', balance: '0.00' },
  { code: '5000', name: 'Cost of Goods Sold', type: 'Expense', balance: '0.00' },
  { code: '6000', name: 'Salaries & Wages', type: 'Expense', balance: '0.00' },
  { code: '6100', name: 'Rent Expense', type: 'Expense', balance: '0.00' },
  { code: '6200', name: 'Utilities', type: 'Expense', balance: '0.00' },
  { code: '6300', name: 'Marketing', type: 'Expense', balance: '0.00' },
]

const quickLinks = [
  { icon: FileText, label: 'Journal Entries', desc: 'Record financial transactions', href: '/wavecore-erp/finance/journal' },
  { icon: Receipt, label: 'Invoices', desc: 'Manage customer invoices', href: '/wavecore-erp/finance/invoices' },
  { icon: CreditCard, label: 'Payments', desc: 'Record and track payments', href: '/wavecore-erp/finance/payments' },
  { icon: Building2, label: 'Bank Reconciliation', desc: 'Match bank statements', href: '/wavecore-erp/finance/reconciliation' },
  { icon: Calculator, label: 'Budget', desc: 'Plan and track budgets', href: '/wavecore-erp/finance/budget' },
  { icon: TrendingUp, label: 'Reports', desc: 'Financial statements & reports', href: '/wavecore-erp/finance/reports' },
]

export default function FinancePage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-800 shadow-lg">
                <Image src="/images/Wavecore.jpeg" alt="WaveCore ERP" width={40} height={40} className="object-cover" priority />
              </div>
              <span className="font-bold text-xl text-neutral-900 dark:text-white">WaveCore</span>
              <span className="px-2 py-0.5 text-[10px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-medium">ERP</span>
            </Link>
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
          <Link href="/wavecore-erp" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <p className="px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Finance</p>
          <nav className="space-y-1">
            <Link href="/wavecore-erp/finance" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-sm font-semibold shadow-sm">
              <Calculator className="w-5 h-5" /> Chart of Accounts
            </Link>
            {quickLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link key={link.label} href={link.href}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-neutral-700 dark:text-neutral-300 hover:bg-muted transition-colors">
                  <Icon className="w-4 h-4" /> {link.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Finance & Accounting</h1>
              <p className="text-muted-foreground mt-1">Chart of Accounts • Manage your general ledger</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm"><Upload className="w-4 h-4 mr-1" /> Import</Button>
              <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Export</Button>
              <Link href="/wavecore-erp/finance/journal/create">
                <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> New Entry</Button>
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {quickLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link key={link.label} href={link.href}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-white dark:bg-neutral-900 hover:border-indigo-300 hover:shadow-md transition-all text-center">
                  <Icon className="w-6 h-6 text-indigo-600" />
                  <span className="text-sm font-medium">{link.label}</span>
                  <span className="text-[10px] text-muted-foreground">{link.desc}</span>
                </Link>
              )
            })}
          </div>

          {/* Chart of Accounts Table */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold text-neutral-900 dark:text-white">Chart of Accounts</h2>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" placeholder="Search accounts..." className="pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48" />
                </div>
                <Button variant="outline" size="sm"><Filter className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                    <th className="text-left p-4 font-semibold">Code</th>
                    <th className="text-left p-4 font-semibold">Account Name</th>
                    <th className="text-left p-4 font-semibold">Type</th>
                    <th className="text-right p-4 font-semibold">Balance (KSh)</th>
                    <th className="text-center p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.code} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4 font-mono text-indigo-600 dark:text-indigo-400 font-medium">{account.code}</td>
                      <td className="p-4 text-neutral-900 dark:text-white">{account.name}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          account.type === 'Asset' ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300' :
                          account.type === 'Liability' ? 'bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300' :
                          account.type === 'Equity' ? 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300' :
                          account.type === 'Income' ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300' :
                          'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
                        }`}>{account.type}</span>
                      </td>
                      <td className="p-4 text-right font-mono">{account.balance}</td>
                      <td className="p-4 text-center">
                        <Button variant="ghost" size="sm">View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between p-4 border-t text-sm text-muted-foreground">
              <span>Showing {accounts.length} accounts</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <Button variant="outline" size="sm">Next</Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}