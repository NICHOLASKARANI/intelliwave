'use client'

import { motion } from 'framer-motion'
import { TrendingUp, DollarSign, Zap, Users, Shield, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const roiMetrics = [
  { icon: DollarSign, value: '40%', label: 'Cost Reduction', desc: 'Average operational savings' },
  { icon: Zap, value: '3x', label: 'Productivity Gain', desc: 'Workforce efficiency increase' },
  { icon: TrendingUp, value: '156%', label: 'Revenue Growth', desc: 'Year-over-year increase' },
  { icon: Clock, value: '85%', label: 'Faster Delivery', desc: 'Project timeline reduction' },
  { icon: Shield, value: '100%', label: 'Compliance Rate', desc: 'Regulatory adherence' },
  { icon: Users, value: '95%', label: 'User Adoption', desc: 'Enterprise-wide engagement' },
]

export function ExecutiveROI() {
  return (
    <section className="py-24 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Enterprise{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">ROI Impact</span>
          </h2>
          <p className="text-xl text-gray-400">Measurable outcomes from enterprise deployments</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {roiMetrics.map((metric) => {
            const Icon = metric.icon
            return (
              <motion.div key={metric.label} whileHover={{ y: -4 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-center">
                <Icon className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <div className="text-4xl font-bold text-white mb-1">{metric.value}</div>
                <div className="text-lg font-semibold text-green-400">{metric.label}</div>
                <div className="text-sm text-gray-500 mt-1">{metric.desc}</div>
              </motion.div>
            )
          })}
        </div>

        <div className="text-center">
          <Link href="/roi-calculator">
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white">
              Calculate Your ROI <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}