'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Leaf, Thermometer, Droplets, Sun, Wind, AlertTriangle, CheckCircle, History, Gauge, Sprout, CloudRain } from 'lucide-react'

interface GreenhouseData {
  id: string
  temperature: number
  humidity: number
  soilMoisture: number
  lightLevel: number
  co2Level: number
  airflow: number
  plantHealth: number
  irrigationNeeded: boolean
  ventilationNeeded: boolean
  timestamp: string
}

export default function GreenhousePage() {
  const [monitoring, setMonitoring] = useState(false)
  const [data, setData] = useState<GreenhouseData[]>([])
  const [latest, setLatest] = useState<GreenhouseData | null>(null)
  const [alertActive, setAlertActive] = useState(false)

  useEffect(() => {
    let interval: any
    if (monitoring) {
      interval = setInterval(async () => {
        try {
          const res = await fetch('/api/wavecore/ai-vision/greenhouse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sensor: 'greenhouse' })
          })
          const d = await res.json()
          if (d.success) {
            setLatest(d.data)
            setData(prev => [d.data, ...prev].slice(0, 30))
            if (d.data.irrigationNeeded || d.data.ventilationNeeded) {
              setAlertActive(true)
              setTimeout(() => setAlertActive(false), 5000)
            }
          }
        } catch {}
      }, 3000)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [monitoring])

  const startMonitoring = () => setMonitoring(true)
  const stopMonitoring = () => setMonitoring(false)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Greenhouse Monitoring</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Leaf className="w-6 h-6 text-green-500" /> Greenhouse Monitoring
        </h1>

        {/* Alert */}
        {alertActive && (
          <div className="mb-6 p-4 rounded-2xl bg-yellow-500 text-white text-center animate-pulse">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p className="font-bold">⚠️ Action Required: {latest?.irrigationNeeded ? 'Irrigation needed' : ''} {latest?.ventilationNeeded ? 'Ventilation needed' : ''}</p>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6 text-center">
          {!monitoring ? (
            <button onClick={startMonitoring}
              className="px-8 py-4 rounded-xl bg-green-600 text-white font-bold text-lg flex items-center gap-2 mx-auto">
              <Sprout className="w-5 h-5" /> Start Monitoring
            </button>
          ) : (
            <button onClick={stopMonitoring}
              className="px-8 py-4 rounded-xl bg-red-600 text-white font-bold text-lg">
              Stop Monitoring
            </button>
          )}
        </div>

        {/* Live Metrics */}
        {latest && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <MetricCard icon={Thermometer} label="Temperature" value={`${latest.temperature.toFixed(1)}°C`} status={latest.temperature > 35 ? 'bad' : 'good'} />
            <MetricCard icon={Droplets} label="Humidity" value={`${latest.humidity.toFixed(0)}%`} status={latest.humidity < 40 || latest.humidity > 80 ? 'bad' : 'good'} />
            <MetricCard icon={CloudRain} label="Soil Moisture" value={`${latest.soilMoisture.toFixed(0)}%`} status={latest.soilMoisture < 30 ? 'bad' : 'good'} />
            <MetricCard icon={Sun} label="Light Level" value={`${latest.lightLevel.toFixed(0)} lux`} status={latest.lightLevel < 100 ? 'bad' : 'good'} />
            <MetricCard icon={Wind} label="CO2 Level" value={`${latest.co2Level.toFixed(0)} ppm`} status={latest.co2Level > 1500 ? 'bad' : 'good'} />
            <MetricCard icon={Leaf} label="Plant Health" value={`${latest.plantHealth}/100`} status={latest.plantHealth < 50 ? 'bad' : 'good'} />
          </div>
        )}

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
                  <span>{d.temperature.toFixed(1)}°C | {d.humidity.toFixed(0)}% | {d.soilMoisture.toFixed(0)}% moisture</span>
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

function MetricCard({ icon: Icon, label, value, status }: { icon: any; label: string; value: string; status: string }) {
  return (
    <div className={`p-4 rounded-xl border ${status === 'good' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <Icon className={`w-5 h-5 mb-2 ${status === 'good' ? 'text-green-600' : 'text-red-600'}`} />
      <p className="text-sm font-bold">{label}</p>
      <p className={`text-lg font-bold ${status === 'good' ? 'text-green-600' : 'text-red-600'}`}>{value}</p>
    </div>
  )
}