'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Camera, Upload, Loader2, CheckCircle, AlertTriangle, Scan, History, MapPin } from 'lucide-react'

interface PlateResult {
  plateNumber: string
  confidence: number
  vehicleType: string
  timestamp: string
  location: string
}

export default function LicensePlatePage() {
  const [cameraActive, setCameraActive] = useState(false)
  const [results, setResults] = useState<PlateResult[]>([])
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [recentDetections, setRecentDetections] = useState<PlateResult[]>([])
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
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraActive(true)
    } catch (err) {
      setError('Camera access denied. Please allow camera permission.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return
    setScanning(true)
    setError('')
    
    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(video, 0, 0)
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8)
    
    try {
      const res = await fetch('/api/wavecore/ai-vision/license-plates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData })
      })
      const data = await res.json()
      
      if (data.success && data.plate) {
        const newResult: PlateResult = {
          plateNumber: data.plate.plateNumber,
          confidence: data.plate.confidence,
          vehicleType: data.plate.vehicleType,
          timestamp: new Date().toISOString(),
          location: data.plate.location || 'Unknown'
        }
        setResults(prev => [newResult, ...prev])
        setRecentDetections(prev => [newResult, ...prev].slice(0, 20))
      } else {
        setError(data.error || 'No plate detected. Try again.')
      }
    } catch (err) {
      setError('Scan failed. Check connection.')
    } finally {
      setScanning(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    setError('')
    
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const res = await fetch('/api/wavecore/ai-vision/license-plates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: reader.result })
        })
        const data = await res.json()
        
        if (data.success && data.plate) {
          const newResult: PlateResult = {
            plateNumber: data.plate.plateNumber,
            confidence: data.plate.confidence,
            vehicleType: data.plate.vehicleType,
            timestamp: new Date().toISOString(),
            location: 'Uploaded Image'
          }
          setResults(prev => [newResult, ...prev])
          setRecentDetections(prev => [newResult, ...prev].slice(0, 20))
        } else {
          setError(data.error || 'No plate detected')
        }
      } catch (err) {
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
          <span className="text-sm">License Plate Recognition</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Scan className="w-6 h-6 text-blue-500" /> License Plate Recognition
        </h1>

        {/* Camera Area */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
          <div className="relative">
            <video ref={videoRef} autoPlay playsInline className="w-full max-w-lg mx-auto rounded-xl hidden" />
            <canvas ref={canvasRef} className="hidden" />
            
            {!cameraActive && (
              <div className="text-center py-12">
                <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                <p className="text-muted-foreground mb-4">Start camera to scan license plates</p>
                <button onClick={startCamera}
                  className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 flex items-center gap-2 mx-auto">
                  <Camera className="w-5 h-5" /> Start Camera
                </button>
              </div>
            )}
            
            {cameraActive && (
              <div className="flex gap-3 justify-center">
                <button onClick={captureAndScan} disabled={scanning}
                  className="px-6 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 flex items-center gap-2 disabled:opacity-50">
                  {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Scan className="w-5 h-5" />}
                  {scanning ? 'Scanning...' : 'Scan Plate'}
                </button>
                <button onClick={stopCamera}
                  className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700">
                  Stop Camera
                </button>
              </div>
            )}
          </div>

          {/* Upload alternative */}
          <div className="mt-4 text-center">
            <label className="cursor-pointer text-blue-600 hover:text-blue-700 text-sm">
              <Upload className="w-4 h-4 inline mr-1" />
              Or upload image
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> {error}
          </div>
        )}

        {/* Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Latest Detection */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
            <h2 className="font-bold text-lg mb-4">Latest Detection</h2>
            {results.length === 0 ? (
              <p className="text-muted-foreground">No plates detected yet</p>
            ) : (
              <div className="text-center">
                <p className="text-4xl font-mono font-bold text-blue-600">{results[0].plateNumber}</p>
                <p className="text-sm text-muted-foreground mt-2">Confidence: {(results[0].confidence * 100).toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Vehicle: {results[0].vehicleType}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 justify-center">
                  <MapPin className="w-3 h-3" /> {results[0].location}
                </p>
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mt-3" />
              </div>
            )}
          </div>

          {/* History */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-purple-500" /> Detection History
            </h2>
            {recentDetections.length === 0 ? (
              <p className="text-muted-foreground">No history</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentDetections.map((det, i) => (
                  <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                    <span className="font-mono font-bold">{det.plateNumber}</span>
                    <span className="text-sm text-muted-foreground">{new Date(det.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}