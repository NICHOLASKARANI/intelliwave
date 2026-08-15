'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, FileText, Download, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface JournalEntry {
  id: string
  number: string
  date: string
  reference: string
  description: string
  status: string
  amount: number
  createdAt: string
}

export default function JournalEntriesPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchEntries() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/gl/journal-entries')
      if (res.ok) {
        const data = await res.json()
        setEntries(data.entries || [])
      }
    } catch (err) {
      console.error('Failed to load entries:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  const formatKES = (amount: number) => 'KSh ' + (amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

  const handleExport = async () => {
    try {
      const res = await fetch('/api/wavecore/gl/journal-entries/export')
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'journal-entries.csv'
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
              <span className="font-bold">WaveCore</span>
            </Link>
            <span className="text-sm">Journal Entries</span>
          </div>
          <Link href="/wavecore-erp/finance" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Finance
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Journal Entries</h1>
            <p className="text-muted-foreground mt-1">All posted journal entries</p>
          </div>
          <div className="flex gap-2">
            {entries.length > 0 && (
              <Button variant="outline" onClick={handleExport} className="gap-2">
                <Download className="w-4 h-4" /> Export
              </Button>
            )}
            <Link href="/wavecore-erp/finance/journal/create">
              <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4" /> New Entry
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
          </div>
        ) : entries.length > 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                  <th className="text-left p-4">Entry #</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Description</th>
                  <th className="text-left p-4">Reference</th>
                  <th className="text-right p-4">Amount</th>
                  <th className="text-left p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <td className="p-4 font-medium">{entry.number}</td>
                    <td className="p-4">{entry.date ? new Date(entry.date).toLocaleDateString() : '-'}</td>
                    <td className="p-4">{entry.description}</td>
                    <td className="p-4 text-muted-foreground">{entry.reference || '-'}</td>
                    <td className="p-4 text-right font-medium">{formatKES(entry.amount)}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded-full">{entry.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No journal entries yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Post your first journal entry</p>
            <Link href="/wavecore-erp/finance/journal/create">
              <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4" /> Create Entry
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}