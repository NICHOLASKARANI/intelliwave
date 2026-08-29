'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Activity, AlertTriangle, CheckCircle, Loader2, History, Gauge, HeartPulse, Waves, Zap, Radio, RefreshCw, Trash2 } from 'lucide-react'

export default function ECGPage() {
  const [monitoring, setMonitoring] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [latest, setLatest] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState('')
  const [waveform, setWaveform] = useState<number[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intervalRef = useRef<any>(null)

  const fetchECG = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/ai-health/ecg-arrhythmia')
      const d = await res.json()
      if (d.success) {
        setLatest(d.result)
        setResults(prev => [d.result, ...prev].slice(0, 20))
        setWaveform(d.result.waveform || [])
        setLastUpdated(new Date().toLocaleTimeString())
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchECG()
  }, [])

  useEffect(() => {
    if (monitoring) {
      intervalRef.current = setInterval(fetchECG, 2000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
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
    ctx.lineWidth = 1.5
    ctx.beginPath()
    
    waveform.forEach((value, i) => {
      const x = (i / waveform.length) * canvas.width
      const y = canvas.height / 2 - value * 40
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
  }, [waveform])

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
          <span className="text-sm">ECG Arrhythmia</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-red-500" /> ECG Arrhythmia Detection
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Radio className={`w-3 h-3 ${monitoring ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
              {lastUpdated || 'Not updated'}
            </span>
            <button onClick={() => setMonitoring(!monitoring)}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold ${monitoring ? 'bg-green-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
              {monitoring ? 'Live ON' : 'Live OFF'}
            </button>
            <button onClick={fetchECG} disabled={loading}
              className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Alert */}
        {latest?.severity === 'CRITICAL' && (
          <div className="mb-6 p-6 rounded-2xl bg-red-600 text-white text-center animate-pulse">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
            <h2 className="text-2xl font-bold">⚠️ CRITICAL ARRHYTHMIA!</h2>
            <p className="mt-2">{latest.arrhythmiaType}</p>
          </div>
        )}

        {/* Waveform */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Waves className="w-5 h-5 text-red-500" /> ECG Waveform
          </h2>
          <canvas ref={canvasRef} className="w-full h-[120px] bg-black rounded-xl" />
        </div>

        {/* Latest Result */}
        {latest && (
          <div className={`rounded-2xl border p-6 mb-6 ${latest.severity === 'CRITICAL' ? 'bg-red-50 border-red-200' : latest.severity === 'WARNING' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {latest.severity === 'CRITICAL' ? (
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                ) : latest.severity === 'WARNING' ? (
                  <Activity className="w-8 h-8 text-yellow-600" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                )}
                <div>
                  <p className="font-bold text-xl">{latest.rhythm}</p>
                  <p className="text-sm text-muted-foreground">{latest.arrhythmiaType}</p>
                </div>
              </div>
              <button onClick={() => setLatest(null)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4 text-center">
              <div className="p-3 rounded-xl bg-white dark:bg-neutral-800">
                <Heart className="w-5 h-5 mx-auto mb-1 text-red-500" />
                <p className="text-2xl font-bold">{latest.heartRate}</p>
                <p className="text-xs text-muted-foreground">BPM</p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-neutral-800">
                <Activity className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                <p className="text-2xl font-bold">{latest.hrv}</p>
                <p className="text-xs text-muted-foreground">HRV</p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-neutral-800">
                <Zap className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                <p className="text-2xl font-bold">{latest.severity}</p>
                <p className="text-xs text-muted-foreground">Severity</p>
              </div>
            </div>

            {latest.aiUsed && (
              <div className="mt-3 p-2 rounded-lg bg-purple-50 text-purple-600 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4" /> AI Analysis: COMPLETE
              </div>
            )}
          </div>
        )}

        {/* History */}
        {results.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-purple-500" /> ECG History ({results.length})
              </h2>
              <button onClick={clearAll} className="text-sm text-red-600 flex items-center gap-1">
                <Trash2 className="w-4 h-4" /> Clear All
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                  <span className={r.severity === 'CRITICAL' ? 'text-red-600 font-bold' : 'text-green-600'}>
                    {r.rhythm} - {r.heartRate} BPM
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{new Date(r.timestamp).toLocaleTimeString()}</span>
                    <button onClick={() => deleteResult(i)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}