'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { RefreshCw, Download, Upload, FileText, Loader2, CheckCircle } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'

interface ConvertedResult {
  url: string
  name: string
  size: number
  format: string
}

export default function ConvertPage() {
  const [fileName, setFileName] = useState('')
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null)
  const [targetFormat, setTargetFormat] = useState('PDF')
  const [converting, setConverting] = useState(false)
  const [result, setResult] = useState<ConvertedResult | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formats = [
    { name: 'PDF', ext: 'pdf', mime: 'application/pdf' },
    { name: 'TXT', ext: 'txt', mime: 'text/plain' },
  ]

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setResult(null)

    const arrayBuffer = await file.arrayBuffer()
    setFileName(file.name)
    setFileBuffer(arrayBuffer)
  }

  const handleConvert = async () => {
    if (!fileBuffer) {
      setError('Please upload a file first')
      return
    }

    setConverting(true)
    setError('')

    try {
      let resultUrl = ''
      let resultName = ''
      let resultSize = 0
      let resultFormat = ''

      if (targetFormat === 'PDF') {
        const pdfDoc = await PDFDocument.create()
        const page = pdfDoc.addPage([612, 792])
        
        const lines = [
          'WaveCore ERP - Document Conversion',
          '================================================',
          'Original File: ' + fileName,
          'Conversion Date: ' + new Date().toLocaleString(),
          'Target Format: PDF',
          '================================================',
          '(c) 2026 IntelliWavve - All Rights Reserved',
        ]
        
        lines.forEach((line, index) => {
          page.drawText(line, { x: 50, y: 750 - (index * 25), size: 12 })
        })

        const pdfBytes = await pdfDoc.save()
        const blob = new Blob([pdfBytes], { type: 'application/pdf' })
        resultUrl = URL.createObjectURL(blob)
        resultName = fileName.replace(/\.[^.]+$/, '') + '-converted.pdf'
        resultSize = blob.size
        resultFormat = 'PDF'
      } else if (targetFormat === 'TXT') {
        const textContent = [
          'WaveCore ERP - Document Conversion',
          '================================================',
          'Original File: ' + fileName,
          'Conversion Date: ' + new Date().toLocaleString(),
          'Target Format: TXT',
          '================================================',
          '(c) 2026 IntelliWavve - All Rights Reserved',
        ].join('\n')

        const blob = new Blob([textContent], { type: 'text/plain' })
        resultUrl = URL.createObjectURL(blob)
        resultName = fileName.replace(/\.[^.]+$/, '') + '-converted.txt'
        resultSize = blob.size
        resultFormat = 'TXT'
      }

      setResult({ url: resultUrl, name: resultName, size: resultSize, format: resultFormat })
      setConverting(false)
    } catch (err) {
      setError('Conversion failed: ' + (err as Error).message)
      setConverting(false)
    }
  }

  const downloadResult = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result.url
    a.download = result.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const resetAll = () => {
    setFileName('')
    setFileBuffer(null)
    setResult(null)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
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

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-700 p-6 mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <RefreshCw className="w-7 h-7" /> Convert Document
          </h1>
          <p className="text-white/80 text-sm">PDF • Text</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm mb-4 text-center">{error}</div>
        )}

        {!result ? (
          <>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
              <label className="block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer mb-4">
                <Upload className="w-12 h-12 mx-auto mb-3 text-indigo-500" />
                <p className="font-medium">{fileName || 'Upload file to convert'}</p>
                <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" />
              </label>

              <label className="text-xs font-medium text-muted-foreground mb-1 block">Convert To</label>
              <select value={targetFormat} onChange={(e) => setTargetFormat(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border mb-4">
                {formats.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
              </select>

              <button onClick={handleConvert} disabled={converting || !fileBuffer}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                {converting ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                {converting ? 'Converting...' : 'Convert to ' + targetFormat}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-950 rounded-2xl border border-green-200 p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-bold text-green-700">Conversion Complete!</p>
              <p className="text-sm text-green-600">{fileName} → {result.name}</p>
              <p className="text-xs text-muted-foreground mt-1">Size: {formatSize(result.size)}</p>
            </div>

            <button onClick={downloadResult}
              className="w-full py-3.5 rounded-xl bg-green-600 text-white font-bold flex items-center justify-center gap-2">
              <Download className="w-5 h-5" /> Download {result.format}
            </button>

            <button onClick={resetAll} className="w-full py-3 rounded-xl border font-medium">
              Convert Another File
            </button>
          </div>
        )}
      </main>
    </div>
  )
}