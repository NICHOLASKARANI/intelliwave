import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { LayoutDashboard, Download, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Balance Sheet - WaveCore ERP | IntelliWavve',
  description: 'View balance sheet in WaveCore ERP.',
}

export default function BalanceSheetPage() {
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
            <span className="text-sm font-medium">Balance Sheet</span>
          </div>
          <Link href="/wavecore-erp" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Balance Sheet</h1>
            <p className="text-muted-foreground mt-1">Statement of Financial Position</p>
          </div>
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Export PDF</Button>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden shadow-sm">
          <div className="p-12 text-center text-muted-foreground">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Balance sheet will appear here</p>
            <p className="text-sm mt-1">Post journal entries to generate your balance sheet.</p>
          </div>
        </div>
      </main>
    </div>
  )
}