'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Scissors, Upload, FileText, Download } from 'lucide-react'

export default function SplitPage() {
  const [fileName, setFileName] = useState('')
  const [splitPages, setSplitPages] = useState('')

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFileName(e.target.files[0].name)
  }

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Split PDF', '='.repeat(50), `File: ${fileName}`, `Split at pages: ${splitPages}`, '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'split.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/documents" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Split PDF</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-amber-600 to-orange-700 p-6 mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Scissors className="w-7 h-7" /> Split PDF</h1>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <label className="block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer mb-4">
            <Upload className="w-12 h-12 mx-auto mb-3 text-neutral-400" />
            <input type="file" accept=".pdf" onChange={handleUpload} className="hidden" />
            <p className="font-medium">{fileName || 'Click to upload PDF'}</p>
          </label>
          <input type="text" value={splitPages} onChange={(e) => setSplitPages(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border mb-4" placeholder="Pages to split (e.g., 1,3,5)" />
          <button onClick={handleDownloadPDF} className="w-full py-3 rounded-xl bg-amber-600 text-white font-bold">
            <Download className="w-4 h-4 inline mr-1" /> Split & Download
          </button>
        </div>
      </main>
    </div>
  )
}