'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Globe, Users, Building2, Code2 } from 'lucide-react'

const regions = [
  { name: 'East Africa', x: '55%', y: '55%', clients: '15,000+', projects: '3,000+' },
  { name: 'West Africa', x: '40%', y: '45%', clients: '8,000+', projects: '2,000+' },
  { name: 'Southern Africa', x: '50%', y: '75%', clients: '6,000+', projects: '1,500+' },
  { name: 'North Africa', x: '48%', y: '25%', clients: '4,000+', projects: '1,000+' },
  { name: 'Middle East', x: '60%', y: '30%', clients: '3,000+', projects: '800+' },
  { name: 'Europe', x: '45%', y: '15%', clients: '2,000+', projects: '500+' },
]

export function WorldMap() {
  const [activeRegion, setActiveRegion] = useState<string | null>(null)

  return (
    <section className="py-24 bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-4">
            Global{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Presence</span>
          </h2>
          <p className="text-xl text-muted-foreground">Serving enterprises across the world</p>
        </div>

        <div className="relative w-full aspect-[2/1] max-w-4xl mx-auto rounded-3xl border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 overflow-hidden">
          <Globe className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 text-blue-200 dark:text-blue-900/30" />
          
          {regions.map((region) => (
            <motion.button
              key={region.name}
              className="absolute w-4 h-4 bg-blue-500 rounded-full cursor-pointer"
              style={{ left: region.x, top: region.y, transform: 'translate(-50%, -50%)' }}
              whileHover={{ scale: 2 }}
              onMouseEnter={() => setActiveRegion(region.name)}
              onMouseLeave={() => setActiveRegion(null)}
            >
              <motion.div
                className="absolute inset-0 rounded-full bg-blue-500"
                animate={{ scale: [1, 2, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              {activeRegion === region.name && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-6 left-1/2 -translate-x-1/2 bg-white dark:bg-neutral-900 border shadow-xl rounded-xl p-4 w-48 z-10"
                >
                  <p className="font-bold text-sm">{region.name}</p>
                  <div className="text-xs text-muted-foreground mt-2 space-y-1">
                    <div className="flex items-center gap-2"><Users className="w-3 h-3" />{region.clients} clients</div>
                    <div className="flex items-center gap-2"><Code2 className="w-3 h-3" />{region.projects} projects</div>
                  </div>
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  )
}