'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, Camera, AlertTriangle, CheckCircle, Loader2, Bell, Coffee, History, Gauge } from 'lucide-react'

interface DrowsinessEvent {
  id: string
  drowsy: boolean
  eyeClosure: number
  yawnCount: number
  headNodding: boolean
  alertLevel: string
  confidence: number
  timestamp: string
}

export default function DrowsinessPage() {
  const [cameraActive, setCameraActive] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [events, setEvents] = useState<DrowsinessEvent[]>([])
  const [latest, setLatest] = useState<DrowsinessEvent | null>(null)
  const [alertActive, setAlertActive] = useState(false)
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
    } catch {
      // Handle camera error
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    setCameraActive(false)
  }

  const detectDrowsiness = async () => {
    if (!videoRef.current || !canvasRef.current) return
    setScanning(true)
    
    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(video, 0, 0)
    
    try {
      const res = await fetch('/api/wavecore/ai-vision/drowsiness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: canvas.toDataURL('image/jpeg') })
      })
      const data = await res.json()
      
      if (data.success) {
        setLatest(data.event)
        setEvents(prev => [data.event, ...prev].slice(0, 20))
        if (data.event.drowsy) {
          setAlertActive(true)
          setTimeout(() => setAlertActive(false), 10000)
        }
      }
    } catch {
      // Handle error
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Driver Drowsiness</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Eye className="w-6 h-6 text-yellow-500" /> Driver Drowsiness Detection
        </h1>

        {/* Alert Banner */}
        {alertActive && (
          <div className="mb-6 p-6 rounded-2xl bg-yellow-500 text-white text-center animate-pulse">
            <Bell className="w-12 h-12 mx-auto mb-3" />
            <h2 className="text-2xl font-bold">⚠️ DROWSY DRIVER!</h2>
            <p className="mt-2">Alert sent - Recommend rest stop</p>
            <div className="flex gap-3 justify-center mt-4">
              <Coffee className="w-5 h-5" />
              <span>Rest recommended</span>
            </div>
          </div>
        )}

        {/* Camera */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
          <video ref={videoRef} autoPlay playsInline className="hidden" />
          <canvas ref={canvasRef} className="hidden" />
          
          {!cameraActive ? (
            <div className="text-center py-12">
              <Eye className="w-16 h-16 mx-auto mb-4 text-yellow-500 opacity-30" />
              <button onClick={startCamera}
                className="px-6 py-3 rounded-xl bg-yellow-600 text-white font-bold flex items-center gap-2 mx-auto">
                <Camera className="w-5 h-5" /> Start Monitoring
              </button>
            </div>
          ) : (
            <div className="flex gap-3 justify-center">
              <button onClick={detectDrowsiness} disabled={scanning}
                className="px-6 py-3 rounded-xl bg-yellow-600 text-white font-bold flex items-center gap-2 disabled:opacity-50">
                {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
                {scanning ? 'Analyzing...' : 'Detect Drowsiness'}
              </button>
              <button onClick={stopCamera} className="px-6 py-3 rounded-xl bg-neutral-600 text-white font-bold">Stop</button>
            </div>
          )}
        </div>

        {/* Latest Result */}
        {latest && (
          <div className={`rounded-2xl border p-6 mb-6 ${latest.drowsy ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-3">
              {latest.drowsy ? (
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-600" />
              )}
              <div>
                <p className="font-bold text-lg">{latest.drowsy ? 'DROWSY' : 'ALERT'}</p>
                <p className="text-sm text-muted-foreground">
                  Eye Closure: {(latest.eyeClosure * 100).toFixed(0)}% | Yawns: {latest.yawnCount}
                </p>
                <p className="text-sm text-muted-foreground">
                  Head Nodding: {latest.headNodding ? 'Yes' : 'No'} | Level: {latest.alertLevel}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-500" /> Detection History
          </h2>
          {events.length === 0 ? (
            <p className="text-muted-foreground">No events</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {events.map((ev, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                  <span className={ev.drowsy ? 'text-yellow-600 font-bold' : 'text-green-600'}>
                    {ev.drowsy ? '⚠️ Drowsy' : '✓ Alert'} - {ev.alertLevel}
                  </span>
                  <span className="text-sm text-muted-foreground">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}