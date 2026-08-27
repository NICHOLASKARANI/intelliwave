'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Car, Camera, Upload, Loader2, AlertTriangle, CheckCircle, Gauge, Battery, Thermometer, Droplet, Wrench, History } from 'lucide-react'

interface FaultDetection {
  id: string
  engineHealth: number
  batteryVoltage: number
  DropletPressure: number
  coolantTemp: number
  faultCodes: string[]
  severity: string
  confidence: number
  timestamp: string
}

export default function VehicleFaultPage() {
  const [cameraActive, setCameraActive] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [detections, setDetections] = useState<FaultDetection[]>([])
  const [latest, setLatest] = useState<FaultDetection | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
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

  const stopCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop())
    setCameraActive(false)
  }

  const detectFaults = async () => {
    setScanning(true)
    try {
      const res = await fetch('/api/wavecore/ai-vision/vehicle-faults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: 'dashboard-scan' })
      })
      const data = await res.json()
      if (data.success) {
        setLatest(data.detection)
        setDetections(prev => [data.detection, ...prev].slice(0, 20))
      }
    } catch {} finally {
      setScanning(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const res = await fetch('/api/wavecore/ai-vision/vehicle-faults', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: reader.result })
        })
        const data = await res.json()
        if (data.success) {
          setLatest(data.detection)
          setDetections(prev => [data.detection, ...prev].slice(0, 20))
        }
      } catch {} finally {
        setScanning(false)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Vehicle Fault Detection</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Car className="w-6 h-6 text-blue-500" /> Vehicle Fault Detection
        </h1>

        {/* Upload/Scan */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={detectFaults} disabled={scanning}
              className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-2 justify-center disabled:opacity-50">
              {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Car className="w-5 h-5" />}
              {scanning ? 'Scanning...' : 'Scan Dashboard'}
            </button>
            <label className="px-6 py-3 rounded-xl bg-green-600 text-white font-bold cursor-pointer flex items-center gap-2 justify-center">
              <Upload className="w-5 h-5" /> Upload Dashboard Photo
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Latest Result */}
        {latest && (
          <div className={`rounded-2xl border p-6 mb-6 ${latest.severity === 'CRITICAL' ? 'bg-red-50 border-red-200' : latest.severity === 'WARNING' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              {latest.severity === 'CRITICAL' ? <AlertTriangle className="w-5 h-5 text-red-600" /> : <CheckCircle className="w-5 h-5 text-green-600" />}
              Vehicle Health: {latest.severity}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard icon={Gauge} label="Engine Health" value={`${(latest.engineHealth * 100).toFixed(0)}%`} status={latest.engineHealth > 0.7 ? 'good' : 'bad'} />
              <MetricCard icon={Battery} label="Battery" value={`${latest.batteryVoltage.toFixed(1)}V`} status={latest.batteryVoltage > 11.5 ? 'good' : 'bad'} />
              <MetricCard icon={Droplet} label="Droplet Pressure" value={`${latest.DropletPressure.toFixed(0)} PSI`} status={latest.DropletPressure > 20 ? 'good' : 'bad'} />
              <MetricCard icon={Thermometer} label="Coolant" value={`${latest.coolantTemp.toFixed(0)}°C`} status={latest.coolantTemp < 110 ? 'good' : 'bad'} />
            </div>

            {/* Fault Codes */}
            {latest.faultCodes.length > 0 && (
              <div className="mt-4">
                <p className="font-bold mb-2">Fault Codes Detected:</p>
                <div className="space-y-2">
                  {latest.faultCodes.map((code, i) => (
                    <div key={i} className="p-2 rounded-lg bg-red-100 dark:bg-red-950 text-red-700 flex items-center gap-2">
                      <Wrench className="w-4 h-4" /> {code}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-500" /> Detection History
          </h2>
          {detections.length === 0 ? (
            <p className="text-muted-foreground">No scans yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {detections.map((det, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                  <span className={`font-bold ${det.severity === 'CRITICAL' ? 'text-red-600' : det.severity === 'WARNING' ? 'text-yellow-600' : 'text-green-600'}`}>
                    {det.severity}
                  </span>
                  <span className="text-sm text-muted-foreground">{new Date(det.timestamp).toLocaleTimeString()}</span>
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