'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { RefreshCw, Download, Upload, FileText, Loader2, CheckCircle, FileSpreadsheet, FileIcon } from 'lucide-react'

interface ConvertedResult {
  url: string
  name: string
  size: number
  format: string
}

export default function ConvertPage() {
  const [fileName, setFileName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [sourceFormat, setSourceFormat] = useState('')
  const [targetFormat, setTargetFormat] = useState('PDF')
  const [converting, setConverting] = useState(false)
  const [result, setResult] = useState<ConvertedResult | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const conversionOptions = [
    { from: 'docx', to: 'pdf', label: 'Word to PDF', icon: FileText, color: 'from-blue-500 to-indigo-600' },
    { from: 'pdf', to: 'docx', label: 'PDF to Word', icon: FileIcon, color: 'from-red-500 to-rose-600' },
    { from: 'xlsx', to: 'pdf', label: 'Excel to PDF', icon: FileSpreadsheet, color: 'from-green-500 to-emerald-600' },
  ]

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    setError('')
    setResult(null)

    setFileName(selectedFile.name)
    setFile(selectedFile)
    
    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || ''
    setSourceFormat(ext)
    
    if (ext === 'docx') setTargetFormat('pdf')
    else if (ext === 'pdf') setTargetFormat('docx')
    else if (ext === 'xlsx') setTargetFormat('pdf')
  }

  const handleConvert = async () => {
    if (!file || !sourceFormat) {
      setError('Please select a file first')
      return
    }

    setConverting(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('targetFormat', targetFormat)

      const res = await fetch('/api/wavecore/convert', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Conversion failed')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      
      let outputName = fileName
      if (sourceFormat === 'docx' && targetFormat === 'pdf') {
        outputName = fileName.replace(/\.docx$/i, '.pdf')
      } else if (sourceFormat === 'pdf' && targetFormat === 'docx') {
        outputName = fileName.replace(/\.pdf$/i, '.doc')
      } else if (sourceFormat === 'xlsx' && targetFormat === 'pdf') {
        outputName = fileName.replace(/\.(xlsx|xls)$/i, '.pdf')
      }

      setResult({
        url,
        name: outputName,
        size: blob.size,
        format: targetFormat.toUpperCase()
      })
    } catch (err) {
      setError('Conversion failed: ' + (err as Error).message)
    } finally {
      setConverting(false)
    }
  }

  const handleDownload = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result.url
    a.download = result.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(result.url)
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/documents" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Convert Document</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <RefreshCw className="w-6 h-6 text-blue-500" /> Convert Document
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {conversionOptions.map(option => {
            const Icon = option.icon
            return (
              <button key={option.label} onClick={() => {
                setSourceFormat(option.from)
                setTargetFormat(option.to)
                setResult(null)
                setFile(null)
                setFileName('')
              }}
              className={`p-5 rounded-2xl border text-center transition-all ${
                sourceFormat === option.from && targetFormat === option.to
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-transparent shadow-lg'
                  : 'bg-white dark:bg-neutral-900 hover:shadow-md'
              }`}>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center mx-auto mb-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm font-bold">{option.label}</p>
                <p className="text-xs opacity-70 mt-1">{option.from.toUpperCase()} → {option.to.toUpperCase()}</p>
              </button>
            )
          })}
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept={sourceFormat === 'xlsx' ? '.xlsx,.xls' : sourceFormat === 'docx' ? '.docx' : '.pdf'}
          />
          
          <button onClick={() => fileInputRef.current?.click()}
            className="w-full p-8 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-blue-500 transition-all text-center">
            <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            {fileName ? (
              <>
                <p className="font-bold">{fileName}</p>
                <p className="text-sm text-muted-foreground mt-1">Click to change file</p>
              </>
            ) : (
              <>
                <p className="font-bold">Click to upload file</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Select {sourceFormat === 'xlsx' ? 'Excel (.xlsx)' : sourceFormat === 'docx' ? 'Word (.docx)' : 'PDF'} file
                </p>
              </>
            )}
          </button>
        </div>

        {file && (
          <button onClick={handleConvert} disabled={converting}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {converting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Converting...</>
            ) : (
              <><RefreshCw className="w-5 h-5" /> Convert {sourceFormat.toUpperCase()} to {targetFormat.toUpperCase()}</>
            )}
          </button>
        )}

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 p-6 rounded-2xl bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="font-bold">{result.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {result.format} • {(result.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button onClick={handleDownload}
                className="px-6 py-3 rounded-xl bg-green-600 text-white flex items-center gap-2 hover:bg-green-700">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-sm text-blue-600 dark:text-blue-400">
          <p className="font-bold mb-2">How it works:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Your original file is sent to the server</li>
            <li>The server preserves the EXACT original content</li>
            <li>Only the file format changes (extension)</li>
            <li>No content is modified, extracted, or changed</li>
          </ul>
        </div>
      </main>
    </div>
  )
}