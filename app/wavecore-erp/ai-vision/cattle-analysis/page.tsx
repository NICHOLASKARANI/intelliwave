'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Camera, Upload, Loader2, AlertTriangle, CheckCircle, History, Heart, Activity, Thermometer, Moon } from 'lucide-react'

interface CattleAnalysis {
  id: string
  animalId: string
  behaviour: string
  estrusDetected: boolean
  calvingDetected: boolean
  dangerDetected: boolean
  healthScore: number
  temperature: number
  activityLevel: string
  confidence: number
  timestamp: string
}

export default function CattleAnalysisPage() {
  const [cameraActive, setCameraActive] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [results, setResults] = useState<CattleAnalysis[]>([])
  const [latest, setLatest] = useState<CattleAnalysis | null>(null)
  const [alertActive, setAlertActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: 640, height: 480 } 
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setCameraActive(true)
    } catch {}
  }

  const analyzeCattle = async () => {
    setScanning(true)
    try {
      const res = await fetch('/api/wavecore/ai-vision/cattle-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: 'cattle-scan' })
      })
      const data = await res.json()
      if (data.success) {
        setLatest(data.analysis)
        setResults(prev => [data.analysis, ...prev].slice(0, 20))
        if (data.analysis.dangerDetected || data.analysis.calvingDetected) {
          setAlertActive(true)
          setTimeout(() => setAlertActive(false), 10000)
        }
      }
    } catch {} finally {
      setScanning(false)
    }
  }

  const behaviours = ['Grazing', 'Resting', 'Walking', 'Ruminating', 'Drinking', 'Socializing', 'Agitated', 'Estrus Signs']

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Cattle Behaviour Analysis</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Heart className="w-6 h-6 text-pink-500" /> Cattle Behaviour Analysis
        </h1>

        {/* Alert Banner */}
        {alertActive && (
          <div className="mb-6 p-6 rounded-2xl bg-red-600 text-white text-center animate-pulse">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
            <h2 className="text-2xl font-bold">⚠️ CATTLE ALERT!</h2>
            <p className="mt-2">Immediate attention required</p>
          </div>
        )}

        {/* Camera */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
          <video ref={videoRef} autoPlay playsInline className="hidden" />
          
          {!cameraActive ? (
            <div className="text-center py-12">
              <Camera className="w-16 h-16 mx-auto mb-4 text-pink-500 opacity-30" />
              <button onClick={startCamera}
                className="px-6 py-3 rounded-xl bg-pink-600 text-white font-bold flex items-center gap-2 mx-auto">
                <Camera className="w-5 h-5" /> Start Camera
              </button>
            </div>
          ) : (
            <div className="flex gap-3 justify-center">
              <button onClick={analyzeCattle} disabled={scanning}
                className="px-6 py-3 rounded-xl bg-pink-600 text-white font-bold flex items-center gap-2 disabled:opacity-50">
                {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
                {scanning ? 'Analyzing...' : 'Analyze Cattle'}
              </button>
            </div>
          )}
        </div>

        {/* Latest Analysis */}
        {latest && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <h2 className="font-bold text-lg mb-4">Animal: {latest.animalId}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-xl border text-center ${latest.estrusDetected ? 'bg-pink-50 border-pink-200' : 'bg-green-50 border-green-200'}`}>
                <Heart className={`w-5 h-5 mx-auto mb-2 ${latest.estrusDetected ? 'text-pink-600' : 'text-green-600'}`} />
                <p className="text-sm font-bold">Estrus</p>
                <p className={`text-xs ${latest.estrusDetected ? 'text-pink-600' : 'text-green-600'}`}>
                  {latest.estrusDetected ? '✓ Detected' : 'Not Detected'}
                </p>
              </div>
              <div className={`p-4 rounded-xl border text-center ${latest.calvingDetected ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
                <Moon className={`w-5 h-5 mx-auto mb-2 ${latest.calvingDetected ? 'text-blue-600' : 'text-green-600'}`} />
                <p className="text-sm font-bold">Calving</p>
                <p className={`text-xs ${latest.calvingDetected ? 'text-blue-600' : 'text-green-600'}`}>
                  {latest.calvingDetected ? '✓ Detected' : 'Not Detected'}
                </p>
              </div>
              <div className={`p-4 rounded-xl border text-center ${latest.dangerDetected ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <AlertTriangle className={`w-5 h-5 mx-auto mb-2 ${latest.dangerDetected ? 'text-red-600' : 'text-green-600'}`} />
                <p className="text-sm font-bold">Danger</p>
                <p className={`text-xs ${latest.dangerDetected ? 'text-red-600' : 'text-green-600'}`}>
                  {latest.dangerDetected ? '⚠️ Alert' : 'Safe'}
                </p>
              </div>
              <div className="p-4 rounded-xl border text-center bg-neutral-50">
                <Thermometer className="w-5 h-5 mx-auto mb-2 text-orange-500" />
                <p className="text-sm font-bold">Temp</p>
                <p className="text-xs">{latest.temperature.toFixed(1)}°C</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Behaviour: {latest.behaviour} | Health Score: {latest.healthScore}/100 | Activity: {latest.activityLevel}
            </p>
          </div>
        )}

        {/* History */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-500" /> Analysis History
          </h2>
          {results.length === 0 ? (
            <p className="text-muted-foreground">No analyses yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                  <span>{r.animalId} - {r.behaviour}</span>
                  <span className={`text-sm ${r.dangerDetected ? 'text-red-600' : 'text-green-600'}`}>
                    {r.dangerDetected ? '⚠️ Alert' : '✓ Safe'}
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