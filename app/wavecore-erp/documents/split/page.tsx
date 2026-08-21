'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Scissors, Download, Upload, FileText, X, Loader2, CheckCircle, Eye } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'

interface SplitResult {
  fileName: string
  pageCount: number
  downloadUrl: string
}

export default function SplitPage() {
  const [fileName, setFileName] = useState('')
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [splitting, setSplitting] = useState(false)
  const [splitResults, setSplitResults] = useState<SplitResult[]>([])
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      return
    }

    const arrayBuffer = await file.arrayBuffer()
    setFileName(file.name)
    setFileBuffer(arrayBuffer)

    // Get total pages
    try {
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      setTotalPages(pdfDoc.getPageCount())
    } catch {
      setError('Error reading PDF')
    }
  }

  const handleSplitAllPages = async () => {
    if (!fileBuffer) {
      setError('Upload a PDF first')
      return
    }

    setSplitting(true)
    setError('')

    try {
      const sourcePdf = await PDFDocument.load(fileBuffer)
      const pageCount = sourcePdf.getPageCount()
      const results: SplitResult[] = []

      // Create separate PDF for EACH page
      for (let i = 0; i < pageCount; i++) {
        const newPdf = await PDFDocument.create()
        const [copiedPage] = await newPdf.copyPages(sourcePdf, [i])
        newPdf.addPage(copiedPage)
        const pdfBytes = await newPdf.save()
        const blob = new Blob([pdfBytes], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        
        results.push({
          fileName: fileName.replace('.pdf', '') + '-page-' + (i + 1) + '.pdf',
          pageCount: 1,
          downloadUrl: url,
        })
      }

      setSplitResults(results)
      setSplitting(false)
    } catch (err) {
      setError('Split failed: ' + (err as Error).message)
      setSplitting(false)
    }
  }

  const handleSplitCustom = async () => {
    if (!fileBuffer) {
      setError('Upload a PDF first')
      return
    }

    const pageInput = prompt('Enter page numbers to extract (e.g., 1,3,5 or 2-4):')
    if (!pageInput) return

    setSplitting(true)
    setError('')

    try {
      const sourcePdf = await PDFDocument.load(fileBuffer)
      const pageCount = sourcePdf.getPageCount()
      
      // Parse page numbers
      let pagesToExtract: number[] = []
      const parts = pageInput.split(',')
      parts.forEach(part => {
        if (part.includes('-')) {
          const [start, end] = part.split('-').map(Number)
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= pageCount) pagesToExtract.push(i - 1)
          }
        } else {
          const num = parseInt(part)
          if (num >= 1 && num <= pageCount) pagesToExtract.push(num - 1)
        }
      })

      if (pagesToExtract.length === 0) {
        setError('Invalid page numbers')
        setSplitting(false)
        return
      }

      // Create PDF with selected pages
      const newPdf = await PDFDocument.create()
      const copiedPages = await newPdf.copyPages(sourcePdf, pagesToExtract)
      copiedPages.forEach(page => newPdf.addPage(page))
      const pdfBytes = await newPdf.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      setSplitResults([{
        fileName: fileName.replace('.pdf', '') + '-extracted-pages.pdf',
        pageCount: pagesToExtract.length,
        downloadUrl: url,
      }])
      setSplitting(false)
    } catch (err) {
      setError('Split failed: ' + (err as Error).message)
      setSplitting(false)
    }
  }

  const downloadResult = (url: string, name: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const resetAll = () => {
    setFileName('')
    setFileBuffer(null)
    setTotalPages(0)
    setSplitResults([])
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
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

      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-amber-600 to-orange-700 p-6 mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Scissors className="w-7 h-7" /> Split PDF
          </h1>
          <p className="text-white/80 text-sm">Extract pages - each page becomes a separate PDF</p>
        </div>

        {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm mb-4 text-center">{error}</div>}

        {splitResults.length === 0 ? (
          <>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
              <label className="block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                <p className="font-medium">{fileName || 'Upload PDF to split'}</p>
                {totalPages > 0 && <p className="text-sm text-green-600 mt-1">{totalPages} pages detected</p>}
                <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {totalPages > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleSplitAllPages} disabled={splitting}
                  className="py-3.5 rounded-xl bg-amber-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                  {splitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Scissors className="w-5 h-5" />}
                  {splitting ? 'Splitting...' : 'Split ALL ' + totalPages + ' Pages'}
                </button>
                <button onClick={handleSplitCustom} disabled={splitting}
                  className="py-3.5 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                  <FileText className="w-5 h-5" /> Extract Specific Pages
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-950 rounded-2xl border border-green-200 p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-bold text-green-700">PDF Split Successfully!</p>
              <p className="text-sm text-green-600">{splitResults.length} file(s) created</p>
            </div>

            {splitResults.map((result, i) => (
              <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="font-medium">{result.fileName}</p>
                    <p className="text-xs text-muted-foreground">{result.pageCount} page(s)</p>
                  </div>
                </div>
                <button onClick={() => downloadResult(result.downloadUrl, result.fileName)}
                  className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-bold flex items-center gap-2">
                  <Download className="w-4 h-4" /> Download
                </button>
              </div>
            ))}

            <button onClick={resetAll} className="w-full py-3 rounded-xl border font-medium">
              Split Another PDF
            </button>
          </div>
        )}
      </main>
    </div>
  )
}