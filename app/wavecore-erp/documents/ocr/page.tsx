'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ScanText, Upload, FileText, Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OCRPage() {
  const [uploading, setUploading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState('')
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setUploading(true)
    setTimeout(() => {
      setUploading(false)
      setScanning(true)
      setTimeout(() => {
        setScanning(false)
        setResult('OCR scanning simulated. In production, this extracts text from the uploaded document using AI-powered OCR technology.')
      }, 2000)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/documents" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <Link href="/wavecore-erp/documents" className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="w-4 h-4" /> Back</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><ScanText className="w-6 h-6 text-indigo-500" /> OCR Document Scanner</h1>
        <p className="text-sm text-muted-foreground mb-6">Upload scanned documents and extract text using AI-powered OCR</p>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-8 text-center">
          <label className="cursor-pointer block">
            <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.jpg,.jpeg,.png" />
            <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-8 hover:border-indigo-400 transition-colors">
              <Upload className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
              <p className="font-medium">Drop file here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG up to 10MB</p>
            </div>
          </label>

          {fileName && <p className="mt-4 text-sm text-muted-foreground">Selected: {fileName}</p>}

          {uploading && (
            <div className="mt-4 flex items-center gap-2 justify-center">
              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
              <span className="text-sm">Uploading...</span>
            </div>
          )}

          {scanning && (
            <div className="mt-4 flex items-center gap-2 justify-center">
              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
              <span className="text-sm">Scanning with OCR...</span>
            </div>
          )}

          {result && (
            <div className="mt-6 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-left">
              <CheckCircle className="w-5 h-5 text-green-500 mb-2" />
              <p className="text-sm">{result}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}