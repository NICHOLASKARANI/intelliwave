import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { LayoutDashboard, Plus, Search, Filter, Users, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Leads - WaveCore ERP | IntelliWavve',
  description: 'Manage sales leads in WaveCore ERP.',
}

export default function LeadsPage() {
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
            <span className="text-sm font-medium">Leads</span>
          </div>
          <Link href="/wavecore-erp/crm" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted">
            <LayoutDashboard className="w-4 h-4" /> CRM Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Leads</h1>
            <p className="text-muted-foreground mt-1">Manage your sales leads</p>
          </div>
          <Link href="/wavecore-erp/crm/leads/create">
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Lead</Button>
          </Link>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-bold">All Leads</h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" placeholder="Search leads..." className="pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48" />
              </div>
              <Button variant="outline" size="sm"><Filter className="w-4 h-4" /></Button>
            </div>
          </div>
          <div className="p-12 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No leads yet</p>
            <p className="text-sm mt-1">Create your first lead to start building your pipeline.</p>
            <Link href="/wavecore-erp/crm/leads/create" className="inline-block mt-4">
              <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Add Lead</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}