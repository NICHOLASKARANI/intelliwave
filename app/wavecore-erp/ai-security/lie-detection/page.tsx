'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, Camera, Mic, AlertTriangle, CheckCircle, Loader2, History, Brain, Activity, User, Scan } from 'lucide-react'

interface LieDetectionResult {
  id: string
  truthProbability: number
  deceptionProbability: number
  microExpression: string
  voiceStress: number
  facialCues: string[]
  confidence: number
  verdict: string
  timestamp: string
}

export default function LieDetectionPage() {
  const [cameraActive, setCameraActive] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState<LieDetectionResult[]>([])
  const [latest, setLatest] = useState<LieDetectionResult | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: true
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

  const analyze = async () => {
    setAnalyzing(true)
    try {
      const res = await fetch('/api/wavecore/ai-security/lie-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'video+audio' })
      })
      const data = await res.json()
      if (data.success) {
        setLatest(data.result)
        setResults(prev => [data.result, ...prev].slice(0, 20))
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
          <span className="text-sm">AI Lie Detection</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-500" /> AI Lie Detection System
        </h1>

        {/* Camera */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
          <video ref={videoRef} autoPlay playsInline className="hidden" />
          <canvas ref={canvasRef} className="hidden" />
          
          {!cameraActive ? (
            <div className="text-center py-12">
              <Eye className="w-16 h-16 mx-auto mb-4 text-purple-500 opacity-30" />
              <button onClick={startCamera}
                className="px-6 py-3 rounded-xl bg-purple-600 text-white font-bold flex items-center gap-2 mx-auto">
                <Camera className="w-5 h-5" /> Start Camera + Microphone
              </button>
            </div>
          ) : (
            <div className="flex gap-3 justify-center">
              <button onClick={analyze} disabled={analyzing}
                className="px-6 py-3 rounded-xl bg-purple-600 text-white font-bold flex items-center gap-2 disabled:opacity-50">
                {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Scan className="w-5 h-5" />}
                {analyzing ? 'Analyzing...' : 'Analyze Truthfulness'}
              </button>
              <button onClick={stopCamera} className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold">Stop</button>
            </div>
          )}
        </div>

        {/* Latest Result */}
        {latest && (
          <div className={`rounded-2xl border p-6 mb-6 ${latest.verdict === 'DECEPTION LIKELY' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-3">
              {latest.verdict === 'DECEPTION LIKELY' ? (
                <AlertTriangle className="w-8 h-8 text-red-600" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-600" />
              )}
              <div>
                <p className="font-bold text-lg">{latest.verdict}</p>
                <p className="text-sm text-muted-foreground">Confidence: {(latest.confidence * 100).toFixed(1)}%</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Truth</p>
                <p className="text-2xl font-bold text-green-600">{(latest.truthProbability * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Deception</p>
                <p className="text-2xl font-bold text-red-600">{(latest.deceptionProbability * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Voice Stress</p>
                <p className="text-2xl font-bold">{latest.voiceStress.toFixed(1)}%</p>
              </div>
            </div>

            {/* Micro-expression */}
            <div className="mt-4 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
              <p className="text-sm">
                <span className="font-bold">Micro-expression: </span>{latest.microExpression}
              </p>
            </div>

            {/* Facial Cues */}
            <div className="mt-3 flex flex-wrap gap-2">
              {latest.facialCues.map((cue, i) => (
                <span key={i} className="px-2 py-1 rounded-full bg-purple-50 text-purple-600 text-xs">{cue}</span>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-500" /> Detection History
          </h2>
          {results.length === 0 ? (
            <p className="text-muted-foreground">No analyses yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                  <span className={r.verdict === 'DECEPTION LIKELY' ? 'text-red-600 font-bold' : 'text-green-600'}>
                    {r.verdict}
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