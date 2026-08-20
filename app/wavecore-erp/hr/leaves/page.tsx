'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Download, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/hr/attendance')
      .then(r => r.json())
      .then(d => setLeaves(d.leaves || d.attendance || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const pending = leaves.filter((l: any) => l.status === 'PENDING').length
  const approved = leaves.filter((l: any) => l.status === 'APPROVED').length

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Leave Management', '='.repeat(50), `Pending: ${pending}`, `Approved: ${approved}`, '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'leaves.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/hr" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Leave</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Calendar className="w-6 h-6 text-amber-500" /> Leave Management</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
        </div>
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950 text-center">
              <Clock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <p className="text-4xl font-extrabold text-amber-600">{pending}</p>
              <p className="text-sm">Pending</p>
            </div>
            <div className="p-6 rounded-2xl bg-green-50 dark:bg-green-950 text-center">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <p className="text-4xl font-extrabold text-green-600">{approved}</p>
              <p className="text-sm">Approved</p>
            </div>
            <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950 text-center">
              <XCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <p className="text-4xl font-extrabold text-red-600">0</p>
              <p className="text-sm">Rejected</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}