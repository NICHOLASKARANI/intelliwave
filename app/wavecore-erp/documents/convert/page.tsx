'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { RefreshCw, Upload, Download } from 'lucide-react'

export default function ConvertPage() {
  const [fileName, setFileName] = useState('')
  const [targetFormat, setTargetFormat] = useState('PDF')

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFileName(e.target.files[0].name)
  }

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Convert', '='.repeat(50), `File: ${fileName}`, `Target: ${targetFormat}`, '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'convert.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/documents" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Convert</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-700 p-6 mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><RefreshCw className="w-7 h-7" /> Convert Document</h1>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <label className="block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer mb-4">
            <Upload className="w-12 h-12 mx-auto mb-3 text-neutral-400" />
            <input type="file" onChange={handleUpload} className="hidden" />
            <p className="font-medium">{fileName || 'Click to upload file'}</p>
          </label>
          <select value={targetFormat} onChange={(e) => setTargetFormat(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border mb-4">
            <option>PDF</option><option>DOCX</option><option>JPG</option><option>PNG</option><option>TXT</option>
          </select>
          <button onClick={handleDownloadPDF} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold">
            Convert to {targetFormat}
          </button>
        </div>
      </main>
    </div>
  )
}