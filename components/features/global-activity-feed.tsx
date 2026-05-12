'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, CheckCircle, Clock } from 'lucide-react'

const activities = [
  {
    text: 'A FinTech in Berlin deployed their AI fraud detection system built by Intelliwave.',
    time: '2 minutes ago',
    location: 'Berlin, Germany',
  },
  {
    text: 'Hospital network in Singapore launched their patient portal — 50,000+ users onboarded.',
    time: '15 minutes ago',
    location: 'Singapore',
  },
  {
    text: 'EdTech startup in Nairobi shipped their mobile app to 100,000+ downloads.',
    time: '1 hour ago',
    location: 'Nairobi, Kenya',
  },
  {
    text: 'Enterprise client in Dubai migrated legacy ERP to Intelliwave Cloud — 40% cost reduction.',
    time: '2 hours ago',
    location: 'Dubai, UAE',
  },
  {
    text: 'SaaS platform in London scaled to 1M users on Intelliwave infrastructure.',
    time: '3 hours ago',
    location: 'London, UK',
  },
]

export function GlobalActivityFeed() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % activities.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full overflow-hidden">
      <div className="glassmorphism border rounded-full px-5 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Globe className="w-4 h-4 text-primary" />
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-green-500">LIVE</span>
          </span>
        </div>
        
        <div className="flex-1 overflow-hidden relative h-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center"
            >
              <p className="text-sm truncate">{activities[index].text}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{activities[index].time}</span>
          <CheckCircle className="w-4 h-4 text-green-500" />
        </div>
      </div>
    </div>
  )
}