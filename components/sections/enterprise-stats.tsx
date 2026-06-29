'use client'

import { motion } from 'framer-motion'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { Globe, Building2, Cpu, Users, Zap, Cloud, TrendingUp, Shield } from 'lucide-react'

const stats = [
  { icon: Globe, value: 100, suffix: '+', label: 'Countries Served' },
  { icon: Building2, value: 5000, suffix: '+', label: 'Enterprise Clients' },
  { icon: Cpu, value: 250, suffix: '+', label: 'AI Models Deployed' },
  { icon: Users, value: 450000, suffix: '+', label: 'Active Users' },
  { icon: Zap, value: 99.99, suffix: '%', label: 'System Uptime' },
  { icon: Cloud, value: 10000, suffix: '+', label: 'Projects Delivered' },
  { icon: TrendingUp, value: 50, suffix: '+', label: 'Industries Supported' },
  { icon: Shield, value: 8, suffix: '', label: 'API Integrations' },
]

export function EnterpriseStats() {
  return (
    <section className="py-16 bg-gradient-to-br from-neutral-950 via-indigo-950 to-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Enterprise{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              Scale
            </span>
          </h2>
          <p className="text-xl text-neutral-400">Trusted by organizations worldwide</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl"
              >
                <Icon className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-bold text-white">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} duration={2000} />
                </div>
                <div className="text-sm text-neutral-400 mt-2">{stat.label}</div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}