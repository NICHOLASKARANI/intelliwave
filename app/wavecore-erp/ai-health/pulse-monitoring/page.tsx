'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Camera, Activity, AlertTriangle, CheckCircle, History, Gauge, User, Waves } from 'lucide-react'

interface PulseData {
  id: string
  pulseRate: number
  personCount: number
  stressLevel: string
  confidence: number
  timestamp: string
  waveform: number[]
}

export default function PulseMonitoringPage() {
  const [monitoring, setMonitoring] = useState(false)
  const [data, setData] = useState<PulseData[]>([])
  const [latest, setLatest] = useState<PulseData | null>(null)
  const [pulseRate, setPulseRate] = useState(72)
  const [waveform, setWaveform] = useState<number[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let interval: any
    if (monitoring) {
      interval = setInterval(async () => {
        try {
          const res = await fetch('/api/wavecore/ai-health/pulse-monitoring', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sensor: 'camera' })
          })
          const d = await res.json()
          if (d.success) {
            setLatest(d.data)
            setData(prev => [d.data, ...prev].slice(0, 30))
            setPulseRate(d.data.pulseRate)
            setWaveform(d.data.waveform)
          }
        } catch {}
      }, 2000)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [monitoring])

  // Draw waveform
  useEffect(() => {
    if (!canvasRef.current || waveform.length === 0) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = canvas.offsetWidth
    canvas.height = 120
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 2
    ctx.beginPath()
    
    waveform.forEach((value, i) => {
      const x = (i / waveform.length) * canvas.width
      const y = canvas.height / 2 - value * 2
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
          <span className="text-sm">Pulse Rate Monitoring</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500" /> Contactless Pulse Rate Monitoring
        </h1>

        {/* Controls */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6 text-center">
          {!monitoring ? (
            <button onClick={() => setMonitoring(true)}
              className="px-8 py-4 rounded-xl bg-red-600 text-white font-bold text-lg flex items-center gap-2 mx-auto">
              <Camera className="w-5 h-5" /> Start Contactless Monitoring
            </button>
          ) : (
            <button onClick={() => setMonitoring(false)}
              className="px-8 py-4 rounded-xl bg-neutral-600 text-white font-bold text-lg">
              Stop Monitoring
            </button>
          )}
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
            <Heart className="w-8 h-8 mx-auto mb-3 text-red-500" />
            <p className="text-4xl font-bold text-red-600">{pulseRate}</p>
            <p className="text-sm text-muted-foreground">Pulse Rate (BPM)</p>
          </div>
          <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
            <User className="w-8 h-8 mx-auto mb-3 text-blue-500" />
            <p className="text-4xl font-bold text-blue-600">{latest?.personCount || 0}</p>
            <p className="text-sm text-muted-foreground">Persons Detected</p>
          </div>
          <div className={`p-6 rounded-2xl border text-center ${latest?.stressLevel === 'HIGH' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <Activity className={`w-8 h-8 mx-auto mb-3 ${latest?.stressLevel === 'HIGH' ? 'text-red-600' : 'text-green-600'}`} />
            <p className="text-4xl font-bold">{latest?.stressLevel || 'NORMAL'}</p>
            <p className="text-sm text-muted-foreground">Stress Level</p>
          </div>
        </div>

        {/* Pulse Waveform */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Waves className="w-5 h-5 text-red-500" /> Pulse Waveform
          </h2>
          <canvas ref={canvasRef} className="w-full h-[120px] bg-black rounded-xl" />
        </div>

        {/* History */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-500" /> Monitoring History
          </h2>
          {data.length === 0 ? (
            <p className="text-muted-foreground">No data yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.map((d, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                  <span>{d.pulseRate} BPM | {d.personCount} person(s) | {d.stressLevel}</span>
                  <span className="text-sm text-muted-foreground">{new Date(d.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}