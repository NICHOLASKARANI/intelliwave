'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Mic, Camera, AlertTriangle, CheckCircle, Loader2, History, Brain, Activity, MessageSquare, Zap, Gauge } from 'lucide-react'

interface AngerDetection {
  id: string
  angerLevel: number
  emotion: string
  intensity: string
  voiceTone: string
  keywords: string[]
  confidence: number
  recommendation: string
  timestamp: string
}

export default function AngerDetectionPage() {
  const [monitoring, setMonitoring] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState<AngerDetection[]>([])
  const [latest, setLatest] = useState<AngerDetection | null>(null)
  const [alertActive, setAlertActive] = useState(false)

  const startMonitoring = () => setMonitoring(true)
  const stopMonitoring = () => setMonitoring(false)

  const analyzeConversation = async () => {
    setAnalyzing(true)
    try {
      const res = await fetch('/api/wavecore/ai-security/anger-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'conversation' })
      })
      const data = await res.json()
      if (data.success) {
        setLatest(data.result)
        setResults(prev => [data.result, ...prev].slice(0, 20))
        if (data.result.angerLevel > 70) {
          setAlertActive(true)
          setTimeout(() => setAlertActive(false), 8000)
        }
      }
    } catch {} finally {
      setAnalyzing(false)
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
          <span className="text-sm">Anger Detection</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Zap className="w-6 h-6 text-orange-500" /> Anger Detection System
        </h1>

        {/* Alert */}
        {alertActive && (
          <div className="mb-6 p-4 rounded-2xl bg-red-600 text-white text-center animate-pulse">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p className="font-bold">⚠️ HIGH ANGER DETECTED! De-escalation recommended</p>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6 text-center">
          <button onClick={analyzeConversation} disabled={analyzing}
            className="px-8 py-4 rounded-xl bg-orange-600 text-white font-bold text-lg flex items-center gap-2 mx-auto disabled:opacity-50">
            {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
            {analyzing ? 'Analyzing...' : 'Analyze Conversation'}
          </button>
        </div>

        {/* Latest Result */}
        {latest && (
          <div className={`rounded-2xl border p-6 mb-6 ${latest.angerLevel > 70 ? 'bg-red-50 border-red-200' : latest.angerLevel > 40 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-3">
              {latest.angerLevel > 70 ? (
                <AlertTriangle className="w-8 h-8 text-red-600" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-600" />
              )}
              <div>
                <p className="font-bold text-lg">{latest.emotion}</p>
                <p className="text-sm text-muted-foreground">Intensity: {latest.intensity}</p>
              </div>
            </div>

            {/* Anger Gauge */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span>Calm</span>
                <span>Anger Level</span>
                <span>Extreme</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-4 mt-2">
                <div 
                  className={`h-4 rounded-full ${latest.angerLevel > 70 ? 'bg-red-600' : latest.angerLevel > 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${latest.angerLevel}%` }}
                />
              </div>
              <p className="text-center text-2xl font-bold mt-2">{latest.angerLevel}%</p>
            </div>

            {/* Voice Tone */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-3 rounded-xl bg-neutral-50">
                <p className="text-xs text-muted-foreground">Voice Tone</p>
                <p className="font-bold">{latest.voiceTone}</p>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50">
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className="font-bold">{(latest.confidence * 100).toFixed(0)}%</p>
              </div>
            </div>

            {/* Keywords */}
            <div className="mt-3 flex flex-wrap gap-2">
              {latest.keywords.map((kw, i) => (
                <span key={i} className="px-2 py-1 rounded-full bg-orange-50 text-orange-600 text-xs">{kw}</span>
              ))}
            </div>

            {/* Recommendation */}
            <div className="mt-4 p-3 rounded-xl bg-blue-50 text-blue-700 text-sm">
              <span className="font-bold">Recommendation: </span>{latest.recommendation}
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
                  <span className={r.angerLevel > 70 ? 'text-red-600 font-bold' : 'text-green-600'}>
                    {r.emotion} - {r.angerLevel}%
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