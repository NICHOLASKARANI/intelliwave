'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Moon, Shield, Camera, AlertTriangle, CheckCircle, Loader2, History, Eye, Bell, MapPin, Zap } from 'lucide-react'

interface IntrusionEvent {
  id: string
  detected: boolean
  personCount: number
  confidence: number
  zone: string
  threatLevel: string
  timestamp: string
  alertSent: boolean
}

export default function NightSecurityPage() {
  const [monitoring, setMonitoring] = useState(false)
  const [events, setEvents] = useState<IntrusionEvent[]>([])
  const [latest, setLatest] = useState<IntrusionEvent | null>(null)
  const [alertActive, setAlertActive] = useState(false)
  const [personCount, setPersonCount] = useState(0)

  useEffect(() => {
    let interval: any
    if (monitoring) {
      interval = setInterval(async () => {
        try {
          const res = await fetch('/api/wavecore/ai-vision/night-security', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ frame: 'night-vision' })
          })
          const d = await res.json()
          if (d.success) {
            setLatest(d.event)
            setEvents(prev => [d.event, ...prev].slice(0, 30))
            setPersonCount(d.event.personCount)
            if (d.event.detected) {
              setAlertActive(true)
              setTimeout(() => setAlertActive(false), 8000)
            }
          }
        } catch {}
      }, 2000)
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
          <span className="text-sm">Night Security</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Moon className="w-6 h-6 text-indigo-500" /> Night Security System
        </h1>

        {/* Alert Banner */}
        {alertActive && (
          <div className="mb-6 p-6 rounded-2xl bg-red-600 text-white text-center animate-pulse">
            <Bell className="w-12 h-12 mx-auto mb-3" />
            <h2 className="text-2xl font-bold">⚠️ INTRUSION DETECTED!</h2>
            <p className="mt-2">{personCount} unauthorized person(s) detected</p>
            <div className="flex gap-3 justify-center mt-4">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Zone: {latest?.zone}</span>
              <span className="flex items-center gap-1"><Zap className="w-4 h-4" /> Alert Sent</span>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6 text-center">
          {!monitoring ? (
            <button onClick={() => setMonitoring(true)}
              className="px-8 py-4 rounded-xl bg-indigo-600 text-white font-bold text-lg flex items-center gap-2 mx-auto">
              <Shield className="w-5 h-5" /> Start Night Monitoring
            </button>
          ) : (
            <button onClick={() => setMonitoring(false)}
              className="px-8 py-4 rounded-xl bg-red-600 text-white font-bold text-lg">
              Stop Monitoring
            </button>
          )}
        </div>

        {/* Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`p-6 rounded-2xl border text-center ${latest?.detected ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <Eye className={`w-8 h-8 mx-auto mb-3 ${latest?.detected ? 'text-red-600' : 'text-green-600'}`} />
            <p className="text-2xl font-bold">{personCount}</p>
            <p className="text-sm text-muted-foreground">Persons Detected</p>
          </div>
          <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
            <MapPin className="w-8 h-8 mx-auto mb-3 text-blue-500" />
            <p className="text-2xl font-bold">{latest?.zone || 'N/A'}</p>
            <p className="text-sm text-muted-foreground">Current Zone</p>
          </div>
          <div className={`p-6 rounded-2xl border text-center ${latest?.threatLevel === 'HIGH' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <Shield className={`w-8 h-8 mx-auto mb-3 ${latest?.threatLevel === 'HIGH' ? 'text-red-600' : 'text-green-600'}`} />
            <p className="text-2xl font-bold">{latest?.threatLevel || 'LOW'}</p>
            <p className="text-sm text-muted-foreground">Threat Level</p>
          </div>
        </div>

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
                    {ev.detected ? '⚠️ Intrusion' : '✓ Safe'} - {ev.zone}
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