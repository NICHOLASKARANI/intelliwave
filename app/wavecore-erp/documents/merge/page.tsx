'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Layers, Download, Upload, FileText, X, Loader2, CheckCircle, Eye } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'

interface UploadedFile {
  id: string
  name: string
  size: number
  arrayBuffer: ArrayBuffer
}

export default function MergePage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [merging, setMerging] = useState(false)
  const [mergedUrl, setMergedUrl] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList) return
    setError('')

    for (const file of Array.from(fileList)) {
      if (file.type !== 'application/pdf') {
        setError('Please upload PDF files only')
        return
      }
      const arrayBuffer = await file.arrayBuffer()
      setFiles(prev => [...prev, {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        size: file.size,
        arrayBuffer,
      }])
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('Upload at least 2 PDFs to merge')
      return
    }

    setMerging(true)
    setError('')

    try {
      const mergedPdf = await PDFDocument.create()

      for (const file of files) {
        const pdfDoc = await PDFDocument.load(file.arrayBuffer)
        const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())
        pages.forEach(page => mergedPdf.addPage(page))
      }

      const mergedBytes = await mergedPdf.save()
      const blob = new Blob([new Uint8Array(mergedBytes)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setMergedUrl(url)
      setMerging(false)
    } catch (err) {
      setError('Merge failed: ' + (err as Error).message)
      setMerging(false)
    }
  }

  const downloadMerged = () => {
    if (!mergedUrl) return
    const a = document.createElement('a')
    a.href = mergedUrl
    a.download = 'merged-documents.pdf'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const viewMerged = () => {
    if (mergedUrl) window.open(mergedUrl, '_blank')
  }

  const resetAll = () => {
    setFiles([])
    setMergedUrl('')
    setError('')
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

      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-pink-600 to-rose-700 p-6 mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Layers className="w-7 h-7" /> Merge PDFs
          </h1>
          <p className="text-white/80 text-sm">Combine PDFs - each page preserved exactly</p>
        </div>

        {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm mb-4 text-center">{error}</div>}

        {!mergedUrl ? (
          <>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
              <label className="block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-3 text-pink-500" />
                <p className="font-medium">Upload PDFs to merge</p>
                <input ref={fileInputRef} type="file" accept=".pdf" multiple onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {files.length > 0 && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-6">
                <p className="font-bold mb-3">Files ({files.length})</p>
                <div className="space-y-2 mb-4">
                  {files.map((file, i) => (
                    <div key={file.id} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                      <span className="w-7 h-7 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <FileText className="w-4 h-4 text-pink-500" />
                      <span className="text-sm flex-1 truncate">{file.name}</span>
                      <button onClick={() => removeFile(file.id)} className="text-red-500"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                <button onClick={handleMerge} disabled={merging || files.length < 2}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                  {merging ? <Loader2 className="w-5 h-5 animate-spin" /> : <Layers className="w-5 h-5" />}
                  {merging ? 'Merging...' : 'Merge ' + files.length + ' PDFs'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-green-50 dark:bg-green-950 rounded-2xl border border-green-200 p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="font-bold text-green-700">PDFs Merged!</p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button onClick={viewMerged} className="py-3 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center gap-2"><Eye className="w-4 h-4" /> View</button>
              <button onClick={downloadMerged} className="py-3 rounded-xl bg-green-600 text-white font-bold flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Download</button>
            </div>
            <button onClick={resetAll} className="text-sm text-indigo-500 mt-3">Merge More</button>
          </div>
        )}
      </main>
    </div>
  )
}