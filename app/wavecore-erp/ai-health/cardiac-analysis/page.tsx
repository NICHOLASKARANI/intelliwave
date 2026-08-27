'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Activity, AlertTriangle, CheckCircle, Loader2, History, Gauge, HeartPulse, Waves, Zap } from 'lucide-react'

interface CardiacAnalysis {
  id: string
  ejectionFraction: number
  cardiacOutput: number
  strokeVolume: number
  pumpingEfficiency: number
  heartHealth: string
  rhythm: string
  confidence: number
  waveform: number[]
  timestamp: string
}

export default function CardiacPage() {
  const [monitoring, setMonitoring] = useState(false)
  const [results, setResults] = useState<CardiacAnalysis[]>([])
  const [latest, setLatest] = useState<CardiacAnalysis | null>(null)
  const [alertActive, setAlertActive] = useState(false)
  const [waveform, setWaveform] = useState<number[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let interval: any
    if (monitoring) {
      interval = setInterval(async () => {
        try {
          const res = await fetch('/api/wavecore/ai-health/cardiac-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sensor: 'cardiac-monitor' })
          })
          const d = await res.json()
          if (d.success) {
            setLatest(d.result)
            setResults(prev => [d.result, ...prev].slice(0, 30))
            setWaveform(d.result.waveform)
            if (d.result.heartHealth === 'CRITICAL') {
              setAlertActive(true)
              setTimeout(() => setAlertActive(false), 8000)
            }
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
      const y = canvas.height / 2 - value * 3
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
          <span className="text-sm">Cardiac Function Analysis</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <HeartPulse className="w-6 h-6 text-red-500" /> Cardiac Function Analysis
        </h1>

        {/* Alert */}
        {alertActive && (
          <div className="mb-6 p-6 rounded-2xl bg-red-600 text-white text-center animate-pulse">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
            <h2 className="text-2xl font-bold">⚠️ CRITICAL CARDIAC FUNCTION!</h2>
            <p className="mt-2">Immediate medical attention required</p>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6 text-center">
          {!monitoring ? (
            <button onClick={() => setMonitoring(true)}
              className="px-8 py-4 rounded-xl bg-red-600 text-white font-bold text-lg flex items-center gap-2 mx-auto">
              <Heart className="w-5 h-5" /> Start Cardiac Monitoring
            </button>
          ) : (
            <button onClick={() => setMonitoring(false)}
              className="px-8 py-4 rounded-xl bg-neutral-600 text-white font-bold text-lg">
              Stop Monitoring
            </button>
          )}
        </div>

        {/* Waveform */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Waves className="w-5 h-5 text-red-500" /> Heart Pumping Waveform
          </h2>
          <canvas ref={canvasRef} className="w-full h-[120px] bg-black rounded-xl" />
        </div>

        {/* Latest Result */}
        {latest && (
          <div className={`rounded-2xl border p-6 mb-6 ${latest.heartHealth === 'CRITICAL' ? 'bg-red-50 border-red-200' : latest.heartHealth === 'WARNING' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-3">
              {latest.heartHealth === 'CRITICAL' ? (
                <AlertTriangle className="w-8 h-8 text-red-600" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-600" />
              )}
              <div>
                <p className="font-bold text-lg">Heart Health: {latest.heartHealth}</p>
                <p className="text-sm text-muted-foreground">Rhythm: {latest.rhythm}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-center">
              <div className="p-3 rounded-xl bg-neutral-50">
                <Gauge className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                <p className="text-lg font-bold">{latest.ejectionFraction}%</p>
                <p className="text-xs text-muted-foreground">Ejection Fraction</p>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50">
                <Heart className="w-5 h-5 mx-auto mb-2 text-red-500" />
                <p className="text-lg font-bold">{latest.cardiacOutput} L/min</p>
                <p className="text-xs text-muted-foreground">Cardiac Output</p>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50">
                <Zap className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
                <p className="text-lg font-bold">{latest.strokeVolume} mL</p>
                <p className="text-xs text-muted-foreground">Stroke Volume</p>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50">
                <Activity className="w-5 h-5 mx-auto mb-2 text-green-500" />
                <p className="text-lg font-bold">{latest.pumpingEfficiency}%</p>
                <p className="text-xs text-muted-foreground">Pumping Efficiency</p>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-500" /> Analysis History
          </h2>
          {results.length === 0 ? (
            <p className="text-muted-foreground">No data yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                  <span className={r.heartHealth === 'CRITICAL' ? 'text-red-600 font-bold' : 'text-green-600'}>
                    {r.heartHealth} - EF: {r.ejectionFraction}%
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