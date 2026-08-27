'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Activity, Loader2, CheckCircle, AlertTriangle, History, Gauge, Pulse, HeartPulse } from 'lucide-react'

interface ECGResult {
  id: string
  heartRate: number
  rhythm: string
  arrhythmiaType: string
  severity: string
  confidence: number
  timestamp: string
  waveform: number[]
}

export default function ECGPage() {
  const [monitoring, setMonitoring] = useState(false)
  const [results, setResults] = useState<ECGResult[]>([])
  const [latest, setLatest] = useState<ECGResult | null>(null)
  const [heartRate, setHeartRate] = useState(72)
  const [waveform, setWaveform] = useState<number[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startMonitoring = () => {
    setMonitoring(true)
    // Simulate ECG waveform
    const interval = setInterval(() => {
      const newRate = 60 + Math.floor(Math.random() * 40)
      setHeartRate(newRate)
      
      const newWaveform = Array.from({ length: 100 }, (_, i) => 
        Math.sin(i * 0.3) * 30 + Math.sin(i * 0.1) * 10 + Math.random() * 5
      )
      setWaveform(newWaveform)
    }, 1000)

    if (canvasRef.current) {
      (canvasRef.current as any).ecgInterval = interval
    }
  }

  const stopMonitoring = () => {
    setMonitoring(false)
    if (canvasRef.current) {
      const interval = (canvasRef.current as any).ecgInterval
      if (interval) clearInterval(interval)
    }
  }

  const detectArrhythmia = async () => {
    try {
      const res = await fetch('/api/wavecore/ai-health/ecg-arrhythmia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heartRate, waveform })
      })
      const data = await res.json()
      if (data.success) {
        setLatest(data.result)
        setResults(prev => [data.result, ...prev].slice(0, 20))
      }
    } catch {}
  }

  // Draw waveform
  useEffect(() => {
    if (!canvasRef.current || waveform.length === 0) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = canvas.offsetWidth
    canvas.height = 150
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 2
    ctx.beginPath()
    
    waveform.forEach((value, i) => {
      const x = (i / waveform.length) * canvas.width
      const y = canvas.height / 2 - value
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
  }, [waveform])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">ECG Arrhythmia Detection</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <HeartPulse className="w-6 h-6 text-red-500" /> ECG Arrhythmia Detection
        </h1>

        {/* Live Monitor */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold flex items-center gap-2">
              <Pulse className="w-5 h-5 text-red-500" /> Live ECG
            </h2>
            <span className="text-2xl font-bold text-red-600">{heartRate} BPM</span>
          </div>
          
          {/* ECG Waveform */}
          <canvas ref={canvasRef} className="w-full h-[150px] bg-black rounded-xl mb-4" />
          
          <div className="flex gap-3 justify-center">
            {!monitoring ? (
              <button onClick={startMonitoring}
                className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold flex items-center gap-2">
                <Heart className="w-5 h-5" /> Start Monitoring
              </button>
            ) : (
              <button onClick={stopMonitoring}
                className="px-6 py-3 rounded-xl bg-yellow-600 text-white font-bold">Stop</button>
            )}
            <button onClick={detectArrhythmia} disabled={!monitoring}
              className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              <Activity className="w-5 h-5" /> Detect Arrhythmia
            </button>
          </div>
        </div>

        {/* Latest Result */}
        {latest && (
          <div className={`rounded-2xl border p-6 mb-6 ${latest.severity === 'CRITICAL' ? 'bg-red-50 border-red-200' : latest.severity === 'WARNING' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-3">
              {latest.severity === 'CRITICAL' ? (
                <AlertTriangle className="w-8 h-8 text-red-600" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-600" />
              )}
              <div>
                <p className="font-bold text-lg">{latest.rhythm}</p>
                <p className="text-sm text-muted-foreground">
                  HR: {latest.heartRate} BPM | {latest.arrhythmiaType}
                </p>
                <p className="text-sm text-muted-foreground">
                  Confidence: {(latest.confidence * 100).toFixed(1)}%
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
          {results.length === 0 ? (
            <p className="text-muted-foreground">No detections yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                  <span className={`font-bold ${r.severity === 'CRITICAL' ? 'text-red-600' : 'text-green-600'}`}>
                    {r.rhythm} - {r.heartRate} BPM
                  </span>
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