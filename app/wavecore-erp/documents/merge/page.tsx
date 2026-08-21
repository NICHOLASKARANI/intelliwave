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
        const canvasWidth = 800
        const pageHeight = 1000
        const canvasHeight = pageHeight * files.length

        const mergedCanvas = document.createElement('canvas')
        mergedCanvas.width = canvasWidth
        mergedCanvas.height = canvasHeight
        const ctx = mergedCanvas.getContext('2d')

        if (!ctx) throw new Error('Canvas not supported')

        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)

        let loadedCount = 0

        files.forEach((file, index) => {
          if (file.type.startsWith('image/')) {
            // Handle IMAGES
            const img = new window.Image()
            img.onload = () => {
              drawOnCanvas(ctx, img, index, pageHeight, canvasWidth)
              loadedCount++
              if (loadedCount === files.length) finishMerge()
            }
            img.onerror = () => {
              setError('Error loading image: ' + file.name)
              setMerging(false)
            }
            img.src = file.dataUrl
          } else if (file.type === 'application/pdf') {
            // Handle PDFs - draw placeholder with PDF name (browser can't render PDF in canvas directly)
            ctx!.fillStyle = '#F8F8F8'
            ctx!.fillRect(0, index * pageHeight, canvasWidth, pageHeight)
            
            // Draw PDF icon representation
            ctx!.fillStyle = '#E0E0E0'
            ctx!.fillRect(300, index * pageHeight + 350, 200, 250)
            
            ctx!.fillStyle = '#FF4444'
            ctx!.font = 'bold 36px Arial'
            ctx!.fillText('PDF', 350, index * pageHeight + 480)
            
            ctx!.fillStyle = '#333333'
            ctx!.font = '14px Arial'
            ctx!.fillText(file.name.slice(0, 50), 250, index * pageHeight + 540)
            
            loadedCount++
            if (loadedCount === files.length) finishMerge()
          }
        })

        function drawOnCanvas(ctx: CanvasRenderingContext2D, img: HTMLImageElement, index: number, pageHeight: number, canvasWidth: number) {
          const maxWidth = 700
          const maxHeight = 900
          let drawWidth = img.width
          let drawHeight = img.height
          const ratio = Math.min(maxWidth / drawWidth, maxHeight / drawHeight)
          drawWidth = drawWidth * ratio
          drawHeight = drawHeight * ratio
          const x = (canvasWidth - drawWidth) / 2
          const y = (index * pageHeight) + (pageHeight - drawHeight) / 2
          ctx.drawImage(img, x, y, drawWidth, drawHeight)
        }

        function finishMerge() {
          const mergedDataUrl = mergedCanvas.toDataURL('image/png')
          setMergedUrl(mergedDataUrl)
          setMerging(false)
        }
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
    a.download = 'merged-documents.png'
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
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Layers className="w-7 h-7" /> Merge Files
          </h1>
        </div>

        {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm mb-4 text-center">{error}</div>}

        {!mergedUrl ? (
          <>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
              <label className="block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-3 text-pink-500" />
                <p className="font-medium">Upload files to merge</p>
                <p className="text-xs text-muted-foreground mt-1">Images (JPG/PNG) merge directly. PDFs shown as pages.</p>
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
                      <span className="text-xs text-muted-foreground">{file.type === 'application/pdf' ? 'PDF' : 'Image'}</span>
                      <button onClick={() => removeFile(file.id)} className="text-red-500"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                <button onClick={handleMerge} disabled={merging || files.length < 2}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                  {merging ? <Loader2 className="w-5 h-5 animate-spin" /> : <Layers className="w-5 h-5" />}
                  {merging ? 'Merging...' : 'Merge ' + files.length + ' Files'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-green-50 dark:bg-green-950 rounded-2xl border border-green-200 p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="font-bold text-green-700">Merged Successfully!</p>
            <img src={mergedUrl} alt="Merged" className="max-h-80 mx-auto mt-4 rounded-xl border" />
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button onClick={viewMerged} className="py-3 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center gap-2"><Eye className="w-4 h-4" /> View</button>
              <button onClick={downloadMerged} className="py-3 rounded-xl bg-green-600 text-white font-bold flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Download</button>
            </div>
            <button onClick={resetAll} className="text-sm text-indigo-500 mt-3">Merge More</button>
          </div>
        )}
      </main>
    </div>
  )
}