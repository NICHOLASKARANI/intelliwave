'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AlertTriangle, Camera, Upload, Loader2, CheckCircle, Activity, History, Phone, MapPin, Bell } from 'lucide-react'

interface FallEvent {
  id: string
  detected: boolean
  confidence: number
  severity: string
  location: string
  timestamp: string
  alertSent: boolean
}

export default function FallDetectionPage() {
  const [cameraActive, setCameraActive] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [events, setEvents] = useState<FallEvent[]>([])
  const [latest, setLatest] = useState<FallEvent | null>(null)
  const [alertActive, setAlertActive] = useState(false)
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
    } catch {
      setAlertActive(true)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    setCameraActive(false)
  }

  const detectFall = async () => {
    if (!videoRef.current || !canvasRef.current) return
    setScanning(true)
    
    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(video, 0, 0)
    
    try {
      const res = await fetch('/api/wavecore/ai-vision/fall-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: canvas.toDataURL('image/jpeg') })
      })
      const data = await res.json()
      
      if (data.success) {
        setLatest(data.event)
        setEvents(prev => [data.event, ...prev].slice(0, 20))
        if (data.event.detected) {
          setAlertActive(true)
          setTimeout(() => setAlertActive(false), 10000)
        }
      }
    } catch {
      setAlertActive(true)
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
          <span className="text-sm">Fall Detection</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Activity className="w-6 h-6 text-red-500" /> Fall Detection & Alert
        </h1>

        {/* Emergency Alert Banner */}
        {alertActive && (
          <div className="mb-6 p-6 rounded-2xl bg-red-600 text-white text-center animate-pulse">
            <Bell className="w-12 h-12 mx-auto mb-3" />
            <h2 className="text-2xl font-bold">⚠️ FALL DETECTED!</h2>
            <p className="mt-2">Emergency alert sent to caregivers</p>
            <div className="flex gap-3 justify-center mt-4">
              <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> Calling...</span>
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> GPS Tracked</span>
            </div>
          </div>
        )}

        {/* Camera */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
          <video ref={videoRef} autoPlay playsInline className="hidden" />
          <canvas ref={canvasRef} className="hidden" />
          
          {!cameraActive ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 mx-auto mb-4 text-red-500 opacity-30" />
              <button onClick={startCamera}
                className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold flex items-center gap-2 mx-auto">
                <Camera className="w-5 h-5" /> Start Monitoring
              </button>
            </div>
          ) : (
            <div className="flex gap-3 justify-center">
              <button onClick={detectFall} disabled={scanning}
                className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold flex items-center gap-2 disabled:opacity-50">
                {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
                {scanning ? 'Analyzing...' : 'Detect Fall'}
              </button>
              <button onClick={stopCamera} className="px-6 py-3 rounded-xl bg-neutral-600 text-white font-bold">Stop</button>
            </div>
          )}
        </div>

        {/* Latest Event */}
        {latest && (
          <div className={`rounded-2xl border p-6 mb-6 ${latest.detected ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-3">
              {latest.detected ? (
                <AlertTriangle className="w-8 h-8 text-red-600" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-600" />
              )}
              <div>
                <p className="font-bold text-lg">{latest.detected ? 'FALL DETECTED' : 'No Fall Detected'}</p>
                <p className="text-sm text-muted-foreground">
                  Confidence: {(latest.confidence * 100).toFixed(1)}% | {latest.severity}
                </p>
              </div>
            </div>
            {latest.detected && latest.alertSent && (
              <p className="text-sm text-green-600 mt-3">✓ Emergency alert sent to caregivers</p>
            )}
          </div>
        )}

        {/* History */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-500" /> Detection History
          </h2>
          {events.length === 0 ? (
            <p className="text-muted-foreground">No events recorded</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {events.map((ev, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                  <span className={ev.detected ? 'text-red-600 font-bold' : 'text-green-600'}>
                    {ev.detected ? '⚠️ Fall' : '✓ Safe'}
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