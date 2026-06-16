'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, Thermometer, Gauge, Droplets, Zap, 
  AlertTriangle, CheckCircle, Clock, Factory,
  Wifi, Battery, Server
} from 'lucide-react'

interface SensorData {
  id: string
  name: string
  value: number
  unit: string
  status: 'normal' | 'warning' | 'critical'
  icon: any
  trend: 'up' | 'down' | 'stable'
}

export function IIoTDashboard() {
  const [sensors, setSensors] = useState<SensorData[]>([
    { id: '1', name: 'Motor Temperature', value: 62, unit: '°C', status: 'normal', icon: Thermometer, trend: 'stable' },
    { id: '2', name: 'Vibration Level', value: 2.4, unit: 'mm/s', status: 'normal', icon: Activity, trend: 'stable' },
    { id: '3', name: 'Pressure', value: 98, unit: 'PSI', status: 'normal', icon: Gauge, trend: 'stable' },
    { id: '4', name: 'Humidity', value: 45, unit: '%', status: 'normal', icon: Droplets, trend: 'down' },
    { id: '5', name: 'Power Consumption', value: 340, unit: 'kW', status: 'warning', icon: Zap, trend: 'up' },
    { id: '6', name: 'Oil Level', value: 72, unit: '%', status: 'normal', icon: Battery, trend: 'stable' },
  ])

  const [alerts] = useState([
    { id: '1', message: 'Preventive maintenance scheduled for Motor #3', time: '2 min ago', type: 'info' },
    { id: '2', message: 'Pressure spike detected in Line B - Auto-adjusted', time: '15 min ago', type: 'warning' },
    { id: '3', message: 'All systems operational - Efficiency: 94%', time: '1 hour ago', type: 'success' },
  ])

  // Simulate live sensor updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSensors(prev => prev.map(sensor => ({
        ...sensor,
        value: sensor.value + (Math.random() - 0.5) * 2,
        trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
      })))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-8 rounded-2xl border bg-gradient-to-br from-gray-950 via-blue-950/20 to-gray-950 text-white relative overflow-hidden">
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(rgba(0,255,136,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.5) 1px, transparent 1px)',
        backgroundSize: '30px 30px'
      }} />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Factory className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-bold">IIoT Live Monitor</h2>
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
              <Wifi className="w-3 h-3" />
              Connected
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Sensor Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {sensors.map((sensor) => {
            const Icon = sensor.icon
            const statusColor = sensor.status === 'normal' ? 'border-green-500/30' : 
                               sensor.status === 'warning' ? 'border-yellow-500/30' : 'border-red-500/30'
            
            return (
              <motion.div
                key={sensor.id}
                className={`p-4 rounded-xl bg-white/5 border ${statusColor} text-center`}
                whileHover={{ scale: 1.05 }}
              >
                <Icon className={`w-6 h-6 mx-auto mb-2 ${
                  sensor.status === 'normal' ? 'text-green-400' :
                  sensor.status === 'warning' ? 'text-yellow-400' : 'text-red-400'
                }`} />
                <div className="text-2xl font-bold">
                  {sensor.value.toFixed(1)}
                  <span className="text-sm text-gray-500 ml-1">{sensor.unit}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">{sensor.name}</div>
                <div className={`text-xs mt-1 ${
                  sensor.trend === 'up' ? 'text-red-400' :
                  sensor.trend === 'down' ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {sensor.trend === 'up' ? '↑ Rising' : sensor.trend === 'down' ? '↓ Falling' : '→ Stable'}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Alerts & Logs */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* System Health */}
          <div className="p-4 rounded-xl bg-black/40 border border-gray-700">
            <h3 className="font-bold text-blue-400 mb-4 flex items-center gap-2">
              <Server className="w-4 h-4" /> System Health
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Edge Gateway', status: 'Online', pct: 100 },
                { label: 'Cloud Connection', status: 'Connected', pct: 100 },
                { label: 'Data Pipeline', status: 'Active', pct: 98 },
                { label: 'AI Model', status: 'Running', pct: 95 },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${item.pct}%` }} />
                    </div>
                    <span className="text-xs text-green-400">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alert Log */}
          <div className="p-4 rounded-xl bg-black/40 border border-gray-700">
            <h3 className="font-bold text-yellow-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Alert Log
            </h3>
            <div className="space-y-3 max-h-[200px] overflow-y-auto">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-2 text-sm">
                  {alert.type === 'info' && <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />}
                  {alert.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />}
                  {alert.type === 'success' && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-gray-300">{alert.message}</p>
                    <p className="text-xs text-gray-600">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}