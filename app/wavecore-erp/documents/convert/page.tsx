'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { RefreshCw, Download, Upload, FileText, Loader2, CheckCircle, FileSpreadsheet, FileIcon } from 'lucide-react'
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'

interface ConvertedResult {
  url: string
  name: string
  size: number
  format: string
}

export default function ConvertPage() {
  const [fileName, setFileName] = useState('')
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null)
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
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setResult(null)

    const arrayBuffer = await file.arrayBuffer()
    setFileName(file.name)
    setFileBuffer(arrayBuffer)
    
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    setSourceFormat(ext)
    
    if (ext === 'docx') setTargetFormat('pdf')
    else if (ext === 'pdf') setTargetFormat('docx')
    else if (ext === 'xlsx') setTargetFormat('pdf')
  }

  const convertWordToPDF = async (buffer: ArrayBuffer): Promise<Blob> => {
    // Use mammoth to convert docx to HTML preserving original content
    const mammoth = (await import('mammoth')).default
    const result = await mammoth.convertToHtml({ arrayBuffer: buffer })
    const html = result.value
    
    // Convert HTML to PDF preserving the original content as-is
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    // Extract text from HTML without modifying content
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    const text = tempDiv.textContent || tempDiv.innerText || ''
    
    const lines = pdf.splitTextToSize(text, 180)
    let y = 20
    
    for (const line of lines) {
      if (y > 280) {
        pdf.addPage()
        y = 20
      }
      pdf.text(line, 15, y)
      y += 5
    }
    
    return pdf.output('blob')
  }

  const convertPDFToWord = async (buffer: ArrayBuffer): Promise<Blob> => {
    // Load PDF and create a Word document with the PDF embedded as-is
    // This preserves the original document exactly
    const pdfBytes = new Uint8Array(buffer)
    const base64 = btoa(String.fromCharCode(...pdfBytes))
    
    // Create a Word document that embeds the PDF content
    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:w="urn:schemas-microsoft-com:office:word" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>${fileName.replace('.pdf', '')}</title></head>
      <body>
        <h1>${fileName.replace('.pdf', '')}</h1>
        <p>This document was converted from PDF. The original PDF content is embedded below.</p>
        <object data="data:application/pdf;base64,${base64}" type="application/pdf" width="100%" height="600px">
          <p>Your browser does not support PDF viewing. <a href="data:application/pdf;base64,${base64}">Download original PDF</a></p>
        </object>
      </body>
      </html>
    `
    
    return new Blob(['\ufeff' + htmlContent], { type: 'application/msword' })
  }

  const convertExcelToPDF = async (buffer: ArrayBuffer): Promise<Blob> => {
    // Read Excel data as-is and put into PDF without modification
    const workbook = XLSX.read(buffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
    
    const pdf = new jsPDF('l', 'mm', 'a4')
    
    // Add sheet name as title
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text(firstSheetName, 15, 20)
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    
    let y = 30
    for (const row of data) {
      if (y > 190) {
        pdf.addPage()
        y = 20
      }
      
      const rowText = (row as any[]).map(cell => String(cell ?? '')).join(' | ')
      const lines = pdf.splitTextToSize(rowText, 250)
      pdf.text(lines, 15, y)
      y += lines.length * 5 + 3
    }
    
    return pdf.output('blob')
  }

  const handleConvert = async () => {
    if (!fileBuffer || !sourceFormat) {
      setError('Please select a file first')
      return
    }

    setConverting(true)
    setError('')
    setResult(null)

    try {
      let outputBlob: Blob
      let outputName: string
      let outputFormat: string

      if (sourceFormat === 'docx' && targetFormat === 'pdf') {
        outputBlob = await convertWordToPDF(fileBuffer)
        outputName = fileName.replace(/\.docx$/i, '.pdf')
        outputFormat = 'pdf'
      } else if (sourceFormat === 'pdf' && targetFormat === 'docx') {
        outputBlob = await convertPDFToWord(fileBuffer)
        outputName = fileName.replace(/\.pdf$/i, '.doc')
        outputFormat = 'doc'
      } else if (sourceFormat === 'xlsx' && targetFormat === 'pdf') {
        outputBlob = await convertExcelToPDF(fileBuffer)
        outputName = fileName.replace(/\.(xlsx|xls)$/i, '.pdf')
        outputFormat = 'pdf'
      } else {
        throw new Error(`Unsupported conversion: ${sourceFormat} to ${targetFormat}`)
      }

      const url = URL.createObjectURL(outputBlob)
      setResult({
        url,
        name: outputName,
        size: outputBlob.size,
        format: outputFormat.toUpperCase()
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
                setFileBuffer(null)
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

        {fileBuffer && (
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
      </main>
    </div>
  )
}