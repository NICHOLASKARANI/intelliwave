import { Metadata } from 'next'
import Link from 'next/link'
import { 
  ArrowLeft, Plus, Search, Filter, Download, Upload,
  FileText, Calculator, Building2, CreditCard, Receipt
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Finance & Accounting - WaveCore ERP',
  description: 'General ledger, accounts payable, accounts receivable, bank reconciliation, budgets, and financial reports.',
}

const accounts = [
  { code: '1000', name: 'Cash', type: 'Asset', balance: 'KSh 0.00' },
  { code: '1100', name: 'Bank Account', type: 'Asset', balance: 'KSh 0.00' },
  { code: '1200', name: 'Accounts Receivable', type: 'Asset', balance: 'KSh 0.00' },
  { code: '2000', name: 'Accounts Payable', type: 'Liability', balance: 'KSh 0.00' },
  { code: '3000', name: 'Share Capital', type: 'Equity', balance: 'KSh 0.00' },
  { code: '4000', name: 'Sales Revenue', type: 'Income', balance: 'KSh 0.00' },
  { code: '5000', name: 'Cost of Goods Sold', type: 'Expense', balance: 'KSh 0.00' },
  { code: '6000', name: 'Operating Expenses', type: 'Expense', balance: 'KSh 0.00' },
]

const quickLinks = [
  { icon: FileText, label: 'Journal Entries', href: '/wavecore-erp/finance/journal' },
  { icon: Receipt, label: 'Invoices', href: '/wavecore-erp/finance/invoices' },
  { icon: CreditCard, label: 'Payments', href: '/wavecore-erp/finance/payments' },
  { icon: Building2, label: 'Bank Reconciliation', href: '/wavecore-erp/finance/reconciliation' },
  { icon: Calculator, label: 'Budget', href: '/wavecore-erp/finance/budget' },
  { icon: FileText, label: 'Reports', href: '/wavecore-erp/finance/reports' },
]

export default function FinancePage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="flex">
        {/* Sidebar (same as dashboard) */}
        <aside className="w-60 bg-white dark:bg-neutral-900 border-r min-h-screen p-4 hidden lg:block">
          <nav className="space-y-1">
            <Link href="/wavecore-erp" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-600 dark:text-neutral-400 hover:bg-muted">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <div className="pt-4 mt-4 border-t">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Finance</p>
              {quickLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link key={link.label} href={link.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-700 dark:text-neutral-300 hover:bg-muted transition-colors">
                    <Icon className="w-4 h-4" /> {link.label}
                  </Link>
                )
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Finance & Accounting</h1>
              <p className="text-muted-foreground mt-1">Chart of Accounts • General Ledger</p>
            </div>
            <div className="flex gap-3">
              <Link href="/wavecore-erp/finance/journal/create">
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" /> New Entry
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {quickLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link key={link.label} href={link.href}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-white dark:bg-neutral-900 hover:border-indigo-300 hover:shadow-md transition-all text-center">
                  <Icon className="w-6 h-6 text-indigo-600" />
                  <span className="text-sm font-medium">{link.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Chart of Accounts Table */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold text-neutral-900 dark:text-white">Chart of Accounts</h2>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" placeholder="Search accounts..." className="pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48" />
                </div>
                <Button variant="outline" size="sm"><Filter className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm"><Download className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                    <th className="text-left p-4 font-medium">Code</th>
                    <th className="text-left p-4 font-medium">Account Name</th>
                    <th className="text-left p-4 font-medium">Type</th>
                    <th className="text-right p-4 font-medium">Balance</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.code} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4 font-mono text-indigo-600">{account.code}</td>
                      <td className="p-4 text-neutral-900 dark:text-white">{account.name}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-neutral-100 dark:bg-neutral-800">{account.type}</span>
                      </td>
                      <td className="p-4 text-right font-mono">{account.balance}</td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm">View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}