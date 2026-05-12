'use client'

import { motion } from 'framer-motion'
import { Target, Eye, Rocket, Globe } from 'lucide-react'

export function MissionVisionSection() {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="p-8 rounded-2xl border bg-gradient-to-br from-primary/5 to-primary/10"
      >
        <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
          <Target className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
        <p className="text-muted-foreground leading-relaxed">
          To democratize AI and software engineering excellence across Africa, 
          building transformative digital solutions that empower businesses to 
          compete globally. We strive to be the bridge between African innovation 
          and world-class technology.
        </p>
        <ul className="mt-6 space-y-3">
          {[
            'Deliver enterprise-grade AI solutions',
            'Empower 1 million African businesses',
            'Create 10,000 tech jobs by 2030',
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <Rocket className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="p-8 rounded-2xl border bg-gradient-to-br from-accent/5 to-accent/10"
      >
        <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center mb-6">
          <Eye className="w-7 h-7 text-accent" />
        </div>
        <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
        <p className="text-muted-foreground leading-relaxed">
          To be Africa's first trillion-dollar AI company — a global technology 
          leader headquartered in Kenya, rivaling the world's most innovative 
          companies. We envision an Africa where technology knows no boundaries.
        </p>
        <ul className="mt-6 space-y-3">
          {[
            'Global AI leadership from Africa',
            '$1 Trillion valuation by 2035',
            'Presence in 195 countries',
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-accent flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  )
}