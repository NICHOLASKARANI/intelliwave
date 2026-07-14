'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, Server, Cloud, Shield, Globe, Zap, Cpu, Database } from 'lucide-react'

export function MissionControl() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const systems = [
    { name: 'AI Engine', status: 'Online', load: 42, icon: Cpu },
    { name: 'Cloud Network', status: 'Online', load: 35, icon: Cloud },
    { name: 'Security Grid', status: 'Active', load: 28, icon: Shield },
    { name: 'Data Centers', status: 'Online', load: 55, icon: Server },
    { name: 'Edge Nodes', status: 'Online', load: 31, icon: Globe },
    { name: 'API Gateway', status: 'Active', load: 48, icon: Activity },
  ]

  return (
    <section className="py-24 bg-gradient-to-b from-slate-950 to-blue-950 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(rgba(0,150,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,150,255,0.3) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-12">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-green-400">Mission Control Active</span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">IntelliWave Mission Control</h2>
          <p className="text-xl text-gray-400">Real-time global infrastructure monitoring</p>
          <p className="text-sm text-gray-500 font-mono mt-2">{time.toLocaleTimeString()} UTC</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {systems.map((sys) => {
            const Icon = sys.icon
            return (
              <motion.div key={sys.name} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-medium">{sys.name}</span>
                  </div>
                  <span className="text-xs text-green-400">{sys.status}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                    initial={{ width: 0 }} whileInView={{ width: `${sys.load}%` }} viewport={{ once: true }}
                    transition={{ duration: 1 }} />
                </div>
                <div className="text-xs text-gray-500 mt-1">Load: {sys.load}%</div>
              </motion.div>
            )
          })}
        </div>

        {/* Live Logs */}
        <div className="p-4 rounded-xl bg-black/40 border border-gray-700 font-mono text-xs text-green-400">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4" />
            <span>System Logs</span>
          </div>
          <div className="space-y-1">
            <div>[OK] AI Model training completed - Accuracy: 97.3%</div>
            <div>[OK] Edge node deployed in Nairobi, Kenya</div>
            <div>[INFO] Processing 1.2M API requests/minute</div>
            <div>[OK] All systems nominal - Uptime: 99.99%</div>
            <div className="flex items-center gap-2">
              <span className="animate-pulse">█</span>
              <span className="text-gray-500">Listening for events...</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}