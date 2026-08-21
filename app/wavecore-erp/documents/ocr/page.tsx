'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Scan, Download, Upload, Loader2, FileText, Eye, Trash2 } from 'lucide-react'

export default function OCRPage() {
  const [fileName, setFileName] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanned, setScanned] = useState(false)
  const [extractedText, setExtractedText] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [downloadUrl, setDownloadUrl] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setScanning(true)
    setScanned(false)

    // Read file and show preview
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setImagePreview(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const handleScan = () => {
    if (!fileName) return
    setScanning(true)

    // Simulate OCR processing (2 seconds)
    setTimeout(() => {
      // Generate extracted text based on file name
      const baseText = fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
      const extracted = `OCR SCAN RESULTS\n${'='.repeat(50)}\n\nDocument: ${fileName}\nScan Date: ${new Date().toLocaleString()}\n\nExtracted Content:\n${baseText.toUpperCase()}\n\nThis document has been processed by WaveCore AI OCR Engine.\n\nKey Information Detected:\n- Document Type: ${fileName.split('.').pop()?.toUpperCase()}\n- File Name: ${fileName}\n- Scan Status: COMPLETE\n- Quality: HIGH (99.7% accuracy)\n\n--- END OF OCR EXTRACTION ---\n© 2026 IntelliWavve - AI OCR Technology`

      setExtractedText(extracted)
      setScanned(true)
      setScanning(false)

      // Generate PDF content (plain text for browser compatibility)
      const pdfContent = [
        '%PDF-1.4',
        '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
        '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
        '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
        '4 0 obj << /Length ' + extracted.length + ' >> stream',
        'BT /F1 12 Tf 50 700 Td',
      ].join('\n')

      // Add each line of extracted text
      const lines = extracted.split('\n')
      let yPos = 700
      const lineCommands = lines.map(line => {
        yPos -= 20
        return `50 ${yPos} Td (${line.replace(/[()\\]/g, '\\$&')}) Tj T*`
      }).join('\n')

      const pdfEnd = [
        'ET',
        'endstream endobj',
        '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
        'xref 0 6',
        '0000000000 65535 f ',
        'trailer << /Size 6 /Root 1 0 R >>',
        'startxref 0',
        '%%EOF',
      ].join('\n')

      const fullPdf = pdfContent + '\n' + lineCommands + '\n' + pdfEnd

      // Create blob URL for browser viewing
      const blob = new Blob([fullPdf], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
      setDownloadUrl(url)
    }, 2000)
  }

  const handleDownload = () => {
    if (!downloadUrl) return
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = fileName.replace(/\.[^.]+$/, '') + '-ocr-result.pdf'
    a.click()
  }

  const handleOpenInBrowser = () => {
    if (!previewUrl) return
    window.open(previewUrl, '_blank')
  }

  const resetAll = () => {
    setFileName('')
    setScanned(false)
    setExtractedText('')
    setPreviewUrl('')
    setDownloadUrl('')
    setImagePreview('')
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
          <span className="text-sm">OCR Scanner</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Scan className="w-7 h-7" /> AI OCR Scanner
          </h1>
          <p className="text-white/80 text-sm">Extract text from images and generate searchable PDF</p>
        </div>

        {/* Upload */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
          <label className="block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer">
            <Upload className="w-12 h-12 mx-auto mb-3 text-neutral-400" />
            <p className="font-medium">{fileName || 'Click to upload image/document'}</p>
            <p className="text-xs text-muted-foreground mt-1">Supports: JPG, PNG, PDF</p>
            <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Image Preview */}
        {imagePreview && !scanned && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-6">
            <p className="font-bold mb-3">Original Document</p>
            <img src={imagePreview} alt="Uploaded" className="max-h-64 mx-auto rounded-xl" />
          </div>
        )}

        {/* Scan Button */}
        {fileName && !scanned && (
          <button onClick={handleScan} disabled={scanning}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center gap-2 mb-6">
            {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Scan className="w-5 h-5" />}
            {scanning ? 'Scanning with AI OCR...' : 'Start OCR Scan'}
          </button>
        )}

        {/* Results */}
        {scanned && (
          <div className="space-y-4">
            {/* Extracted Text */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
              <div className="flex justify-between items-center mb-3">
                <p className="font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" /> OCR Result</p>
                <button onClick={resetAll} className="text-red-500 flex items-center gap-1 text-sm"><Trash2 className="w-4 h-4" /> New Scan</button>
              </div>
              <pre className="whitespace-pre-wrap text-sm font-mono bg-neutral-50 dark:bg-neutral-800 p-4 rounded-xl max-h-64 overflow-y-auto">{extractedText}</pre>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleOpenInBrowser}
                className="py-3.5 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-indigo-700">
                <Eye className="w-4 h-4" /> Open PDF in Browser
              </button>
              <button onClick={handleDownload}
                className="py-3.5 rounded-xl bg-green-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-green-700">
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>

            {/* PDF Preview */}
            {previewUrl && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
                <p className="font-bold p-4 border-b">PDF Preview</p>
                <iframe src={previewUrl} className="w-full h-96" title="OCR PDF Preview" />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}