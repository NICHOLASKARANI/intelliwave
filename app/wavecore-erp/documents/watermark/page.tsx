'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Stamp, Download, Upload, FileText, Loader2, CheckCircle, Eye } from 'lucide-react'
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'

interface WatermarkResult {
  url: string
  name: string
  size: number
}

export default function WatermarkPage() {
  const [fileName, setFileName] = useState('')
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null)
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL')
  const [applying, setApplying] = useState(false)
  const [result, setResult] = useState<WatermarkResult | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setResult(null)

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      return
    }

    const arrayBuffer = await file.arrayBuffer()
    setFileName(file.name)
    setFileBuffer(arrayBuffer)
  }

  const handleApplyWatermark = async () => {
    if (!fileBuffer) {
      setError('Upload a PDF first')
      return
    }
    if (!watermarkText.trim()) {
      setError('Enter watermark text')
      return
    }

    setApplying(true)
    setError('')

    try {
      const pdfDoc = await PDFDocument.load(fileBuffer)
      const pageCount = pdfDoc.getPageCount()
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      for (let i = 0; i < pageCount; i++) {
        const page = pdfDoc.getPage(i)
        const { width, height } = page.getSize()

        // Main diagonal watermark (using degrees function)
        page.drawText(watermarkText, {
          x: width / 2 - 120,
          y: height / 2,
          size: 45,
          font,
          color: rgb(0.7, 0.7, 0.7),
          opacity: 0.25,
          rotate: degrees(30),
        })

        // Bottom watermark
        page.drawText(watermarkText + ' - WaveCore ERP', {
          x: 30,
          y: 25,
          size: 10,
          font,
          color: rgb(0.5, 0.5, 0.5),
          opacity: 0.4,
        })
      }

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      setResult({ url, name: fileName.replace('.pdf', '') + '-watermarked.pdf', size: blob.size })
      setApplying(false)
    } catch (err) {
      setError('Watermark failed: ' + (err as Error).message)
      setApplying(false)
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
    setWatermarkText('CONFIDENTIAL')
    setResult(null)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const presetWatermarks = ['CONFIDENTIAL', 'DRAFT', 'APPROVED', 'INTERNAL USE ONLY', 'SAMPLE', 'DO NOT COPY']

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/documents" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Watermark</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-purple-700 p-6 mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Stamp className="w-7 h-7" /> Watermark PDF
          </h1>
        </div>

        {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm mb-4 text-center">{error}</div>}

        {!result ? (
          <>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
              <label className="block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer mb-4">
                <Upload className="w-12 h-12 mx-auto mb-3 text-violet-500" />
                <p className="font-medium">{fileName || 'Upload PDF to watermark'}</p>
                <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
              </label>

              <input type="text" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border mb-3" placeholder="Watermark text" />

              <div className="flex flex-wrap gap-2 mb-4">
                {presetWatermarks.map(preset => (
                  <button key={preset} onClick={() => setWatermarkText(preset)}
                    className="px-3 py-1.5 rounded-full text-xs bg-neutral-100 dark:bg-neutral-800 hover:bg-violet-100">
                    {preset}
                  </button>
                ))}
              </div>

              <button onClick={handleApplyWatermark} disabled={applying || !fileBuffer || !watermarkText.trim()}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                {applying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Stamp className="w-5 h-5" />}
                {applying ? 'Applying...' : 'Apply Watermark'}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-950 rounded-2xl border border-green-200 p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-bold text-green-700">Watermark Applied!</p>
              <p className="text-sm">{watermarkText} added to all pages</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => window.open(result.url, '_blank')}
                className="py-3 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" /> View
              </button>
              <button onClick={downloadResult}
                className="py-3 rounded-xl bg-green-600 text-white font-bold flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>

            <button onClick={resetAll} className="w-full py-3 rounded-xl border font-medium">
              Watermark Another
            </button>
          </div>
        )}
      </main>
    </div>
  )
}