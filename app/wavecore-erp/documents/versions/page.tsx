'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { GitBranch, Plus, History, ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function VersionsPage() {
  const [versions, setVersions] = useState<any[]>([
    { id: '1', docName: 'Contract.pdf', version: 'v3', date: '2026-08-17', author: 'Nicholas', change: 'Updated terms and conditions' },
    { id: '2', docName: 'Contract.pdf', version: 'v2', date: '2026-08-15', author: 'Nicholas', change: 'Added pricing details' },
    { id: '3', docName: 'Contract.pdf', version: 'v1', date: '2026-08-10', author: 'Nicholas', change: 'Initial document' },
  ])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/documents" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <Link href="/wavecore-erp/documents" className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="w-4 h-4" /> Back</Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><GitBranch className="w-6 h-6 text-purple-500" /> Version Control</h1>

        <div className="space-y-4">
          {versions.map(v => (
            <div key={v.id} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-bold">{v.version}</span>
                  <p className="font-medium">{v.docName}</p>
                </div>
                <span className="text-xs text-muted-foreground">{v.date}</span>
              </div>
              <p className="text-sm text-muted-foreground">{v.change}</p>
              <p className="text-xs text-muted-foreground mt-2">By {v.author}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-xl bg-green-50 dark:bg-green-950 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm">Version history automatically tracked for all documents</p>
        </div>
      </main>
    </div>
  )
}