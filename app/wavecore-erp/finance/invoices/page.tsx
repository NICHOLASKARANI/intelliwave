import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Plus, Search, Filter, LayoutDashboard, Calculator, FileText, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Invoices - WaveCore ERP | IntelliWavve',
  description: 'Manage customer invoices in WaveCore ERP.',
}

export default function InvoicesPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
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
          <Link href="/wavecore-erp" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white dark:bg-neutral-900 border-r min-h-[calc(100vh-64px)] p-4 hidden lg:block">
          <Link href="/wavecore-erp/finance" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Finance
          </Link>
          <nav className="space-y-1">
            <Link href="/wavecore-erp/finance" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-neutral-700 dark:text-neutral-300 hover:bg-muted transition-colors">
              <Calculator className="w-4 h-4" /> Chart of Accounts
            </Link>
            <Link href="/wavecore-erp/finance/invoices" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-sm font-semibold shadow-sm">
              <Receipt className="w-5 h-5" /> Invoices
            </Link>
          </nav>
        </aside>

        <main className="flex-1 p-4 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Invoices</h1>
              <p className="text-muted-foreground mt-1">Manage customer invoices</p>
            </div>
            <Link href="/wavecore-erp/finance/invoices/create">
              <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Create Invoice</Button>
            </Link>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold text-neutral-900 dark:text-white">All Invoices</h2>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" placeholder="Search invoices..." className="pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48" />
                </div>
                <Button variant="outline" size="sm"><Filter className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="p-12 text-center text-muted-foreground">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No invoices yet</p>
              <p className="text-sm mt-1">Create your first invoice to get started.</p>
              <Link href="/wavecore-erp/finance/invoices/create" className="inline-block mt-4">
                <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Create Invoice</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}