'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Barcode, Camera, Upload, Loader2, CheckCircle, History, Package, Tag, Search, Box } from 'lucide-react'

interface ProductInfo {
  id: string
  barcode: string
  productName: string
  category: string
  price: number
  quantity: number
  manufacturer: string
  confidence: number
  timestamp: string
}

export default function BarcodePage() {
  const [cameraActive, setCameraActive] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [products, setProducts] = useState<ProductInfo[]>([])
  const [latest, setLatest] = useState<ProductInfo | null>(null)
  const [error, setError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: 640, height: 480 } 
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setCameraActive(true)
    } catch {
      setError('Camera access denied')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop())
    setCameraActive(false)
  }

  const scanBarcode = async () => {
    if (!videoRef.current || !canvasRef.current) return
    setScanning(true)
    setError('')
    
    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(video, 0, 0)
    
    try {
      const res = await fetch('/api/wavecore/ai-vision/barcode-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: canvas.toDataURL('image/jpeg') })
      })
      const data = await res.json()
      
      if (data.success) {
        setLatest(data.product)
        setProducts(prev => [data.product, ...prev].slice(0, 20))
      } else {
        setError(data.error || 'No barcode detected')
      }
    } catch {
      setError('Scan failed')
    } finally {
      setScanning(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    setError('')
    
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const res = await fetch('/api/wavecore/ai-vision/barcode-detection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: reader.result })
        })
        const data = await res.json()
        if (data.success) {
          setLatest(data.product)
          setProducts(prev => [data.product, ...prev].slice(0, 20))
        } else {
          setError(data.error || 'No barcode detected')
        }
      } catch {
        setError('Upload scan failed')
      } finally {
        setScanning(false)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Barcode Detection</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Barcode className="w-6 h-6 text-blue-500" /> Barcode & Product Recognition
        </h1>

        {/* Camera */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
          <video ref={videoRef} autoPlay playsInline className="hidden" />
          <canvas ref={canvasRef} className="hidden" />
          
          {!cameraActive ? (
            <div className="text-center py-12">
              <Barcode className="w-16 h-16 mx-auto mb-4 text-blue-500 opacity-30" />
              <button onClick={startCamera}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-2 mx-auto">
                <Camera className="w-5 h-5" /> Start Scanner
              </button>
            </div>
          ) : (
            <div className="flex gap-3 justify-center">
              <button onClick={scanBarcode} disabled={scanning}
                className="px-6 py-3 rounded-xl bg-green-600 text-white font-bold flex items-center gap-2 disabled:opacity-50">
                {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Barcode className="w-5 h-5" />}
                {scanning ? 'Scanning...' : 'Scan Barcode'}
              </button>
              <button onClick={stopCamera} className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold">Stop</button>
            </div>
          )}

          <div className="mt-4 text-center">
            <label className="cursor-pointer text-blue-600 text-sm">
              <Upload className="w-4 h-4 inline mr-1" /> Upload image
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>
        )}

        {/* Latest Product */}
        {latest && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <div className="flex items-center gap-4">
              <Box className="w-12 h-12 text-blue-500" />
              <div>
                <p className="font-mono text-sm text-muted-foreground">Barcode: {latest.barcode}</p>
                <p className="text-2xl font-bold">{latest.productName}</p>
                <p className="text-sm text-muted-foreground">{latest.manufacturer}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500 ml-auto" />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="font-bold">{latest.category}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Price</p>
                <p className="font-bold text-green-600">KSh {latest.price.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Stock</p>
                <p className="font-bold">{latest.quantity} units</p>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-500" /> Scan History
          </h2>
          {products.length === 0 ? (
            <p className="text-muted-foreground">No products scanned</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {products.map((p, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                  <span className="font-mono">{p.barcode} - {p.productName}</span>
                  <span className="text-sm text-muted-foreground">{new Date(p.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}