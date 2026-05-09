'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Users, Globe, Code2, Trophy, Building2, Zap } from 'lucide-react'

const stats = [
  {
    icon: Users,
    value: '450,000+',
    label: 'Active Business Owners',
    description: 'Worldwide community',
  },
  {
    icon: Globe,
    value: '100+',
    label: 'Countries Reached',
    description: 'Global presence',
  },
  {
    icon: Code2,
    value: '500+',
    label: 'AI Engineers',
    description: 'Expert team ready',
  },
  {
    icon: Trophy,
    value: '10,000+',
    label: 'Projects Delivered',
    description: 'Successful launches',
  },
  {
    icon: Building2,
    value: '50+',
    label: 'Enterprise Clients',
    description: 'Fortune 500 partners',
  },
  {
    icon: Zap,
    value: '99.9%',
    label: 'Uptime SLA',
    description: 'Enterprise reliability',
  },
]

export function GlobalStats() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section className="py-24 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Global{' '}
            <span className="text-gradient">Intelligence</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We have the world's largest buyer and investor community. See what buyers 
            search for and compare trending assets and categories.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glassmorphism rounded-2xl p-6 text-center hover:scale-105 transition-transform"
              >
                <Icon className="w-10 h-10 text-primary mx-auto mb-4" />
                <div className="text-3xl font-bold text-gradient mb-2">
                  {stat.value}
                </div>
                <div className="font-semibold mb-1">{stat.label}</div>
                <div className="text-sm text-muted-foreground">
                  {stat.description}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}