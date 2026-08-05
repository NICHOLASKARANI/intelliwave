import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, LayoutDashboard, Calculator, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Bank Reconciliation - WaveCore ERP | IntelliWavve',
  description: 'Reconcile bank statements in WaveCore ERP.',
}

export default function ReconciliationPage() {
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
            <Link href="/wavecore-erp/finance/reconciliation" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-sm font-semibold shadow-sm">
              <Building2 className="w-5 h-5" /> Bank Reconciliation
            </Link>
          </nav>
        </aside>

        <main className="flex-1 p-4 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Bank Reconciliation</h1>
              <p className="text-muted-foreground mt-1">Match your bank statements with your accounting records</p>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden shadow-sm">
            <div className="p-12 text-center text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No reconciliations yet</p>
              <p className="text-sm mt-1">Start your first bank reconciliation to match transactions.</p>
              <Link href="/wavecore-erp/finance/reconciliation/create" className="inline-block mt-4">
                <Button size="sm" className="gap-2">Start Reconciliation</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}