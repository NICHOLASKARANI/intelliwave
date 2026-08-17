'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FileText, Search, Download, Trash2, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DocumentsSubPage() {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/wavecore/documents').then(r => r.json()).then(d => setDocuments(d.documents || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = documents.filter(d => d.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/documents" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <Link href="/wavecore-erp/documents" className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="w-4 h-4" /> Documents</Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Documents</h1>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl border text-sm w-full" placeholder="Search..." />
        </div>
        {loading ? <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-500" /></div> :
          filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map(d => (
                <div key={d.id} className="p-4 rounded-xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-cyan-500" />
                    <div><p className="font-medium">{d.name}</p><p className="text-xs text-muted-foreground">{d.type}</p></div>
                  </div>
                  <a href={d.url} target="_blank" className="p-2 text-blue-500"><Download className="w-4 h-4" /></a>
                </div>
              ))}
            </div>
          ) : <p className="text-center py-12 text-muted-foreground">No documents found</p>
        }
      </main>
    </div>
  )
}