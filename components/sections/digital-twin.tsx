'use client'

import { motion } from 'framer-motion'
import { Factory, Building2, Heart, Truck, Activity, Cpu } from 'lucide-react'

const twins = [
  {
    icon: Factory,
    label: 'Smart Factory',
    desc: 'Real-time production monitoring with IIoT sensors and predictive maintenance.',
    metrics: ['OEE Tracking', 'Predictive Maintenance', 'Energy Optimization'],
  },
  {
    icon: Building2,
    label: 'Smart City',
    desc: 'Urban infrastructure management with AI-powered analytics and automation.',
    metrics: ['Traffic Flow', 'Energy Grid', 'Public Safety'],
  },
  {
    icon: Heart,
    label: 'Digital Hospital',
    desc: 'Patient flow optimization and resource management for healthcare facilities.',
    metrics: ['Patient Tracking', 'Asset Management', 'Staff Scheduling'],
  },
  {
    icon: Truck,
    label: 'Supply Chain',
    desc: 'End-to-end logistics visibility and optimization across the entire supply chain.',
    metrics: ['Route Optimization', 'Inventory Tracking', 'Demand Forecasting'],
  },
]

export function DigitalTwin() {
  return (
    <section className="py-24 bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 text-sm font-medium mb-6"
          >
            <Cpu className="w-4 h-4" /> Digital Twin Platform
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-bold mb-4">
            Digital Twin{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">Technology</span>
          </h2>
          <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto">
            Create virtual replicas of physical assets, systems, and processes for real-time monitoring and simulation.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {twins.map((twin, index) => {
            const Icon = twin.icon
            return (
              <motion.div
                key={twin.label}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
                className="p-8 rounded-2xl border hover:border-purple-300 dark:hover:border-purple-800 hover:shadow-xl transition-all"
              >
                <Icon className="w-12 h-12 text-purple-600 mb-4" />
                <h3 className="text-2xl font-bold mb-2">{twin.label}</h3>
                <p className="text-muted-foreground mb-6">{twin.desc}</p>
                <div className="space-y-2">
                  {twin.metrics.map((m) => (
                    <div key={m} className="flex items-center gap-2 text-sm">
                      <Activity className="w-4 h-4 text-green-500" />
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}