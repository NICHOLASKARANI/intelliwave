'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Shield, Fence, AlertTriangle, CheckCircle, Bell, MapPin, History, Radar, Zap } from 'lucide-react'

interface FenceEvent {
  id: string
  breachDetected: boolean
  fenceSection: string
  breachType: string
  confidence: number
  timestamp: string
  perimeterStatus: string
  responseTime: number
}

export default function FenceIntrusionPage() {
  const [monitoring, setMonitoring] = useState(false)
  const [events, setEvents] = useState<FenceEvent[]>([])
  const [latest, setLatest] = useState<FenceEvent | null>(null)
  const [alertActive, setAlertActive] = useState(false)
  const [fenceSections, setFenceSections] = useState([
    { section: 'North Perimeter', status: 'Secure' },
    { section: 'South Perimeter', status: 'Secure' },
    { section: 'East Perimeter', status: 'Secure' },
    { section: 'West Perimeter', status: 'Secure' },
  ])

  useEffect(() => {
    let interval: any
    if (monitoring) {
      interval = setInterval(async () => {
        try {
          const res = await fetch('/api/wavecore/ai-vision/fence-intrusion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sensor: 'fence-line' })
          })
          const d = await res.json()
          if (d.success) {
            setLatest(d.event)
            setEvents(prev => [d.event, ...prev].slice(0, 30))
            
            // Update fence section status
            setFenceSections(prev => prev.map(s => 
              s.section === d.event.fenceSection 
                ? { ...s, status: d.event.breachDetected ? 'BREACHED' : 'Secure' }
                : s
            ))
            
            if (d.event.breachDetected) {
              setAlertActive(true)
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
          <span className="text-sm">Fence Line Intrusion</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Fence className="w-6 h-6 text-orange-500" /> Fence Line Intrusion Detection
        </h1>

        {/* Alert Banner */}
        {alertActive && (
          <div className="mb-6 p-6 rounded-2xl bg-red-600 text-white text-center animate-pulse">
            <Bell className="w-12 h-12 mx-auto mb-3" />
            <h2 className="text-2xl font-bold">⚠️ FENCE BREACH!</h2>
            <p className="mt-2">{latest?.fenceSection} - {latest?.breachType}</p>
            <p className="text-sm">Response Time: {latest?.responseTime}s</p>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6 text-center">
          {!monitoring ? (
            <button onClick={() => setMonitoring(true)}
              className="px-8 py-4 rounded-xl bg-orange-600 text-white font-bold text-lg flex items-center gap-2 mx-auto">
              <Shield className="w-5 h-5" /> Start Perimeter Monitoring
            </button>
          ) : (
            <button onClick={() => setMonitoring(false)}
              className="px-8 py-4 rounded-xl bg-red-600 text-white font-bold text-lg">
              Stop Monitoring
            </button>
          )}
        </div>

        {/* Fence Sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {fenceSections.map((section, i) => (
            <div key={i} className={`p-4 rounded-2xl border text-center ${section.status === 'BREACHED' ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-200'}`}>
              <Fence className={`w-6 h-6 mx-auto mb-2 ${section.status === 'BREACHED' ? 'text-red-600' : 'text-green-600'}`} />
              <p className="text-sm font-bold">{section.section}</p>
              <p className={`text-xs font-bold ${section.status === 'BREACHED' ? 'text-red-600' : 'text-green-600'}`}>
                {section.status}
              </p>
            </div>
          ))}
        </div>

        {/* Latest Event */}
        {latest && (
          <div className={`rounded-2xl border p-6 mb-6 ${latest.breachDetected ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-3">
              {latest.breachDetected ? (
                <AlertTriangle className="w-8 h-8 text-red-600" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-600" />
              )}
              <div>
                <p className="font-bold text-lg">{latest.breachDetected ? 'BREACH DETECTED' : 'PERIMETER SECURE'}</p>
                <p className="text-sm text-muted-foreground">
                  {latest.fenceSection} | {latest.breachType} | Response: {latest.responseTime}s
                </p>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-500" /> Intrusion History
          </h2>
          {events.length === 0 ? (
            <p className="text-muted-foreground">No events</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {events.map((ev, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                  <span className={ev.breachDetected ? 'text-red-600 font-bold' : 'text-green-600'}>
                    {ev.breachDetected ? '⚠️ Breach' : '✓ Secure'} - {ev.fenceSection}
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