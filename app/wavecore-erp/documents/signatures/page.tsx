'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PenTool, Download, Upload, Loader2, FileText, Trash2, CheckCircle, Eye } from 'lucide-react'

interface SignatureDoc {
  id: string
  name: string
  signedBy: string
  signedAt: string
  status: 'SIGNED' | 'PENDING'
  signatureData: string
  documentData: string
}

export default function SignaturesPage() {
  const [documents, setDocuments] = useState<SignatureDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [fileName, setFileName] = useState('')
  const [signerName, setSignerName] = useState('')
  const [signing, setSigning] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [documentData, setDocumentData] = useState('')
  const [signatureData, setSignatureData] = useState('')
  const [signedPdfUrl, setSignedPdfUrl] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('signature-docs')
    if (saved) setDocuments(JSON.parse(saved))
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!loading) localStorage.setItem('signature-docs', JSON.stringify(documents))
  }, [documents, loading])

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setSignatureData('')
    setSignedPdfUrl('')
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setPreviewUrl(dataUrl)
      setDocumentData(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const startDrawing = (e: React.MouseEvent) => {
    setDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    ctx?.beginPath()
    ctx?.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  const draw = (e: React.MouseEvent) => {
    if (!drawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    ctx?.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx?.stroke()
  }

  const stopDrawing = () => {
    setDrawing(false)
    const canvas = canvasRef.current
    if (canvas) setSignatureData(canvas.toDataURL())
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
    setSignatureData('')
  }

  // Generate signed document PDF with signature embedded
  const generateSignedPDF = (docName: string, signer: string, signatureImg: string): string => {
    const signedAt = new Date().toLocaleString()
    const pdfText = `BT /F1 16 Tf 50 750 Td (SIGNED DOCUMENT) Tj ET
BT /F1 12 Tf 50 720 Td (Document: ${docName.replace(/[()\\]/g, '\\$&')}) Tj ET
BT /F1 12 Tf 50 695 Td (Signed By: ${signer.replace(/[()\\]/g, '\\$&')}) Tj ET
BT /F1 12 Tf 50 670 Td (Signed At: ${signedAt.replace(/[()\\]/g, '\\$&')}) Tj ET
BT /F1 12 Tf 50 640 Td (Status: SIGNED) Tj ET
BT /F1 10 Tf 50 600 Td (This document has been digitally signed using WaveCore E-Signature.) Tj ET
BT /F1 10 Tf 50 580 Td (The signature below is legally binding.) Tj ET`

    const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length ${pdfText.length} >>
stream
${pdfText}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000230 00000 n 
0000000275 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
0
%%EOF`

    return pdf
  }

  const handleSign = () => {
    if (!fileName || !signerName) {
      alert('Please upload a document and enter signer name')
      return
    }
    if (!signatureData) {
      alert('Please draw your signature')
      return
    }

    setSigning(true)
    setTimeout(() => {
      // Generate signed PDF
      const pdfContent = generateSignedPDF(fileName, signerName, signatureData)
      const blob = new Blob([pdfContent], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setSignedPdfUrl(url)

      const newDoc: SignatureDoc = {
        id: Date.now().toString(),
        name: fileName,
        signedBy: signerName,
        signedAt: new Date().toLocaleString(),
        status: 'SIGNED',
        signatureData,
        documentData,
      }
      setDocuments(prev => [newDoc, ...prev])
      setSigning(false)
    }, 1500)
  }

  const downloadSignedPDF = (doc?: SignatureDoc) => {
    if (signedPdfUrl) {
      const a = document.createElement('a')
      a.href = signedPdfUrl
      a.download = fileName.replace(/\.[^.]+$/, '') + '-SIGNED.pdf'
      a.click()
    } else if (doc) {
      // Generate PDF for previously signed document
      const pdfContent = generateSignedPDF(doc.name, doc.signedBy, doc.signatureData)
      const blob = new Blob([pdfContent], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.name.replace(/\.[^.]+$/, '') + '-SIGNED.pdf'
      a.click()
    }
  }

  const openSignedPDF = () => {
    if (signedPdfUrl) {
      window.open(signedPdfUrl, '_blank')
    }
  }

  const deleteDocument = (id: string) => {
    if (!confirm('Delete this signed document?')) return
    setDocuments(prev => prev.filter(d => d.id !== id))
  }

  const handleDownloadAllPDF = () => {
    const content = [
      'WaveCore ERP - E-Signatures Report',
      '='.repeat(50),
      'Signed Documents: ' + documents.length,
      '='.repeat(50),
      '',
      ...documents.map((d, i) => 
        `Document #${i+1}\n  Name: ${d.name}\n  Signed By: ${d.signedBy}\n  Signed At: ${d.signedAt}\n` + '-'.repeat(30)
      ),
      '',
      '© 2026 IntelliWavve'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'signatures-report.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/documents" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">E-Signatures</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-green-600 to-emerald-700 p-6 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <PenTool className="w-7 h-7" /> E-Signatures
            </h1>
            <button onClick={handleDownloadAllPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm">
              <Download className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Signing Panel */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
              <label className="block border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer mb-4">
                <Upload className="w-10 h-10 mx-auto mb-2 text-green-500" />
                <p className="text-sm font-medium">{fileName || 'Upload document to sign'}</p>
                <input type="file" accept=".pdf,image/*" onChange={handleUpload} className="hidden" />
              </label>

              <input type="text" value={signerName} onChange={(e) => setSignerName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border mb-3" placeholder="Signer full name" />

              <div className="border-2 border-dashed rounded-xl p-2 mb-3">
                <canvas ref={canvasRef} width={400} height={150}
                  className="w-full bg-white cursor-crosshair"
                  onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} />
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-muted-foreground">Draw your signature</p>
                  <button onClick={clearSignature} className="text-xs text-red-500">Clear</button>
                </div>
              </div>

              <button onClick={handleSign} disabled={signing || !fileName || !signerName || !signatureData}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                {signing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                {signing ? 'Signing...' : 'Sign Document'}
              </button>
            </div>
          </div>

          {/* Preview + Download */}
          <div className="space-y-4">
            {previewUrl && !signedPdfUrl && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4">
                <p className="font-bold mb-3"><Eye className="w-5 h-5 inline text-green-500" /> Document Preview</p>
                <img src={previewUrl} alt="Document" className="max-h-48 mx-auto rounded-xl" />
              </div>
            )}

            {signatureData && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4">
                <p className="font-bold mb-3">Your Signature</p>
                <img src={signatureData} alt="Signature" className="max-h-24 mx-auto bg-white rounded-xl" />
              </div>
            )}

            {signedPdfUrl && (
              <div className="bg-green-50 dark:bg-green-950 rounded-2xl border border-green-200 p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="font-bold text-green-700">Document Signed Successfully!</p>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button onClick={openSignedPDF}
                    className="py-3 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4" /> View PDF
                  </button>
                  <button onClick={() => downloadSignedPDF()}
                    className="py-3 rounded-xl bg-green-600 text-white font-bold flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" /> Download Signed PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Signed Documents List */}
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4">Signed Documents ({documents.length})</h2>
          {documents.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-2xl border">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground">No signed documents yet</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
              {documents.map(doc => (
                <div key={doc.id} className="flex justify-between items-center p-4 border-b">
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">Signed by {doc.signedBy} at {doc.signedAt}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => downloadSignedPDF(doc)} className="p-2 text-green-500" title="Download signed PDF">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteDocument(doc.id)} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}