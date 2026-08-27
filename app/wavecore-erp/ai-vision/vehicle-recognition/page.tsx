'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Car, Camera, Upload, Loader2, CheckCircle, History, Search, Tag, Truck, Bike } from 'lucide-react'

interface VehicleRecognition {
  id: string
  plateNumber: string
  brand: string
  model: string
  color: string
  vehicleType: string
  confidence: number
  timestamp: string
}

export default function VehicleRecognitionPage() {
  const [cameraActive, setCameraActive] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [results, setResults] = useState<VehicleRecognition[]>([])
  const [latest, setLatest] = useState<VehicleRecognition | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: 640, height: 480 } 
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setCameraActive(true)
    } catch {}
  }

  const stopCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop())
    setCameraActive(false)
  }

  const scanVehicle = async () => {
    setScanning(true)
    try {
      const res = await fetch('/api/wavecore/ai-vision/vehicle-recognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: 'vehicle-scan' })
      })
      const data = await res.json()
      if (data.success) {
        setLatest(data.vehicle)
        setResults(prev => [data.vehicle, ...prev].slice(0, 20))
      }
    } catch {} finally {
      setScanning(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const res = await fetch('/api/wavecore/ai-vision/vehicle-recognition', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: reader.result })
        })
        const data = await res.json()
        if (data.success) {
          setLatest(data.vehicle)
          setResults(prev => [data.vehicle, ...prev].slice(0, 20))
        }
      } catch {} finally {
        setScanning(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const vehicleIcon = (type: string) => {
    if (type.includes('Truck')) return Truck
    if (type.includes('Bike') || type.includes('Motorcycle')) return Bike
    return Car
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Vehicle Recognition</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Car className="w-6 h-6 text-blue-500" /> Vehicle & Plate Recognition
        </h1>

        {/* Scan Area */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
          <video ref={videoRef} autoPlay playsInline className="hidden" />
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!cameraActive ? (
              <button onClick={startCamera}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-2 justify-center">
                <Camera className="w-5 h-5" /> Start Camera
              </button>
            ) : (
              <>
                <button onClick={scanVehicle} disabled={scanning}
                  className="px-6 py-3 rounded-xl bg-green-600 text-white font-bold flex items-center gap-2 justify-center disabled:opacity-50">
                  {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  {scanning ? 'Scanning...' : 'Scan Vehicle'}
                </button>
                <button onClick={stopCamera} className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold">Stop</button>
              </>
            )}
            <label className="px-6 py-3 rounded-xl bg-purple-600 text-white font-bold cursor-pointer flex items-center gap-2 justify-center">
              <Upload className="w-5 h-5" /> Upload
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Latest Result */}
        {latest && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <div className="flex items-center gap-4">
              {(() => {
                const Icon = vehicleIcon(latest.vehicleType)
                return <Icon className="w-12 h-12 text-blue-500" />
              })()}
              <div>
                <p className="text-2xl font-mono font-bold text-blue-600">{latest.plateNumber}</p>
                <p className="font-bold text-lg">{latest.brand} {latest.model}</p>
                <p className="text-sm text-muted-foreground">{latest.color} | {latest.vehicleType}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500 ml-auto" />
            </div>
            <p className="text-sm text-muted-foreground mt-3 text-center">
              Confidence: {(latest.confidence * 100).toFixed(1)}%
            </p>
          </div>
        )}

        {/* History */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-500" /> Recognition History
          </h2>
          {results.length === 0 ? (
            <p className="text-muted-foreground">No vehicles recognized yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((v, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                  <div>
                    <span className="font-mono font-bold">{v.plateNumber}</span>
                    <span className="text-sm text-muted-foreground ml-2">{v.brand} {v.model}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{new Date(v.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}