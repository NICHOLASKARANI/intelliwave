'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Home, Camera, User, Bell, AlertTriangle, CheckCircle, History, MapPin, Users, DoorOpen, Lightbulb } from 'lucide-react'

interface PresenceEvent {
  id: string
  occupied: boolean
  personCount: number
  room: string
  activity: string
  confidence: number
  timestamp: string
  smartActions: string[]
}

export default function HomePresencePage() {
  const [monitoring, setMonitoring] = useState(false)
  const [events, setEvents] = useState<PresenceEvent[]>([])
  const [latest, setLatest] = useState<PresenceEvent | null>(null)
  const [alertActive, setAlertActive] = useState(false)

  useEffect(() => {
    let interval: any
    if (monitoring) {
      interval = setInterval(async () => {
        try {
          const res = await fetch('/api/wavecore/ai-vision/home-presence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sensor: 'home-camera' })
          })
          const d = await res.json()
          if (d.success) {
            setLatest(d.event)
            setEvents(prev => [d.event, ...prev].slice(0, 30))
            if (d.event.occupied && d.event.personCount > 3) {
              setAlertActive(true)
              setTimeout(() => setAlertActive(false), 8000)
            }
          }
        } catch {}
      }, 2000)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [monitoring])

  const rooms = ['Living Room', 'Kitchen', 'Bedroom', 'Bathroom', 'Garage', 'Garden']

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Home Presence Detection</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Home className="w-6 h-6 text-blue-500" /> Home Presence Detection
        </h1>

        {/* Alert */}
        {alertActive && (
          <div className="mb-6 p-4 rounded-2xl bg-yellow-500 text-white text-center animate-pulse">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p className="font-bold">⚠️ Unusual activity: {latest?.personCount} people in {latest?.room}</p>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6 text-center">
          {!monitoring ? (
            <button onClick={() => setMonitoring(true)}
              className="px-8 py-4 rounded-xl bg-blue-600 text-white font-bold text-lg flex items-center gap-2 mx-auto">
              <Camera className="w-5 h-5" /> Start Home Monitoring
            </button>
          ) : (
            <button onClick={() => setMonitoring(false)}
              className="px-8 py-4 rounded-xl bg-neutral-600 text-white font-bold text-lg">
              Stop Monitoring
            </button>
          )}
        </div>

        {/* Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-2xl border text-center ${latest?.occupied ? 'bg-green-50 border-green-200' : 'bg-neutral-50 border-neutral-200'}`}>
            <Home className={`w-6 h-6 mx-auto mb-2 ${latest?.occupied ? 'text-green-600' : 'text-neutral-400'}`} />
            <p className="text-sm font-bold">{latest?.occupied ? 'Occupied' : 'Empty'}</p>
          </div>
          <div className="p-4 rounded-2xl border text-center bg-white">
            <Users className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{latest?.personCount || 0}</p>
            <p className="text-xs text-muted-foreground">People</p>
          </div>
          <div className="p-4 rounded-2xl border text-center bg-white">
            <MapPin className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <p className="text-sm font-bold">{latest?.room || 'N/A'}</p>
            <p className="text-xs text-muted-foreground">Room</p>
          </div>
          <div className="p-4 rounded-2xl border text-center bg-white">
            <DoorOpen className="w-6 h-6 mx-auto mb-2 text-orange-500" />
            <p className="text-sm font-bold">{latest?.activity || 'N/A'}</p>
            <p className="text-xs text-muted-foreground">Activity</p>
          </div>
        </div>

        {/* Smart Actions */}
        {latest?.smartActions && latest.smartActions.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" /> Smart Actions Triggered
            </h2>
            <div className="space-y-2">
              {latest.smartActions.map((action, i) => (
                <div key={i} className="p-2 rounded-lg bg-blue-50 text-blue-700 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> {action}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-500" /> Detection History
          </h2>
          {events.length === 0 ? (
            <p className="text-muted-foreground">No events</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {events.map((ev, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                  <span>{ev.occupied ? '✓ Occupied' : 'Empty'} - {ev.room} ({ev.personCount} people)</span>
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