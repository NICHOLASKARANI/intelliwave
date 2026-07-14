'use client'

import { motion } from 'framer-motion'
import { Globe, Server, Cloud, Shield } from 'lucide-react'

const regions = [
  { name: 'East Africa', city: 'Nairobi', type: 'HQ & Data Center', status: 'Active', color: 'from-green-500 to-emerald-500' },
  { name: 'West Africa', city: 'Lagos', type: 'Regional Hub', status: 'Active', color: 'from-blue-500 to-cyan-500' },
  { name: 'Southern Africa', city: 'Johannesburg', type: 'Data Center', status: 'Active', color: 'from-purple-500 to-pink-500' },
  { name: 'North Africa', city: 'Cairo', type: 'Edge Node', status: 'Active', color: 'from-orange-500 to-red-500' },
  { name: 'Middle East', city: 'Dubai', type: 'Cloud Region', status: 'Active', color: 'from-yellow-500 to-orange-500' },
  { name: 'Europe', city: 'London', type: 'Cloud Region', status: 'Active', color: 'from-indigo-500 to-blue-500' },
  { name: 'Asia Pacific', city: 'Singapore', type: 'Edge Node', status: 'Active', color: 'from-cyan-500 to-blue-500' },
  { name: 'North America', city: 'Virginia', type: 'Cloud Region', status: 'Active', color: 'from-pink-500 to-rose-500' },
]

export function GlobalInfrastructure() {
  return (
    <section className="py-24 bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-600 text-sm font-medium mb-6">
            <Globe className="w-4 h-4" /> Global Infrastructure
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-4">
            Distributed Across{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-blue-600">8 Regions</span>
          </h2>
          <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto">
            Cloud regions, data centers, and edge nodes deployed globally for maximum performance and reliability.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {regions.map((region, index) => (
            <motion.div
              key={region.city}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              className="p-6 rounded-2xl border hover:shadow-lg transition-all"
            >
              <div className={`h-1.5 rounded-full bg-gradient-to-r ${region.color} mb-4 w-12`} />
              <h3 className="font-bold text-lg">{region.city}</h3>
              <p className="text-sm text-muted-foreground">{region.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{region.type}</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-green-500">{region.status}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}