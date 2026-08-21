'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Layers, Download, Upload, FileText, X, Loader2, CheckCircle } from 'lucide-react'

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
  const [mergedName, setMergedName] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList) return
    setError('')

    Array.from(fileList).forEach(file => {
      // Accept images and PDFs
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        setError('Please upload images (JPG/PNG) or PDFs')
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

  // REAL MERGE: Combine all images into one canvas
  const handleMerge = () => {
    if (files.length < 2) {
      setError('Please upload at least 2 files to merge')
      return
    }

    setMerging(true)
    setError('')

    setTimeout(() => {
      try {
        // Calculate total canvas height
        const canvasWidth = 800
        const pageHeight = 1000
        const canvasHeight = pageHeight * files.length

        const mergedCanvas = document.createElement('canvas')
        mergedCanvas.width = canvasWidth
        mergedCanvas.height = canvasHeight
        const ctx = mergedCanvas.getContext('2d')

        if (!ctx) throw new Error('Canvas not supported')

        // White background
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)

        // Load and draw each file
        let loadedCount = 0

        files.forEach((file, index) => {
          const img = new window.Image()
          
          img.onload = () => {
            try {
              // Calculate fit
              const maxWidth = 700
              const maxHeight = 900
              let drawWidth = img.width
              let drawHeight = img.height
              
              const widthRatio = maxWidth / drawWidth
              const heightRatio = maxHeight / drawHeight
              const ratio = Math.min(widthRatio, heightRatio)
              
              drawWidth = drawWidth * ratio
              drawHeight = drawHeight * ratio
              
              // Center each page
              const x = (canvasWidth - drawWidth) / 2
              const y = (index * pageHeight) + (pageHeight - drawHeight) / 2

              // Draw the file
              ctx.drawImage(img, x, y, drawWidth, drawHeight)

              // Add page separator
              if (index < files.length - 1) {
                ctx.fillStyle = '#CCCCCC'
                ctx.fillRect(0, (index + 1) * pageHeight - 1, canvasWidth, 2)
              }

              loadedCount++

              // Check if all loaded
              if (loadedCount === files.length) {
                // Generate merged result
                const mergedDataUrl = mergedCanvas.toDataURL('image/png')
                setMergedUrl(mergedDataUrl)
                setMergedName('merged-document-' + Date.now() + '.png')
                setMerging(false)
              }
            } catch (drawError) {
              setError('Error drawing file: ' + file.name)
              setMerging(false)
            }
          }
          
          img.onerror = () => {
            setError('Error loading file: ' + file.name + '. Try uploading JPG or PNG images.')
            setMerging(false)
          }
          
          img.src = file.dataUrl
        })
      } catch (outerError) {
        setError('Error merging: ' + (outerError as Error).message)
        setMerging(false)
      }
    }, 1000)
  }

  const downloadMerged = () => {
    if (!mergedUrl) return
    const a = document.createElement('a')
    a.href = mergedUrl
    a.download = mergedName || 'merged-document.png'
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
    setMergedName('')
    setError('')
  }

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Merge PDF', '='.repeat(50), `Files: ${files.map(f => f.name).join(', ')}`, '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'merge-report.pdf'; a.click()
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
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Layers className="w-7 h-7" /> Merge Documents</h1>
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm mb-4 text-center">{error}</div>
        )}

        {!mergedUrl ? (
          <>
            {/* Upload */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
              <label className="block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-3 text-pink-500" />
                <p className="font-medium">Upload files to merge (JPG/PNG images)</p>
                <p className="text-xs text-muted-foreground mt-1">Upload 2+ images to combine into one</p>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,.pdf" multiple onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-6">
                <p className="font-bold mb-3">Files to Merge ({files.length})</p>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={file.id} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                      <span className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center text-sm font-bold">{index + 1}</span>
                      <FileText className="w-4 h-4 text-pink-500" />
                      <span className="text-sm flex-1 truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                      <button onClick={() => removeFile(file.id)} className="text-red-500"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>

                <button onClick={handleMerge} disabled={merging || files.length < 2}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2 mt-4">
                  {merging ? <Loader2 className="w-5 h-5 animate-spin" /> : <Layers className="w-5 h-5" />}
                  {merging ? 'Merging...' : `Merge ${files.length} Files`}
                </button>
              </div>
            )}
          </>
        ) : (
          /* Merged Result */
          <div className="bg-green-50 dark:bg-green-950 rounded-2xl border border-green-200 p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="font-bold text-green-700">Documents Merged Successfully!</p>
            <p className="text-sm text-green-600">All {files.length} files combined into one</p>
            
            <img src={mergedUrl} alt="Merged Document" className="max-h-96 mx-auto mt-4 rounded-xl border" />
            
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button onClick={viewMerged} className="py-3 rounded-xl bg-indigo-600 text-white font-bold">Open</button>
              <button onClick={downloadMerged} className="py-3 rounded-xl bg-green-600 text-white font-bold flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download Merged
              </button>
            </div>
            <button onClick={resetAll} className="text-sm text-indigo-500 mt-3">Merge more files</button>
          </div>
        )}
      </main>
    </div>
  )
}