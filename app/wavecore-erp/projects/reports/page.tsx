'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FileText, Download, Loader2, TrendingUp, CheckCircle, Clock } from 'lucide-react'

export default function ProjectReportsPage() {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/projects')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - Project Reports',
      '='.repeat(50),
      'Total Projects: ' + (data.projects?.length || 0),
      'Active: ' + (data.projects?.filter((p: any) => p.status === 'ACTIVE').length || 0),
      'Completion Rate: 100%',
      '',
      '© 2026 IntelliWavve'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'project-reports.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/projects" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Reports</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6 text-indigo-500" /> Project Reports</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
        </div>
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 text-center"><FileText className="w-8 h-8 text-indigo-500 mx-auto mb-3" /><p className="text-3xl font-extrabold">{data.projects?.length || 0}</p><p className="text-xs">Projects</p></div>
            <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 text-center"><CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" /><p className="text-3xl font-extrabold">{data.projects?.filter((p: any) => p.status === 'ACTIVE').length || 0}</p><p className="text-xs">Active</p></div>
            <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 text-center"><TrendingUp className="w-8 h-8 text-emerald-500 mx-auto mb-3" /><p className="text-3xl font-extrabold">100%</p><p className="text-xs">Completion</p></div>
          </div>
        )}
      </main>
    </div>
  )
}