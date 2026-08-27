'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Dog, Camera, AlertTriangle, CheckCircle, Bell, MapPin, History, Shield, Zap, PawPrint } from 'lucide-react'

interface PredatorEvent {
  id: string
  predatorDetected: boolean
  animalType: string
  threatLevel: string
  distance: number
  livestockAtRisk: number
  confidence: number
  zone: string
  timestamp: string
  deterrentActivated: boolean
}

export default function RanchPredatorPage() {
  const [monitoring, setMonitoring] = useState(false)
  const [events, setEvents] = useState<PredatorEvent[]>([])
  const [latest, setLatest] = useState<PredatorEvent | null>(null)
  const [alertActive, setAlertActive] = useState(false)
  const [deterrentActive, setDeterrentActive] = useState(false)

  useEffect(() => {
    let interval: any
    if (monitoring) {
      interval = setInterval(async () => {
        try {
          const res = await fetch('/api/wavecore/ai-vision/ranch-predator', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sensor: 'ranch-camera' })
          })
          const d = await res.json()
          if (d.success) {
            setLatest(d.event)
            setEvents(prev => [d.event, ...prev].slice(0, 30))
            if (d.event.predatorDetected) {
              setAlertActive(true)
              setDeterrentActive(d.event.deterrentActivated)
              setTimeout(() => setAlertActive(false), 10000)
            }
          }
        } catch {}
      }, 1500)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [monitoring])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Ranch Predator Detector</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <PawPrint className="w-6 h-6 text-red-500" /> Ranch Predator Detector
        </h1>

        {/* Alert Banner */}
        {alertActive && (
          <div className="mb-6 p-6 rounded-2xl bg-red-600 text-white text-center animate-pulse">
            <Bell className="w-12 h-12 mx-auto mb-3" />
            <h2 className="text-2xl font-bold">⚠️ PREDATOR DETECTED!</h2>
            <p className="mt-2">{latest?.animalType} at {latest?.distance}m - {latest?.livestockAtRisk} livestock at risk</p>
            {deterrentActive && (
              <p className="mt-2 text-yellow-300">⚡ Deterrent ACTIVATED!</p>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6 text-center">
          {!monitoring ? (
            <button onClick={() => setMonitoring(true)}
              className="px-8 py-4 rounded-xl bg-red-600 text-white font-bold text-lg flex items-center gap-2 mx-auto">
              <Shield className="w-5 h-5" /> Start Ranch Monitoring
            </button>
          ) : (
            <button onClick={() => setMonitoring(false)}
              className="px-8 py-4 rounded-xl bg-neutral-600 text-white font-bold text-lg">
              Stop Monitoring
            </button>
          )}
        </div>

        {/* Latest Detection */}
        {latest && (
          <div className={`rounded-2xl border p-6 mb-6 ${latest.predatorDetected ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-3">
              {latest.predatorDetected ? (
                <AlertTriangle className="w-8 h-8 text-red-600" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-600" />
              )}
              <div>
                <p className="font-bold text-lg">{latest.predatorDetected ? 'PREDATOR DETECTED' : 'RANCH SECURE'}</p>
                <p className="text-sm text-muted-foreground">
                  {latest.animalType} | {latest.distance}m away | {latest.zone}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Livestock at Risk</p>
                <p className="text-2xl font-bold text-red-600">{latest.livestockAtRisk}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Threat Level</p>
                <p className="text-2xl font-bold">{latest.threatLevel}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className="text-2xl font-bold">{(latest.confidence * 100).toFixed(0)}%</p>
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
            <p className="text-muted-foreground">No detections</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {events.map((ev, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                  <span className={ev.predatorDetected ? 'text-red-600 font-bold' : 'text-green-600'}>
                    {ev.predatorDetected ? `⚠️ ${ev.animalType}` : '✓ Secure'} - {ev.zone}
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