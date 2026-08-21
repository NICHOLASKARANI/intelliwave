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
}

export default function SignaturesPage() {
  const [documents, setDocuments] = useState<SignatureDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [fileName, setFileName] = useState('')
  const [signerName, setSignerName] = useState('')
  const [signing, setSigning] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [scanned, setScanned] = useState(false)
  const [signatureData, setSignatureData] = useState('')
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
    setScanned(false)
    setSignatureData('')
    
    const reader = new FileReader()
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Canvas drawing for signature
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
    if (canvas) {
      setSignatureData(canvas.toDataURL())
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
    setSignatureData('')
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
      const newDoc: SignatureDoc = {
        id: Date.now().toString(),
        name: fileName,
        signedBy: signerName,
        signedAt: new Date().toLocaleString(),
        status: 'SIGNED',
      }
      setDocuments(prev => [newDoc, ...prev])
      setScanned(true)
      setSigning(false)
    }, 1500)
  }

  const deleteDocument = (id: string) => {
    if (!confirm('Delete this signed document?')) return
    setDocuments(prev => prev.filter(d => d.id !== id))
  }

  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - E-Signatures',
      '='.repeat(50),
      'Generated: ' + new Date().toLocaleString(),
      'Signed Documents: ' + documents.length,
      '='.repeat(50),
      '',
      ...documents.map((d, i) => 
        `Document #${i+1}\n  Name: ${d.name}\n  Signed By: ${d.signedBy}\n  Signed At: ${d.signedAt}\n  Status: ${d.status}\n` + '-'.repeat(30)
      ),
      '',
      '© 2026 IntelliWavve - All Rights Reserved'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'signatures.pdf'; a.click()
  }

  const resetAll = () => {
    setFileName('')
    setSignerName('')
    setSignatureData('')
    setPreviewUrl('')
    setScanned(false)
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
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm">
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

              {/* Signature Canvas */}
              <div className="border-2 border-dashed rounded-xl p-2 mb-3">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={150}
                  className="w-full bg-white cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-muted-foreground">Draw your signature above</p>
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

          {/* Document Preview */}
          <div className="space-y-4">
            {previewUrl && !scanned && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4">
                <p className="font-bold mb-3 flex items-center gap-2"><Eye className="w-5 h-5 text-green-500" /> Document Preview</p>
                <img src={previewUrl} alt="Document" className="max-h-48 mx-auto rounded-xl" />
              </div>
            )}

            {signatureData && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4">
                <p className="font-bold mb-3">Your Signature</p>
                <img src={signatureData} alt="Signature" className="max-h-24 mx-auto bg-white rounded-xl" />
              </div>
            )}
          </div>
        </div>

        {/* Signed Documents List */}
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4">Signed Documents ({documents.length})</h2>
          {loading ? (
            <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-2xl border">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground">No signed documents yet</p>
              <p className="text-sm text-muted-foreground mt-1">Upload and sign your first document</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
              {documents.map(doc => (
                <div key={doc.id} className="flex justify-between items-center p-4 border-b">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">Signed by {doc.signedBy} at {doc.signedAt}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteDocument(doc.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}