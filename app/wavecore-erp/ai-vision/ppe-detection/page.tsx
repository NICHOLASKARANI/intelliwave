'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { HardHat, Camera, Upload, Loader2, AlertTriangle, CheckCircle, Shield, Users, History } from 'lucide-react'

interface PPEDetection {
  id: string
  hardHat: boolean
  safetyVest: boolean
  gloves: boolean
  boots: boolean
  confidence: number
  timestamp: string
  workerCount: number
}

export default function PPEDetectionPage() {
  const [cameraActive, setCameraActive] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [detections, setDetections] = useState<PPEDetection[]>([])
  const [latest, setLatest] = useState<PPEDetection | null>(null)
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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    setCameraActive(false)
  }

  const scanPPE = async () => {
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
      const res = await fetch('/api/wavecore/ai-vision/ppe-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: canvas.toDataURL('image/jpeg') })
      })
      const data = await res.json()
      
      if (data.success) {
        setLatest(data.detection)
        setDetections(prev => [data.detection, ...prev].slice(0, 20))
      } else {
        setError(data.error || 'No workers detected')
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
    
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const res = await fetch('/api/wavecore/ai-vision/ppe-detection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: reader.result })
        })
        const data = await res.json()
        if (data.success) {
          setLatest(data.detection)
          setDetections(prev => [data.detection, ...prev].slice(0, 20))
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
          <span className="text-sm">PPE Detection</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <HardHat className="w-6 h-6 text-yellow-500" /> Construction Site PPE Detection
        </h1>

        {/* Camera */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
          <video ref={videoRef} autoPlay playsInline className="hidden" />
          <canvas ref={canvasRef} className="hidden" />
          
          {!cameraActive ? (
            <div className="text-center py-12">
              <HardHat className="w-16 h-16 mx-auto mb-4 text-yellow-500 opacity-30" />
              <button onClick={startCamera}
                className="px-6 py-3 rounded-xl bg-yellow-600 text-white font-bold flex items-center gap-2 mx-auto">
                <Camera className="w-5 h-5" /> Start Camera
              </button>
            </div>
          ) : (
            <div className="flex gap-3 justify-center">
              <button onClick={scanPPE} disabled={scanning}
                className="px-6 py-3 rounded-xl bg-green-600 text-white font-bold flex items-center gap-2 disabled:opacity-50">
                {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                {scanning ? 'Scanning...' : 'Scan PPE'}
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

        {/* Latest Result */}
        {latest && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" /> Latest Detection - {latest.workerCount} Workers
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <PPEStatus icon={HardHat} label="Hard Hat" status={latest.hardHat} />
              <PPEStatus icon={Shield} label="Safety Vest" status={latest.safetyVest} />
              <PPEStatus icon={CheckCircle} label="Gloves" status={latest.gloves} />
              <PPEStatus icon={CheckCircle} label="Boots" status={latest.boots} />
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Confidence: {(latest.confidence * 100).toFixed(1)}%
            </p>
          </div>
        )}

        {/* History */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-500" /> Detection History
          </h2>
          {detections.length === 0 ? (
            <p className="text-muted-foreground">No detections yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {detections.map((det, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                  <span>{det.workerCount} workers</span>
                  <span className={`text-sm ${det.hardHat ? 'text-green-600' : 'text-red-600'}`}>
                    {det.hardHat ? '✅ PPE Compliant' : '⚠️ Missing PPE'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function PPEStatus({ icon: Icon, label, status }: { icon: any; label: string; status: boolean }) {
  return (
    <div className={`p-4 rounded-xl border text-center ${status ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <Icon className={`w-6 h-6 mx-auto mb-2 ${status ? 'text-green-600' : 'text-red-600'}`} />
      <p className="text-sm font-bold">{label}</p>
      <p className={`text-xs ${status ? 'text-green-600' : 'text-red-600'}`}>
        {status ? '✓ Detected' : '✗ Missing'}
      </p>
    </div>
  )
}