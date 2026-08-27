'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { User, Camera, Upload, Loader2, CheckCircle, History, Scan, Smile, Baby, PersonStanding } from 'lucide-react'

interface AgeEstimation {
  id: string
  estimatedAge: number
  ageRange: string
  gender: string
  confidence: number
  facialFeatures: string[]
  timestamp: string
}

export default function FacialAgePage() {
  const [cameraActive, setCameraActive] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [results, setResults] = useState<AgeEstimation[]>([])
  const [latest, setLatest] = useState<AgeEstimation | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
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

  const scanFace = async () => {
    if (!videoRef.current || !canvasRef.current) return
    setScanning(true)
    
    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(video, 0, 0)
    
    try {
      const res = await fetch('/api/wavecore/ai-vision/facial-age', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: canvas.toDataURL('image/jpeg') })
      })
      const data = await res.json()
      if (data.success) {
        setLatest(data.result)
        setResults(prev => [data.result, ...prev].slice(0, 20))
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
        const res = await fetch('/api/wavecore/ai-vision/facial-age', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: reader.result })
        })
        const data = await res.json()
        if (data.success) {
          setLatest(data.result)
          setResults(prev => [data.result, ...prev].slice(0, 20))
        }
      } catch {} finally {
        setScanning(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const ageIcon = (age: number) => {
    if (age < 13) return Baby
    if (age < 20) return Smile
    if (age < 60) return User
    return PersonStanding
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Facial Age Estimation</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Scan className="w-6 h-6 text-blue-500" /> Facial Age Estimation
        </h1>

        {/* Camera */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
          <video ref={videoRef} autoPlay playsInline className="hidden" />
          <canvas ref={canvasRef} className="hidden" />
          
          {!cameraActive ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 mx-auto mb-4 text-blue-500 opacity-30" />
              <button onClick={startCamera}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-2 mx-auto">
                <Camera className="w-5 h-5" /> Start Camera
              </button>
            </div>
          ) : (
            <div className="flex gap-3 justify-center">
              <button onClick={scanFace} disabled={scanning}
                className="px-6 py-3 rounded-xl bg-green-600 text-white font-bold flex items-center gap-2 disabled:opacity-50">
                {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Scan className="w-5 h-5" />}
                {scanning ? 'Scanning...' : 'Scan Face'}
              </button>
              <button onClick={stopCamera} className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold">Stop</button>
            </div>
          )}

          <div className="mt-4 text-center">
            <label className="cursor-pointer text-blue-600 text-sm">
              <Upload className="w-4 h-4 inline mr-1" /> Upload photo
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Latest Result */}
        {latest && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <div className="flex items-center gap-4">
              {(() => {
                const Icon = ageIcon(latest.estimatedAge)
                return <Icon className="w-12 h-12 text-blue-500" />
              })()}
              <div>
                <p className="text-4xl font-bold text-blue-600">{latest.estimatedAge} years</p>
                <p className="text-sm text-muted-foreground">Range: {latest.ageRange}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500 ml-auto" />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-3 rounded-xl bg-neutral-50 text-center">
                <p className="text-xs text-muted-foreground">Gender</p>
                <p className="font-bold text-lg">{latest.gender}</p>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50 text-center">
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className="font-bold text-lg">{(latest.confidence * 100).toFixed(1)}%</p>
              </div>
            </div>

            {/* Facial Features */}
            <div className="mt-3 flex flex-wrap gap-2">
              {latest.facialFeatures.map((feature, i) => (
                <span key={i} className="px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-xs">{feature}</span>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-500" /> Scan History
          </h2>
          {results.length === 0 ? (
            <p className="text-muted-foreground">No scans yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                  <span>{r.estimatedAge} years - {r.gender}</span>
                  <span className="text-sm text-muted-foreground">{new Date(r.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}