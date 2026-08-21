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
  status: 'SIGNED'
  signatureData: string
  combinedPdfUrl: string
}

export default function SignaturesPage() {
  const [documents, setDocuments] = useState<SignatureDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [fileName, setFileName] = useState('')
  const [signerName, setSignerName] = useState('')
  const [signing, setSigning] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [signatureData, setSignatureData] = useState('')
  const [combinedPdfUrl, setCombinedPdfUrl] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('signature-docs-v2')
    if (saved) setDocuments(JSON.parse(saved))
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!loading) localStorage.setItem('signature-docs-v2', JSON.stringify(documents))
  }, [documents, loading])

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setSignatureData('')
    setCombinedPdfUrl('')
    
    const reader = new FileReader()
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Canvas drawing
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

  // COMBINE document + signature into ONE image/PDF
  const handleSign = () => {
    if (!fileName || !signerName || !signatureData) {
      alert('Please upload document, enter name, and draw signature')
      return
    }

    setSigning(true)
    setTimeout(() => {
      // Create a combined canvas with the document + signature
      const combinedCanvas = document.createElement('canvas')
      combinedCanvas.width = 800
      combinedCanvas.height = 1000
      const ctx = combinedCanvas.getContext('2d')

      // White background
      ctx!.fillStyle = 'white'
      ctx!.fillRect(0, 0, 800, 1000)

      // Load the uploaded document image
      const docImg = new window.Image()
      docImg.onload = () => {
        // Draw document on canvas (fit to width)
        const docWidth = 700
        const docHeight = (docImg.height / docImg.width) * docWidth
        ctx!.drawImage(docImg, 50, 50, docWidth, Math.min(docHeight, 700))

        // Draw signature on the document
        const sigImg = new window.Image()
        sigImg.onload = () => {
          ctx!.drawImage(sigImg, 500, 800, 200, 75)

          // Draw signer name and date
          ctx!.fillStyle = 'black'
          ctx!.font = 'bold 14px Arial'
          ctx!.fillText('Signed by: ' + signerName, 50, 900)
          ctx!.font = '12px Arial'
          ctx!.fillText('Date: ' + new Date().toLocaleString(), 50, 925)

          // Convert combined canvas to PDF (via image)
          const combinedImage = combinedCanvas.toDataURL('image/png')
          const pdfBlob = dataURItoBlob(combinedImage)
          const pdfUrl = URL.createObjectURL(pdfBlob)
          
          setCombinedPdfUrl(pdfUrl)

          const newDoc: SignatureDoc = {
            id: Date.now().toString(),
            name: fileName,
            signedBy: signerName,
            signedAt: new Date().toLocaleString(),
            status: 'SIGNED',
            signatureData,
            combinedPdfUrl: pdfUrl,
          }
          setDocuments(prev => [newDoc, ...prev])
          setSigning(false)
        }
        sigImg.src = signatureData
      }
      docImg.src = previewUrl
    }, 1500)
  }

  // Convert data URI to Blob
  const dataURItoBlob = (dataURI: string): Blob => {
    const byteString = atob(dataURI.split(',')[1])
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i)
    }
    return new Blob([ab], { type: mimeString })
  }

  const downloadSignedPDF = (url?: string, name?: string) => {
    const downloadUrl = url || combinedPdfUrl
    const downloadName = name || fileName
    if (!downloadUrl) return
    
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = (downloadName || 'document').replace(/\.[^.]+$/, '') + '-SIGNED.png'
    a.click()
  }

  const viewSignedPDF = () => {
    if (combinedPdfUrl) {
      window.open(combinedPdfUrl, '_blank')
    }
  }

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id))
  }

  const handleDownloadReport = () => {
    const content = ['WaveCore ERP - E-Signatures', '='.repeat(50), `Signed: ${documents.length}`, '', ...documents.map(d => `${d.name} - ${d.signedBy} - ${d.signedAt}`), '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'signatures.pdf'; a.click()
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
            <h1 className="text-2xl font-bold text-white flex items-center gap-2"><PenTool className="w-7 h-7" /> E-Signatures</h1>
            <button onClick={handleDownloadReport} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
              <label className="block border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer mb-4">
                <Upload className="w-10 h-10 mx-auto mb-2 text-green-500" />
                <p className="text-sm font-medium">{fileName || 'Upload document to sign'}</p>
                <input type="file" accept="image/*,.pdf" onChange={handleUpload} className="hidden" />
              </label>
              <input type="text" value={signerName} onChange={(e) => setSignerName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border mb-3" placeholder="Signer full name" />
              <div className="border-2 border-dashed rounded-xl p-2 mb-3">
                <canvas ref={canvasRef} width={400} height={150} className="w-full bg-white cursor-crosshair"
                  onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} />
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-muted-foreground">Draw signature</p>
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

          <div className="space-y-4">
            {previewUrl && !combinedPdfUrl && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4">
                <p className="font-bold mb-3"><Eye className="w-5 h-5 inline text-green-500" /> Document</p>
                <img src={previewUrl} alt="Document" className="max-h-48 mx-auto rounded-xl" />
              </div>
            )}
            {signatureData && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4">
                <p className="font-bold mb-3">Signature</p>
                <img src={signatureData} alt="Signature" className="max-h-24 mx-auto bg-white rounded-xl" />
              </div>
            )}
            {combinedPdfUrl && (
              <div className="bg-green-50 dark:bg-green-950 rounded-2xl border border-green-200 p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="font-bold text-green-700">Document Signed!</p>
                <p className="text-sm text-green-600 mt-1">Signature embedded on document</p>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button onClick={viewSignedPDF} className="py-3 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4" /> View
                  </button>
                  <button onClick={() => downloadSignedPDF()} className="py-3 rounded-xl bg-green-600 text-white font-bold flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" /> Download Signed
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

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
                    <button onClick={() => downloadSignedPDF(doc.combinedPdfUrl, doc.name)} className="p-2 text-green-500" title="Download signed document">
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