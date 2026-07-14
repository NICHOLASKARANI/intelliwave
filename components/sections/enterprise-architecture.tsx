'use client'

import { motion } from 'framer-motion'
import { 
  Server, Cloud, Shield, Database, Cpu, 
  Network, Layers, Workflow, Zap, Globe 
} from 'lucide-react'

const architectureLayers = [
  { icon: Globe, label: 'Global Edge Network', desc: '200+ edge nodes worldwide', color: 'from-blue-500 to-cyan-500', latency: '<10ms' },
  { icon: Shield, label: 'Zero-Trust Security', desc: 'SOC 2 • ISO 27001 • GDPR', color: 'from-green-500 to-emerald-500', latency: 'Real-time' },
  { icon: Cpu, label: 'AI Orchestration Engine', desc: '50+ AI models deployed', color: 'from-purple-500 to-pink-500', latency: '<50ms' },
  { icon: Database, label: 'Multi-Tenant Data Layer', desc: 'Petabyte-scale processing', color: 'from-orange-500 to-red-500', latency: '<5ms' },
  { icon: Workflow, label: 'Intelligent Workflow Engine', desc: '1M+ workflows automated', color: 'from-yellow-500 to-orange-500', latency: '<100ms' },
  { icon: Layers, label: 'Enterprise Integration Bus', desc: '500+ API connectors', color: 'from-indigo-500 to-blue-500', latency: '<20ms' },
]

export function EnterpriseArchitecture() {
  return (
    <section className="py-24 bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(59,130,246,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(139,92,246,0.3) 0%, transparent 50%)'
      }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
            <Server className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-400">Distributed Enterprise Architecture</span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Engineered for{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Global Scale</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            A distributed, multi-tenant architecture processing millions of transactions per second across 200+ edge nodes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {architectureLayers.map((layer, index) => {
            const Icon = layer.icon
            return (
              <motion.div
                key={layer.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl hover:border-blue-500/30 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${layer.color} p-2.5 mb-4`}>
                  <Icon className="w-full h-full text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{layer.label}</h3>
                <p className="text-gray-400 text-sm mb-3">{layer.desc}</p>
                <div className="flex items-center gap-2 text-xs">
                  <Zap className="w-3 h-3 text-yellow-400" />
                  <span className="text-yellow-400">{layer.latency}</span>
                  <span className="text-gray-500">response time</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}