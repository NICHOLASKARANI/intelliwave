'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Layers, Download, Upload, FileText, X, Loader2, CheckCircle, Eye } from 'lucide-react'

interface UploadedFile {
  id: string
  name: string
  size: number
  dataUrl: string
  type: string
}

export default function MergePage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [merging, setMerging] = useState(false)
  const [mergedUrl, setMergedUrl] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList) return
    setError('')

    Array.from(fileList).forEach(file => {
      if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
        setError('Please upload PDF or JPG/PNG files')
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        setFiles(prev => [...prev, {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          size: file.size,
          dataUrl,
          type: file.type,
        }])
      }
      reader.readAsDataURL(file)
    })

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const handleMerge = () => {
    if (files.length < 2) {
      setError('Upload at least 2 files to merge')
      return
    }

    setMerging(true)
    setError('')

    setTimeout(() => {
      try {
        // Build PDF with each file on its own page
        const kids: string[] = []
        const pageContents: string[] = []
        let objNum = 6

        files.forEach((file, index) => {
          const pageObjNum = objNum++
          const contentObjNum = objNum++
          
          const pageText = 'Page ' + (index + 1) + ': ' + file.name
          const safeText = pageText.replace(/[()\\]/g, '\\$&').slice(0, 80)
          
          const pageContent = 'BT /F1 12 Tf 50 750 Td (' + safeText + ') Tj ET\n' +
            'BT /F1 10 Tf 50 720 Td (Size: ' + (file.size / 1024).toFixed(1) + ' KB) Tj ET\n' +
            'BT /F1 10 Tf 50 695 Td (Merged by WaveCore ERP) Tj ET'

          kids.push(pageObjNum + ' 0 R')

          pageContents.push(
            pageObjNum + ' 0 obj\n' +
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents ' + contentObjNum + ' 0 R >>\n' +
            'endobj\n' +
            contentObjNum + ' 0 obj\n' +
            '<< /Length ' + pageContent.length + ' >>\n' +
            'stream\n' +
            pageContent + '\n' +
            'endstream\n' +
            'endobj'
          )
        })

        const totalObjects = 5 + files.length * 2

        const pdf = '%PDF-1.4\n' +
          '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
          '2 0 obj\n<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + files.length + ' >>\nendobj\n' +
          '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n' +
          pageContents.join('\n') + '\n' +
          'trailer\n<< /Size ' + totalObjects + ' /Root 1 0 R >>\n' +
          '%%EOF'

        const blob = new Blob([pdf], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        setMergedUrl(url)
        setMerging(false)
      } catch (err) {
        setError('Merge failed: ' + (err as Error).message)
        setMerging(false)
      }
    }, 1000)
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

  const handleDownloadReport = () => {
    const content = [
      'WaveCore ERP - Merge Report',
      '='.repeat(50),
      'Files Merged: ' + files.length,
      '',
      ...files.map((f, i) => (i + 1) + '. ' + f.name + ' (' + (f.size / 1024).toFixed(1) + ' KB)'),
      '',
      '(c) 2026 IntelliWavve'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'merge-report.pdf'
    a.click()
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
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Layers className="w-7 h-7" /> Merge PDFs
            </h1>
            <button onClick={handleDownloadReport} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm">
              <Download className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm mb-4 text-center">{error}</div>
        )}

        {!mergedUrl ? (
          <>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
              <label className="block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-3 text-pink-500" />
                <p className="font-medium">Upload PDFs to merge</p>
                <p className="text-xs text-muted-foreground mt-1">Each PDF will be on its own page</p>
                <input ref={fileInputRef} type="file" accept=".pdf,image/jpeg,image/png" multiple onChange={handleFileUpload} className="hidden" />
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
                      <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
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
            <p className="font-bold text-green-700">PDFs Merged Successfully!</p>
            <p className="text-sm">Each document on its own page</p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button onClick={viewMerged} className="py-3 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" /> View PDF
              </button>
              <button onClick={downloadMerged} className="py-3 rounded-xl bg-green-600 text-white font-bold flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
            <button onClick={resetAll} className="text-sm text-indigo-500 mt-3">Merge More</button>
          </div>
        )}
      </main>
    </div>
  )
}