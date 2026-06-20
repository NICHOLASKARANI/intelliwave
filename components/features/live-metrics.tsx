'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, Users, Code2, Globe, Clock, 
  Zap, ArrowUpRight
} from 'lucide-react'

interface Metric {
  label: string
  value: number
  prefix?: string
  suffix?: string
  change: number
  icon: any
  color: string
}

export function LiveMetrics() {
  const [metrics] = useState<Metric[]>([
    { label: 'Projects Delivered', value: 10000, suffix: '+', change: 12.5, icon: Code2, color: 'from-indigo-600 to-blue-600' },
    { label: 'Active Users', value: 450000, suffix: '+', change: 8.3, icon: Users, color: 'from-purple-600 to-pink-600' },
    { label: 'Countries Served', value: 100, suffix: '+', change: 15.2, icon: Globe, color: 'from-green-600 to-emerald-600' },
    { label: 'AI Engineers', value: 500, suffix: '+', change: 22.1, icon: Zap, color: 'from-orange-600 to-red-600' },
    { label: 'Uptime', value: 99.99, suffix: '%', change: 0, icon: Clock, color: 'from-cyan-600 to-blue-600' },
    { label: 'Revenue Growth', value: 156, suffix: '%', change: 34.7, icon: TrendingUp, color: 'from-pink-600 to-rose-600' },
  ])

  const [animatedValues, setAnimatedValues] = useState<number[]>(metrics.map(() => 0))

  useEffect(() => {
    const duration = 2000
    const steps = 60
    const interval = duration / steps
    
    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      const progress = currentStep / steps
      const eased = 1 - Math.pow(1 - progress, 3)
      
      setAnimatedValues(
        metrics.map(m => Math.floor(m.value * eased * 100) / 100)
      )
      
      if (currentStep >= steps) {
        clearInterval(timer)
        setAnimatedValues(metrics.map(m => m.value))
      }
    }, interval)
    
    return () => clearInterval(timer)
  }, [metrics])

  const formatValue = (value: number, metric: Metric) => {
    if (metric.label === 'Uptime') return value.toFixed(2)
    if (value >= 1000 && metric.label !== 'Revenue Growth') {
      return (value / 1000).toFixed(1) + 'K'
    }
    return Math.floor(value).toString()
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        const displayValue = formatValue(animatedValues[index], metric)
        
        return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4 }}
            className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border dark:border-neutral-800 shadow-sm hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${metric.color} flex items-center justify-center`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              {metric.change > 0 && (
                <div className="flex items-center gap-0.5 text-green-500 text-xs font-medium">
                  <ArrowUpRight className="w-3 h-3" />
                  {metric.change}%
                </div>
              )}
            </div>
            <div className="text-2xl font-bold tracking-tight">
              {metric.prefix}{displayValue}{metric.suffix}
            </div>
            <div className="text-xs text-neutral-500 mt-1">{metric.label}</div>
          </motion.div>
        )
      })}
    </div>
  )
}