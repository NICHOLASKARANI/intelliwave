'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, Server, Cpu, Database, Globe, 
  Zap, Users, GitBranch, Cloud, Shield,
  TrendingUp, Clock, Wifi, HardDrive
} from 'lucide-react'

export function MissionControl() {
  const [time, setTime] = useState(new Date())
  const [metrics, setMetrics] = useState({
    activeProjects: 1247,
    deployments: 3842,
    apiCalls: 0,
    uptime: 99.99,
    users: 450000,
    countries: 100,
  })

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    const apiTimer = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        apiCalls: prev.apiCalls + Math.floor(Math.random() * 100),
      }))
    }, 2000)
    return () => {
      clearInterval(timer)
      clearInterval(apiTimer)
    }
  }, [])

  const systems = [
    { icon: Server, name: 'AI Engine', status: 'Operational', load: 42 },
    { icon: Database, name: 'Database Cluster', status: 'Operational', load: 67 },
    { icon: Cloud, name: 'Cloud Infrastructure', status: 'Operational', load: 35 },
    { icon: Globe, name: 'CDN Network', status: 'Operational', load: 28 },
    { icon: Shield, name: 'Security System', status: 'Operational', load: 15 },
    { icon: Cpu, name: 'ML Training', status: 'Running', load: 89 },
  ]

  return (
    <div className="p-8 rounded-2xl border bg-gradient-to-br from-gray-950 via-blue-950/20 to-gray-950 text-white relative overflow-hidden">
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(rgba(0,150,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,150,255,0.5) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-bold">Mission Control</h2>
            <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">ALL SYSTEMS NOMINAL</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono text-blue-400">
              {time.toLocaleTimeString('en-US', { hour12: false })}
            </div>
            <div className="text-xs text-gray-500">
              {time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Main Metrics */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-8">
          {[
            { icon: GitBranch, label: 'Active Projects', value: metrics.activeProjects.toLocaleString(), color: 'text-blue-400' },
            { icon: Rocket, label: 'Deployments', value: metrics.deployments.toLocaleString(), color: 'text-purple-400' },
            { icon: Activity, label: 'API Calls', value: metrics.apiCalls.toLocaleString(), color: 'text-green-400' },
            { icon: Wifi, label: 'Uptime', value: `${metrics.uptime}%`, color: 'text-yellow-400' },
            { icon: Users, label: 'Users', value: (metrics.users / 1000).toFixed(0) + 'K', color: 'text-cyan-400' },
            { icon: Globe, label: 'Countries', value: metrics.countries.toString(), color: 'text-pink-400' },
          ].map((metric) => {
            const Icon = metric.icon
            return (
              <div key={metric.label} className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                <Icon className={`w-6 h-6 ${metric.color} mx-auto mb-2`} />
                <div className="text-xl font-bold">{metric.value}</div>
                <div className="text-xs text-gray-500">{metric.label}</div>
              </div>
            )
          })}
        </div>

        {/* System Status */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {systems.map((system) => {
            const Icon = system.icon
            return (
              <motion.div
                key={system.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-blue-400" />
                    <span className="font-medium text-sm">{system.name}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    system.status === 'Operational' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {system.status}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      system.load > 80 ? 'bg-red-500' : system.load > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${system.load}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">Load: {system.load}%</div>
              </motion.div>
            )
          })}
        </div>

        {/* Live Log */}
        <div className="mt-8 p-4 rounded-xl bg-black/40 border border-gray-700 font-mono text-xs">
          <div className="text-green-400 mb-2">$ mission-control --stream</div>
          <div className="space-y-1 text-gray-400">
            <div><span className="text-blue-400">[INFO]</span> AI Model training completed - Accuracy: 97.3%</div>
            <div><span className="text-green-400">[OK]</span> Deployment #3842 successful to edge network</div>
            <div><span className="text-yellow-400">[WARN]</span> High traffic detected - Auto-scaling activated</div>
            <div><span className="text-blue-400">[INFO]</span> New user signup from Nairobi, Kenya</div>
            <div className="flex items-center gap-2">
              <span className="animate-pulse text-green-400">█</span>
              <span className="text-gray-500">Listening for events...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}