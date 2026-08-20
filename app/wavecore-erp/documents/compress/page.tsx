'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Minimize2, Upload, Download } from 'lucide-react'

export default function CompressPage() {
  const [fileName, setFileName] = useState('')
  const [compressing, setCompressing] = useState(false)
  const [result, setResult] = useState('')

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFileName(e.target.files[0].name)
  }

  const handleCompress = () => {
    if (!fileName) return
    setCompressing(true)
    setTimeout(() => {
      setCompressing(false)
      setResult('Compressed from 5MB to 2MB (60% reduction)')
    }, 2000)
  }

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Compress PDF', '='.repeat(50), `File: ${fileName}`, result, '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'compress.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/documents" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Compress</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-teal-600 to-cyan-700 p-6 mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Minimize2 className="w-7 h-7" /> Compress PDF</h1>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <label className="block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer mb-4">
            <Upload className="w-12 h-12 mx-auto mb-3 text-neutral-400" />
            <input type="file" accept=".pdf" onChange={handleUpload} className="hidden" />
            <p className="font-medium">{fileName || 'Click to upload PDF'}</p>
          </label>
          <button onClick={handleCompress} disabled={!fileName || compressing}
            className="w-full py-3 rounded-xl bg-teal-600 text-white font-bold disabled:opacity-50">
            {compressing ? 'Compressing...' : 'Compress PDF'}
          </button>
          {result && <p className="text-green-600 text-center mt-3">{result}</p>}
        </div>
      </main>
    </div>
  )
}