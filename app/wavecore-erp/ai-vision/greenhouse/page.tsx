'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Leaf, Thermometer, Droplets, Sun, Wind, AlertTriangle, CheckCircle, History, Gauge, Sprout, CloudRain, Zap, Radio, RefreshCw, Loader2, Activity, Globe, Satellite, Wifi, MapPin, Trash2 } from 'lucide-react'

export default function GreenhousePage() {
  const [monitoring, setMonitoring] = useState(false)
  const [data, setData] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState('')
  const [location, setLocation] = useState({ lat: -1.2921, lon: 36.8219 })
  const [thingSpeakChannel, setThingSpeakChannel] = useState('')
  const intervalRef = useRef<any>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/ai-vision/greenhouse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lat: location.lat, 
          lon: location.lon,
          thingSpeakChannel 
        })
      })
      const d = await res.json()
      if (d.success) {
        setData(d.data)
        setLastUpdated(new Date().toLocaleTimeString())
        setHistory(prev => [d.data, ...prev].slice(0, 20))
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
      intervalRef.current = setInterval(fetchData, 10000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [monitoring, location, thingSpeakChannel])

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
            <Leaf className="w-6 h-6 text-green-500" /> Real-time Greenhouse Monitoring
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

        {/* Location + IoT Config */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Latitude</label>
              <input type="number" step="0.0001" value={location.lat} onChange={(e) => setLocation({...location, lat: Number(e.target.value)})} className="w-full px-3 py-2 rounded-lg border text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Longitude</label>
              <input type="number" step="0.0001" value={location.lon} onChange={(e) => setLocation({...location, lon: Number(e.target.value)})} className="w-full px-3 py-2 rounded-lg border text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">ThingSpeak Channel ID</label>
              <input type="text" value={thingSpeakChannel} onChange={(e) => setThingSpeakChannel(e.target.value)} placeholder="Optional" className="w-full px-3 py-2 rounded-lg border text-sm" />
            </div>
            <div className="flex items-end">
              <button onClick={fetchData} className="w-full px-3 py-2 rounded-lg bg-green-600 text-white font-bold text-sm flex items-center justify-center gap-1">
                <Globe className="w-4 h-4" /> Fetch Data
              </button>
            </div>
          </div>
        </div>

        {/* Data Source Status */}
        {data?.dataSources && (
          <div className="flex flex-wrap gap-2 mb-6">
            <SourceBadge icon={Wifi} label="OpenWeatherMap" active={data.dataSources.weather} />
            <SourceBadge icon={Globe} label="SoilGrids" active={data.dataSources.soil} />
            <SourceBadge icon={Satellite} label="NASA POWER" active={data.dataSources.satellite} />
            <SourceBadge icon={Activity} label="ThingSpeak IoT" active={data.dataSources.iot} />
          </div>
        )}

        {/* Weather Data */}
        {data?.weather && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <CloudRain className="w-5 h-5 text-blue-500" /> Real Weather (OpenWeatherMap)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SensorCard icon={Thermometer} label="Temperature" value={`${data.weather.temperature?.toFixed(1)}°C`} />
              <SensorCard icon={Droplets} label="Humidity" value={`${data.weather.humidity}%`} />
              <SensorCard icon={Wind} label="Wind" value={`${data.weather.windSpeed} m/s`} />
              <SensorCard icon={Sun} label="Condition" value={data.weather.weather || 'N/A'} />
            </div>
          </div>
        )}

        {/* Soil Data */}
        {data?.soil && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-amber-600" /> Real Soil Data (SoilGrids)
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <SensorCard icon={Activity} label="Soil pH" value={`${data.soil.soilPH}`} />
              <SensorCard icon={Leaf} label="Organic Carbon" value={`${data.soil.soilOrganicCarbon} g/kg`} />
            </div>
          </div>
        )}

        {/* Satellite Data */}
        {data?.satellite && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Satellite className="w-5 h-5 text-purple-500" /> Satellite Data (NASA POWER)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SensorCard icon={Thermometer} label="Satellite Temp" value={`${data.satellite.satelliteTemp?.toFixed(1)}°C`} />
              <SensorCard icon={Droplets} label="Satellite Humidity" value={`${data.satellite.satelliteHumidity?.toFixed(1)}%`} />
              <SensorCard icon={CloudRain} label="Rainfall" value={`${data.satellite.satelliteRainfall} mm`} />
              <SensorCard icon={Sun} label="Solar Radiation" value={`${data.satellite.satelliteSolarRadiation} W/m²`} />
            </div>
          </div>
        )}

        {/* IoT Data */}
        {data?.iot && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Wifi className="w-5 h-5 text-green-500" /> IoT Sensors (ThingSpeak)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SensorCard icon={Thermometer} label="Field 1" value={data.iot.field1 || 'N/A'} />
              <SensorCard icon={Droplets} label="Field 2" value={data.iot.field2 || 'N/A'} />
              <SensorCard icon={CloudRain} label="Field 3" value={data.iot.field3 || 'N/A'} />
              <SensorCard icon={Sun} label="Field 4" value={data.iot.field4 || 'N/A'} />
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-purple-500" /> History ({history.length})
              </h2>
              <button onClick={clearHistory} className="text-sm text-red-600 flex items-center gap-1">
                <Trash2 className="w-4 h-4" /> Clear All
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {history.map((h, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                  <span>Weather: {h.weather?.temperature?.toFixed(1)}°C | Soil pH: {h.soil?.soilPH}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{new Date(h.timestamp).toLocaleTimeString()}</span>
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

function SourceBadge({ icon: Icon, label, active }: { icon: any; label: string; active: boolean }) {
  return (
    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      <Icon className="w-3 h-3" /> {label} {active ? '✓' : '✗'}
    </span>
  )
}

function SensorCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl border bg-neutral-50 dark:bg-neutral-800 text-center">
      <Icon className="w-5 h-5 mx-auto mb-2 text-green-600" />
      <p className="text-sm font-bold">{label}</p>
      <p className="text-lg font-bold text-green-600">{value}</p>
    </div>
  )
}