'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Layers, Download, Upload, FileText, X } from 'lucide-react'

export default function MergePage() {
  const [files, setFiles] = useState<string[]>([])
  const [merging, setMerging] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList) return
    Array.from(fileList).forEach(file => {
      setFiles(prev => [...prev, file.name])
    })
  }

  const handleMerge = () => {
    if (files.length < 2) return
    setMerging(true)
    setTimeout(() => {
      setMerging(false)
      alert('PDF merged successfully! (Demo - connect to server for real merge)')
    }, 2000)
  }

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Merge PDF', '='.repeat(50), `Files: ${files.join(', ')}`, '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'merged.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/documents" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Merge PDF</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-pink-600 to-rose-700 p-6 mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Layers className="w-7 h-7" /> Merge PDFs</h1>
          <p className="text-white/80 text-sm">Combine multiple PDFs into one</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <label className="block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer mb-4">
            <Upload className="w-12 h-12 mx-auto mb-3 text-neutral-400" />
            <p className="font-medium">Click to upload PDFs</p>
            <input type="file" accept=".pdf" multiple onChange={handleFileUpload} className="hidden" />
          </label>
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 mb-2">
              <FileText className="w-4 h-4 text-pink-500" />
              <span className="text-sm flex-1">{file}</span>
              <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-red-500"><X className="w-4 h-4" /></button>
            </div>
          ))}
          <button onClick={handleMerge} disabled={files.length < 2 || merging}
            className="w-full py-3 rounded-xl bg-pink-600 text-white font-bold disabled:opacity-50 mt-4">
            {merging ? 'Merging...' : `Merge ${files.length} PDFs`}
          </button>
        </div>
      </main>
    </div>
  )
}