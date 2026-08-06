import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { LayoutDashboard, Calculator, FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Trial Balance - WaveCore ERP | IntelliWavve',
  description: 'View trial balance report in WaveCore ERP.',
}

export default function TrialBalancePage() {
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
            <span className="text-sm font-medium">Trial Balance</span>
          </div>
          <Link href="/wavecore-erp" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white dark:bg-neutral-900 border-r min-h-[calc(100vh-64px)] p-4 hidden lg:block">
          <Link href="/wavecore-erp/finance/gl" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted mb-6">
            ← Back to General Ledger
          </Link>
          <nav className="space-y-1">
            {[
              { icon: Calculator, label: 'Dashboard', href: '/wavecore-erp/finance/gl' },
              { icon: FileText, label: 'Journal Entries', href: '/wavecore-erp/finance/journal' },
              { icon: Calculator, label: 'Trial Balance', href: '/wavecore-erp/finance/gl/trial-balance', active: true },
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
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Trial Balance</h1>
              <p className="text-muted-foreground mt-1">Summary of all account balances</p>
            </div>
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Export PDF</Button>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden shadow-sm">
            <div className="grid grid-cols-3 gap-4 p-6 border-b">
              {[
                { label: 'Total Debits', value: 'KSh 0.00' },
                { label: 'Total Credits', value: 'KSh 0.00' },
                { label: 'Difference', value: 'KSh 0.00' },
              ].map((item) => (
                <div key={item.label} className="text-center p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                  <div className="text-sm text-muted-foreground">{item.label}</div>
                  <div className="text-xl font-bold text-neutral-900 dark:text-white mt-1">{item.value}</div>
                </div>
              ))}
            </div>
            <div className="p-12 text-center text-muted-foreground">
              <Calculator className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Trial balance will appear here</p>
              <p className="text-sm mt-1">Post journal entries to generate your trial balance.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}