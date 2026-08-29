'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Camera, Upload, Loader2, CheckCircle, AlertTriangle, Scan, History, MapPin, Trash2, Globe, Car, Search } from 'lucide-react'

interface PlateResult {
  plateNumber: string
  country: string
  confidence: number
  vehicleType: string
  color: string
  timestamp: string
}

export default function LicensePlatePage() {
  const [cameraActive, setCameraActive] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [results, setResults] = useState<PlateResult[]>([])
  const [latest, setLatest] = useState<PlateResult | null>(null)
  const [error, setError] = useState('')
  const [manualPlate, setManualPlate] = useState('')
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
      setError('Camera access denied. Use manual entry.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop())
    setCameraActive(false)
  }

  const scanPlate = async () => {
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
      const res = await fetch('/api/wavecore/ai-vision/license-plates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: canvas.toDataURL('image/jpeg') })
      })
      const data = await res.json()
      
      if (data.success) {
        setLatest(data.plate)
        setResults(prev => [data.plate, ...prev].slice(0, 20))
      } else {
        setError(data.error || 'No plate detected')
      }
    } catch {
      setError('Scan failed')
    } finally {
      setScanning(false)
    }
  }

  const analyzeManualPlate = async () => {
    if (!manualPlate.trim()) {
      setError('Enter plate number')
      return
    }
    setScanning(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/ai-vision/license-plates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plateText: manualPlate })
      })
      const data = await res.json()
      if (data.success) {
        setLatest(data.plate)
        setResults(prev => [data.plate, ...prev].slice(0, 20))
        setManualPlate('')
      }
    } catch {
      setError('Analysis failed')
    } finally {
      setScanning(false)
    }
  }

  const deleteResult = (index: number) => {
    setResults(prev => prev.filter((_, i) => i !== index))
  }

  const clearAll = () => {
    setResults([])
    setLatest(null)
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

      <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Scan className="w-6 h-6 text-blue-500" /> License Plate Recognition
        </h1>

        {/* Manual Entry */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={manualPlate}
              onChange={(e) => setManualPlate(e.target.value)}
              placeholder="Enter plate number manually (e.g. KCA 234X)"
              className="flex-1 px-4 py-3 rounded-xl border"
            />
            <button onClick={analyzeManualPlate} disabled={scanning}
              className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              Analyze
            </button>
          </div>
        </div>

        {/* Camera */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
          <video ref={videoRef} autoPlay playsInline className="hidden" />
          <canvas ref={canvasRef} className="hidden" />
          
          {!cameraActive ? (
            <div className="text-center py-8">
              <Camera className="w-12 h-12 mx-auto mb-3 text-blue-500 opacity-30" />
              <button onClick={startCamera}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-2 mx-auto">
                <Camera className="w-5 h-5" /> Start Camera
              </button>
            </div>
          ) : (
            <div className="flex gap-3 justify-center">
              <button onClick={scanPlate} disabled={scanning}
                className="px-6 py-3 rounded-xl bg-green-600 text-white font-bold flex items-center gap-2 disabled:opacity-50">
                {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Scan className="w-5 h-5" />}
                {scanning ? 'Scanning...' : 'Scan Plate'}
              </button>
              <button onClick={stopCamera} className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold">Stop</button>
            </div>
          )}
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-600">{error}</div>}

        {/* Latest Result */}
        {latest && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Car className="w-10 h-10 text-blue-500" />
                <div>
                  <p className="text-3xl font-mono font-bold text-blue-600">{latest.plateNumber}</p>
                  <p className="text-sm text-muted-foreground">{latest.country}</p>
                </div>
              </div>
              <button onClick={() => setLatest(null)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Vehicle</p>
                <p className="font-bold">{latest.vehicleType}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Color</p>
                <p className="font-bold">{latest.color}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className="font-bold">{(latest.confidence * 100).toFixed(0)}%</p>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        {results.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-purple-500" /> Recognition History ({results.length})
              </h2>
              <button onClick={clearAll} className="text-sm text-red-600 flex items-center gap-1">
                <Trash2 className="w-4 h-4" /> Clear All
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                  <div>
                    <span className="font-mono font-bold">{r.plateNumber}</span>
                    <span className="text-sm text-muted-foreground ml-2">{r.country} | {r.vehicleType}</span>
                  </div>
                  <button onClick={() => deleteResult(i)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}