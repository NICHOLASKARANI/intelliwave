'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Leaf, Thermometer, Droplets, Sun, Wind, AlertTriangle, CheckCircle, History, Gauge, Sprout, CloudRain, Zap, Radio, RefreshCw, Loader2, Activity, Globe, TrendingUp, TrendingDown, Trash2 } from 'lucide-react'

interface GreenhouseData {
  temperature: number
  humidity: number
  soilMoisture: number
  lightLevel: number
  co2Level: number
  airflow: number
  waterLevel: number
  phLevel: number
  electricalConductivity: number
  plantHealth: number
  irrigationNeeded: boolean
  ventilationNeeded: boolean
  climateZone: string
  cropType: string
  growthStage: string
  estimatedYield: number
  energyUsage: number
  waterUsage: number
}

export default function GreenhousePage() {
  const [monitoring, setMonitoring] = useState(false)
  const [data, setData] = useState<GreenhouseData | null>(null)
  const [history, setHistory] = useState<GreenhouseData[]>([])
  const [loading, setLoading] = useState(false)
  const [alertActive, setAlertActive] = useState(false)
  const [lastUpdated, setLastUpdated] = useState('')
  const intervalRef = useRef<any>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/ai-vision/greenhouse')
      const d = await res.json()
      if (d.success) {
        setData(d.data)
        setLastUpdated(new Date().toLocaleTimeString())
        setHistory(prev => [d.data, ...prev].slice(0, 20))
        if (d.data.irrigationNeeded || d.data.ventilationNeeded) {
          setAlertActive(true)
          setTimeout(() => setAlertActive(false), 8000)
        }
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (monitoring) {
      intervalRef.current = setInterval(fetchData, 3000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [monitoring])

  const deleteHistory = (index: number) => {
    setHistory(prev => prev.filter((_, i) => i !== index))
  }

  const clearHistory = () => setHistory([])

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

      <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Leaf className="w-6 h-6 text-green-500" /> Greenhouse Monitoring
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
            <button onClick={fetchData} disabled={loading}
              className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Alerts */}
        {alertActive && (
          <div className="mb-6 p-4 rounded-2xl bg-yellow-500 text-white text-center animate-pulse">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p className="font-bold">
              ⚠️ {data?.irrigationNeeded ? 'Irrigation needed' : ''} {data?.ventilationNeeded ? 'Ventilation needed' : ''}
            </p>
          </div>
        )}

        {/* Crop Info */}
        {data && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <div className="flex flex-wrap gap-4 justify-between items-center">
              <div className="flex items-center gap-3">
                <Sprout className="w-8 h-8 text-green-500" />
                <div>
                  <p className="font-bold text-lg">{data.cropType}</p>
                  <p className="text-sm text-muted-foreground">{data.growthStage} | {data.climateZone}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{data.estimatedYield} kg</p>
                <p className="text-xs text-muted-foreground">Estimated Yield</p>
              </div>
            </div>
          </div>
        )}

        {/* Sensor Grid */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <SensorCard icon={Thermometer} label="Temperature" value={`${data.temperature}°C`} status={data.temperature > 35 ? 'bad' : 'good'} />
            <SensorCard icon={Droplets} label="Humidity" value={`${data.humidity}%`} status={data.humidity < 40 || data.humidity > 80 ? 'bad' : 'good'} />
            <SensorCard icon={CloudRain} label="Soil Moisture" value={`${data.soilMoisture}%`} status={data.soilMoisture < 30 ? 'bad' : 'good'} />
            <SensorCard icon={Sun} label="Light" value={`${data.lightLevel} lux`} status={data.lightLevel < 100 ? 'bad' : 'good'} />
            <SensorCard icon={Wind} label="CO2" value={`${data.co2Level} ppm`} status={data.co2Level > 1500 ? 'bad' : 'good'} />
            <SensorCard icon={Wind} label="Airflow" value={`${data.airflow} m/s`} status="good" />
            <SensorCard icon={Droplets} label="Water Level" value={`${data.waterLevel}%`} status={data.waterLevel < 20 ? 'bad' : 'good'} />
            <SensorCard icon={Activity} label="pH Level" value={`${data.phLevel}`} status={data.phLevel < 5 || data.phLevel > 7.5 ? 'bad' : 'good'} />
            <SensorCard icon={Zap} label="EC (Nutrients)" value={`${data.electricalConductivity}`} status="good" />
            <SensorCard icon={Leaf} label="Plant Health" value={`${data.plantHealth}%`} status={data.plantHealth < 50 ? 'bad' : 'good'} />
          </div>
        )}

        {/* Usage Stats */}
        {data && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border text-center">
              <Zap className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
              <p className="text-xl font-bold">{data.energyUsage} kWh</p>
              <p className="text-xs text-muted-foreground">Energy Usage</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border text-center">
              <Droplets className="w-5 h-5 mx-auto mb-2 text-blue-500" />
              <p className="text-xl font-bold">{data.waterUsage} L</p>
              <p className="text-xs text-muted-foreground">Water Usage</p>
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-purple-500" /> Monitoring History ({history.length})
              </h2>
              <button onClick={clearHistory} className="text-sm text-red-600 flex items-center gap-1">
                <Trash2 className="w-4 h-4" /> Clear All
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {history.map((h, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                  <span>{h.temperature}°C | {h.humidity}% | {h.soilMoisture}% | {h.co2Level}ppm</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{new Date().toLocaleTimeString()}</span>
                    <button onClick={() => deleteHistory(i)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
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

function SensorCard({ icon: Icon, label, value, status }: { icon: any; label: string; value: string; status: string }) {
  return (
    <div className={`p-4 rounded-2xl border text-center ${status === 'good' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <Icon className={`w-5 h-5 mx-auto mb-2 ${status === 'good' ? 'text-green-600' : 'text-red-600'}`} />
      <p className="text-sm font-bold">{label}</p>
      <p className={`text-lg font-bold ${status === 'good' ? 'text-green-600' : 'text-red-600'}`}>{value}</p>
    </div>
  )
}