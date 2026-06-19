'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, TrendingUp, Users, Clock, Zap } from 'lucide-react'
import Link from 'next/link'

const caseStudies = [
  {
    id: 1,
    company: 'TechAfrica Financial',
    industry: 'FinTech',
    challenge: 'Manual fraud detection was missing 40% of cases',
    solution: 'AI-powered real-time fraud detection system',
    results: [
      { icon: TrendingUp, label: 'Detection Rate', value: '99.7%' },
      { icon: Clock, label: 'Processing Time', value: '<10ms' },
      { icon: Zap, label: 'Cost Savings', value: 'KSh 120M/yr' },
    ],
    color: 'from-blue-600 to-cyan-600',
  },
  {
    id: 2,
    company: 'HealthPlus Hospitals',
    industry: 'Healthcare',
    challenge: 'Patient wait times averaging 45 minutes',
    solution: 'AI triage and automated patient management',
    results: [
      { icon: Clock, label: 'Wait Time', value: '8 min' },
      { icon: Users, label: 'Patients Served', value: '+300%' },
      { icon: TrendingUp, label: 'Satisfaction', value: '98%' },
    ],
    color: 'from-green-600 to-emerald-600',
  },
  {
    id: 3,
    company: 'LogiTrans East Africa',
    industry: 'Logistics',
    challenge: 'Fleet management causing 25% delivery delays',
    solution: 'IIoT fleet tracking with predictive routing',
    results: [
      { icon: TrendingUp, label: 'On-Time Delivery', value: '98%' },
      { icon: Zap, label: 'Fuel Savings', value: '35%' },
      { icon: Clock, label: 'Route Optimization', value: 'Real-time' },
    ],
    color: 'from-purple-600 to-pink-600',
  },
]

export function CaseStudies() {
  const [activeStudy, setActiveStudy] = useState(1)

  return (
    <section className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Client Success Stories
          </span>
          <h2 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
            Proven{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Results
            </span>
          </h2>
          <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            See how we've transformed businesses across Africa with AI-powered solutions.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Case Study Navigation */}
          <div className="space-y-4">
            {caseStudies.map((study) => (
              <motion.button
                key={study.id}
                onClick={() => setActiveStudy(study.id)}
                whileHover={{ x: 4 }}
                className={`w-full text-left p-6 rounded-2xl border transition-all ${
                  activeStudy === study.id
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 shadow-lg'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg">{study.company}</h3>
                  <span className="text-xs px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                    {study.industry}
                  </span>
                </div>
                <p className="text-sm text-red-500 mb-1">❌ {study.challenge}</p>
                <p className="text-sm text-green-600">✅ {study.solution}</p>
              </motion.button>
            ))}
          </div>

          {/* Case Study Details */}
          <AnimatePresence mode="wait">
            {caseStudies.filter(s => s.id === activeStudy).map((study) => (
              <motion.div
                key={study.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`p-8 rounded-3xl bg-gradient-to-br ${study.color} text-white`}
              >
                <h3 className="text-3xl font-bold mb-6">{study.company}</h3>
                
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {study.results.map((result) => {
                    const Icon = result.icon
                    return (
                      <div key={result.label} className="text-center p-4 rounded-2xl bg-white/10 backdrop-blur-sm">
                        <Icon className="w-6 h-6 mx-auto mb-2" />
                        <div className="text-2xl font-bold">{result.value}</div>
                        <div className="text-xs text-white/70">{result.label}</div>
                      </div>
                    )
                  })}
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-white/10">
                    <p className="text-sm text-white/70">Challenge</p>
                    <p className="font-medium">{study.challenge}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/10">
                    <p className="text-sm text-white/70">Solution</p>
                    <p className="font-medium">{study.solution}</p>
                  </div>
                </div>

                <Link
                  href="/contact"
                  className="mt-6 inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors"
                >
                  View full case study <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}