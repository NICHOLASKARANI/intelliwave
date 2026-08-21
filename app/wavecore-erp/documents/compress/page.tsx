'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Minimize2, Download, Upload, FileText, Loader2, CheckCircle, Eye } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'

export default function CompressPage() {
  const [fileName, setFileName] = useState('')
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null)
  const [originalSize, setOriginalSize] = useState(0)
  const [compressing, setCompressing] = useState(false)
  const [compressedUrl, setCompressedUrl] = useState('')
  const [compressedSize, setCompressedSize] = useState(0)
  const [compressionRatio, setCompressionRatio] = useState(0)
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
    setOriginalSize(file.size)
    setCompressedUrl('')
    setCompressedSize(0)
  }

  const handleCompress = async () => {
    if (!fileBuffer) {
      setError('Upload a PDF first')
      return
    }

    setCompressing(true)
    setError('')

    try {
      // Load PDF
      const pdfDoc = await PDFDocument.load(fileBuffer, {
        updateMetadata: false,
      })

      // Enable compression
      const compressedBytes = await pdfDoc.save({
        useObjectStreams: true, // Compresses PDF structure
        addDefaultPage: false,
        objectsPerTick: 50,
      })

      const blob = new Blob([compressedBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      
      setCompressedUrl(url)
      setCompressedSize(blob.size)
      setCompressionRatio(Math.round((1 - blob.size / originalSize) * 100))
      setCompressing(false)
    } catch (err) {
      setError('Compression failed: ' + (err as Error).message)
      setCompressing(false)
    }
  }

  const downloadCompressed = () => {
    if (!compressedUrl) return
    const a = document.createElement('a')
    a.href = compressedUrl
    a.download = fileName.replace('.pdf', '') + '-compressed.pdf'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const viewCompressed = () => {
    if (compressedUrl) window.open(compressedUrl, '_blank')
  }

  const resetAll = () => {
    setFileName('')
    setFileBuffer(null)
    setOriginalSize(0)
    setCompressedUrl('')
    setCompressedSize(0)
    setCompressionRatio(0)
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
          <span className="text-sm">Compress PDF</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-teal-600 to-cyan-700 p-6 mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Minimize2 className="w-7 h-7" /> Compress PDF
          </h1>
          <p className="text-white/80 text-sm">Reduce PDF file size</p>
        </div>

        {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm mb-4 text-center">{error}</div>}

        {!compressedUrl ? (
          <>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
              <label className="block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-3 text-teal-500" />
                <p className="font-medium">{fileName || 'Upload PDF to compress'}</p>
                {originalSize > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">Original size: {formatSize(originalSize)}</p>
                )}
                <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {fileBuffer && (
              <button onClick={handleCompress} disabled={compressing}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                {compressing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Minimize2 className="w-5 h-5" />}
                {compressing ? 'Compressing...' : 'Compress PDF'}
              </button>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-950 rounded-2xl border border-green-200 p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-bold text-green-700">PDF Compressed!</p>
              
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="p-4 rounded-xl bg-white dark:bg-neutral-900">
                  <p className="text-xs text-muted-foreground">Original</p>
                  <p className="font-bold">{formatSize(originalSize)}</p>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-neutral-900">
                  <p className="text-xs text-muted-foreground">Compressed</p>
                  <p className="font-bold text-green-600">{formatSize(compressedSize)}</p>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-neutral-900">
                  <p className="text-xs text-muted-foreground">Reduction</p>
                  <p className="font-bold text-amber-600">{compressionRatio}%</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={viewCompressed} className="py-3 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" /> View
              </button>
              <button onClick={downloadCompressed} className="py-3 rounded-xl bg-green-600 text-white font-bold flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>

            <button onClick={resetAll} className="w-full py-3 rounded-xl border font-medium">
              Compress Another PDF
            </button>
          </div>
        )}
      </main>
    </div>
  )
}