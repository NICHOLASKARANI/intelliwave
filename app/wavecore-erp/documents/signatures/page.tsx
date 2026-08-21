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
  combinedDownloadUrl: string
}

export default function SignaturesPage() {
  const [documents, setDocuments] = useState<SignatureDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [fileName, setFileName] = useState('')
  const [signerName, setSignerName] = useState('')
  const [signing, setSigning] = useState(false)
  const [uploadedImage, setUploadedImage] = useState('')
  const [signatureData, setSignatureData] = useState('')
  const [combinedDownloadUrl, setCombinedDownloadUrl] = useState('')
  const [combinedPreviewUrl, setCombinedPreviewUrl] = useState('')
  const [error, setError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('signature-docs-v4')
    if (saved) setDocuments(JSON.parse(saved))
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!loading) localStorage.setItem('signature-docs-v4', JSON.stringify(documents))
  }, [documents, loading])

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setError('Please upload an image file (JPG, PNG)')
      return
    }
    
    setError('')
    setFileName(file.name)
    setSignatureData('')
    setCombinedDownloadUrl('')
    setCombinedPreviewUrl('')
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setUploadedImage(dataUrl)
    }
    reader.onerror = () => {
      setError('Failed to read file')
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

  const handleSign = () => {
    if (!uploadedImage || !signerName || !signatureData) {
      setError('Upload document, enter name, and draw signature')
      return
    }

    setError('')
    setSigning(true)

    // Use setTimeout to let UI update
    setTimeout(() => {
      try {
        const combinedCanvas = document.createElement('canvas')
        combinedCanvas.width = 800
        combinedCanvas.height = 1000
        const ctx = combinedCanvas.getContext('2d')

        if (!ctx) throw new Error('Canvas not supported')

        // White background
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, 800, 1000)

        // Load uploaded document
        const docImg = new window.Image()
        
        // Important: Do NOT set crossOrigin for data URLs
        docImg.onload = () => {
          try {
            // Calculate dimensions to fit
            const maxWidth = 700
            const maxHeight = 650
            let drawWidth = docImg.width
            let drawHeight = docImg.height
            
            const widthRatio = maxWidth / drawWidth
            const heightRatio = maxHeight / drawHeight
            const ratio = Math.min(widthRatio, heightRatio)
            
            drawWidth = drawWidth * ratio
            drawHeight = drawHeight * ratio
            
            // Center the document
            const x = (800 - drawWidth) / 2
            const y = (650 - drawHeight) / 2 + 30

            // Draw document
            ctx.drawImage(docImg, x, y, drawWidth, drawHeight)

            // Load and draw signature
            const sigImg = new window.Image()
            sigImg.onload = () => {
              try {
                // Draw signature at bottom of document
                ctx.drawImage(sigImg, 500, 720, 200, 80)

                // Add text
                ctx.fillStyle = '#000000'
                ctx.font = 'bold 14px Arial'
                ctx.fillText('Signed by: ' + signerName, 50, 780)
                ctx.font = '12px Arial'
                ctx.fillText('Date: ' + new Date().toLocaleString(), 50, 805)
                ctx.font = '10px Arial'
                ctx.fillStyle = '#666666'
                ctx.fillText('Digitally signed using WaveCore E-Signature', 50, 830)

                // Generate combined image
                const combinedDataUrl = combinedCanvas.toDataURL('image/png')
                setCombinedPreviewUrl(combinedDataUrl)

                // Create downloadable blob
                const byteString = atob(combinedDataUrl.split(',')[1])
                const ab = new ArrayBuffer(byteString.length)
                const ia = new Uint8Array(ab)
                for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)
                const blob = new Blob([ab], { type: 'image/png' })
                const url = URL.createObjectURL(blob)
                setCombinedDownloadUrl(url)

                const newDoc: SignatureDoc = {
                  id: Date.now().toString(),
                  name: fileName,
                  signedBy: signerName,
                  signedAt: new Date().toLocaleString(),
                  status: 'SIGNED',
                  combinedDownloadUrl: url,
                }
                setDocuments(prev => [newDoc, ...prev])
                setSigning(false)
                setError('')
              } catch (innerError) {
                setError('Error combining signature')
                setSigning(false)
              }
            }
            sigImg.onerror = () => {
              setError('Error loading signature')
              setSigning(false)
            }
            sigImg.src = signatureData
          } catch (drawError) {
            setError('Error drawing document')
            setSigning(false)
          }
        }
        docImg.onerror = () => {
          setError('Error loading document. Try uploading a JPG or PNG image.')
          setSigning(false)
        }
        docImg.src = uploadedImage
      } catch (outerError) {
        setError('Error: ' + (outerError as Error).message)
        setSigning(false)
      }
    }, 500)
  }

  const downloadSigned = (url?: string, name?: string) => {
    const downloadUrl = url || combinedDownloadUrl
    const downloadName = name || fileName
    if (!downloadUrl) return
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = (downloadName || 'document').replace(/\.[^.]+$/, '') + '-SIGNED.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const viewSigned = () => {
    if (combinedPreviewUrl) window.open(combinedPreviewUrl, '_blank')
  }

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id))
  }

  const handleDownloadReport = () => {
    const content = ['WaveCore ERP - E-Signatures', '='.repeat(50), `Signed: ${documents.length}`, '', ...documents.map(d => `${d.name} - ${d.signedBy} - ${d.signedAt}`), '', '© 2026 IntelliWavve'].join('\n')
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

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-green-600 to-emerald-700 p-6 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2"><PenTool className="w-7 h-7" /> E-Signatures</h1>
            <button onClick={handleDownloadReport} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm mb-4 text-center">{error}</div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
              <label className="block border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer mb-4">
                <Upload className="w-10 h-10 mx-auto mb-2 text-green-500" />
                <p className="text-sm font-medium">{fileName || 'Upload document (JPG/PNG image)'}</p>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="hidden" />
              </label>

              {uploadedImage && !combinedPreviewUrl && (
                <div className="mb-3">
                  <p className="text-xs font-medium mb-1">Uploaded Document:</p>
                  <img src={uploadedImage} alt="Uploaded" className="max-h-40 mx-auto rounded-xl border" />
                </div>
              )}

              <input type="text" value={signerName} onChange={(e) => setSignerName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border mb-3" placeholder="Signer full name" />

              <div className="border-2 border-dashed rounded-xl p-2 mb-3">
                <canvas ref={canvasRef} width={400} height={150} className="w-full bg-white cursor-crosshair"
                  onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} />
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-muted-foreground">Draw your signature</p>
                  <button onClick={clearSignature} className="text-xs text-red-500">Clear</button>
                </div>
              </div>

              <button onClick={handleSign} disabled={signing || !uploadedImage || !signerName || !signatureData}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                {signing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                {signing ? 'Combining...' : 'Sign & Combine Document'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {combinedPreviewUrl && (
              <div className="bg-green-50 dark:bg-green-950 rounded-2xl border border-green-200 p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="font-bold text-green-700">Document Signed!</p>
                <img src={combinedPreviewUrl} alt="Signed Document" className="max-h-72 mx-auto mt-4 rounded-xl border" />
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button onClick={viewSigned} className="py-3 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4" /> Open
                  </button>
                  <button onClick={() => downloadSigned()} className="py-3 rounded-xl bg-green-600 text-white font-bold flex items-center justify-center gap-2">
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
                    <p className="text-xs text-muted-foreground">Signed by {doc.signedBy}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => downloadSigned(doc.combinedDownloadUrl, doc.name)} className="p-2 text-green-500"><Download className="w-4 h-4" /></button>
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