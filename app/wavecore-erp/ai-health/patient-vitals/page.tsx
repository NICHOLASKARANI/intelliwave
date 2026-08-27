'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Activity, Thermometer, Droplets, Wind, AlertTriangle, CheckCircle, History, User, Gauge, Brain } from 'lucide-react'

interface PatientVitals {
  id: string
  patientId: string
  heartRate: number
  bloodPressure: string
  temperature: number
  oxygenSaturation: number
  respiratoryRate: number
  consciousness: string
  distressLevel: string
  timestamp: string
}

export default function PatientVitalsPage() {
  const [monitoring, setMonitoring] = useState(false)
  const [patients, setPatients] = useState<PatientVitals[]>([])
  const [latest, setLatest] = useState<PatientVitals | null>(null)
  const [alertActive, setAlertActive] = useState(false)

  useEffect(() => {
    let interval: any
    if (monitoring) {
      interval = setInterval(async () => {
        try {
          const res = await fetch('/api/wavecore/ai-health/patient-vitals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sensor: 'vitals-monitor' })
          })
          const d = await res.json()
          if (d.success) {
            setLatest(d.data)
            setPatients(prev => [d.data, ...prev].slice(0, 30))
            if (d.data.distressLevel === 'CRITICAL') {
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
          <span className="text-sm">Patient Vitals Monitoring</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Activity className="w-6 h-6 text-red-500" /> Patient Vitals Monitoring
        </h1>

        {/* Alert */}
        {alertActive && (
          <div className="mb-6 p-6 rounded-2xl bg-red-600 text-white text-center animate-pulse">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
            <h2 className="text-2xl font-bold">⚠️ CRITICAL PATIENT!</h2>
            <p className="mt-2">Immediate medical attention required</p>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6 text-center">
          {!monitoring ? (
            <button onClick={() => setMonitoring(true)}
              className="px-8 py-4 rounded-xl bg-red-600 text-white font-bold text-lg flex items-center gap-2 mx-auto">
              <Heart className="w-5 h-5" /> Start Patient Monitoring
            </button>
          ) : (
            <button onClick={() => setMonitoring(false)}
              className="px-8 py-4 rounded-xl bg-neutral-600 text-white font-bold text-lg">
              Stop Monitoring
            </button>
          )}
        </div>

        {/* Live Vitals */}
        {latest && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <VitalCard icon={Heart} label="Heart Rate" value={`${latest.heartRate}`} unit="BPM" status={latest.heartRate > 120 ? 'bad' : 'good'} />
            <VitalCard icon={Gauge} label="Blood Pressure" value={latest.bloodPressure} unit="" status={latest.bloodPressure.includes('140') ? 'bad' : 'good'} />
            <VitalCard icon={Thermometer} label="Temperature" value={`${latest.temperature.toFixed(1)}`} unit="°C" status={latest.temperature > 38 ? 'bad' : 'good'} />
            <VitalCard icon={Droplets} label="O2 Saturation" value={`${latest.oxygenSaturation}`} unit="%" status={latest.oxygenSaturation < 90 ? 'bad' : 'good'} />
            <VitalCard icon={Wind} label="Respiratory" value={`${latest.respiratoryRate}`} unit="/min" status={latest.respiratoryRate > 25 ? 'bad' : 'good'} />
            <VitalCard icon={Brain} label="Consciousness" value={latest.consciousness} unit="" status={latest.consciousness === 'Alert' ? 'good' : 'bad'} />
          </div>
        )}

        {/* Patient Info */}
        {latest && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-blue-500" />
              <div>
                <p className="font-bold text-lg">Patient: {latest.patientId}</p>
                <p className={`text-sm font-bold ${latest.distressLevel === 'CRITICAL' ? 'text-red-600' : 'text-green-600'}`}>
                  Distress Level: {latest.distressLevel}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-500" /> Patient History
          </h2>
          {patients.length === 0 ? (
            <p className="text-muted-foreground">No patients monitored yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {patients.map((p, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                  <span>{p.patientId} - HR: {p.heartRate} - O2: {p.oxygenSaturation}%</span>
                  <span className={`text-sm font-bold ${p.distressLevel === 'CRITICAL' ? 'text-red-600' : 'text-green-600'}`}>
                    {p.distressLevel}
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

function VitalCard({ icon: Icon, label, value, unit, status }: { icon: any; label: string; value: string; unit: string; status: string }) {
  return (
    <div className={`p-4 rounded-xl border text-center ${status === 'good' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <Icon className={`w-5 h-5 mx-auto mb-2 ${status === 'good' ? 'text-green-600' : 'text-red-600'}`} />
      <p className="text-xs font-bold">{label}</p>
      <p className={`text-lg font-bold ${status === 'good' ? 'text-green-600' : 'text-red-600'}`}>
        {value}{unit}
      </p>
    </div>
  )
}