'use client'

import { motion } from 'framer-motion'
import { ArrowRight, TrendingDown, TrendingUp, Clock, Users, DollarSign } from 'lucide-react'

const caseStudies = [
  {
    company: 'Leading Kenyan Bank',
    industry: 'Financial Services',
    challenge: 'Manual customer service handling 50,000+ queries monthly with 45-min average response time.',
    solution: 'AI-powered customer service platform with NLP in English and Swahili.',
    results: [
      { icon: TrendingDown, label: 'Response Time', value: '-82%', detail: '45min → 8min' },
      { icon: DollarSign, label: 'Cost Savings', value: 'KSh 68M', detail: 'Annual reduction' },
      { icon: Users, label: 'CSAT Score', value: '94%', detail: 'Up from 72%' },
    ],
    testimonial: {
      quote: "IntelliWave transformed our customer service. The AI handles 80% of queries automatically.",
      name: "James Mwangi",
      role: "Head of Digital Transformation",
    },
    color: 'from-blue-600 to-cyan-600',
  },
  {
    company: 'East African Manufacturer',
    industry: 'Manufacturing',
    challenge: 'Factory downtime averaging 120 hours/month due to reactive maintenance.',
    solution: 'IIoT predictive maintenance system with real-time sensor monitoring.',
    results: [
      { icon: TrendingDown, label: 'Downtime', value: '-71%', detail: '120hrs → 35hrs/month' },
      { icon: DollarSign, label: 'Savings', value: 'KSh 45M', detail: 'Annual maintenance' },
      { icon: TrendingUp, label: 'Productivity', value: '+40%', detail: 'Output increase' },
    ],
    testimonial: {
      quote: "The IIoT system paid for itself in 3 months. Our factory has never been more efficient.",
      name: "Sarah Wanjiku",
      role: "Operations Director",
    },
    color: 'from-green-600 to-emerald-600',
  },
  {
    company: 'Pan-African Logistics Company',
    industry: 'Logistics & Supply Chain',
    challenge: '25% delivery delays and 15% fuel wastage across 500+ vehicle fleet.',
    solution: 'AI route optimization and fleet management platform.',
    results: [
      { icon: TrendingDown, label: 'Delays', value: '-92%', detail: '25% → 2% delays' },
      { icon: TrendingDown, label: 'Fuel Costs', value: '-35%', detail: 'KSh 28M saved' },
      { icon: TrendingUp, label: 'On-Time', value: '98%', detail: 'Delivery rate' },
    ],
    testimonial: {
      quote: "We now deliver on time, every time. Our clients notice the difference.",
      name: "David Ochieng",
      role: "CEO",
    },
    color: 'from-purple-600 to-pink-600',
  },
]

export function RealCaseStudies() {
  return (
    <section className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 text-sm font-medium mb-6">
            <TrendingUp className="w-4 h-4" />
            Proven Results
          </span>
          <h2 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
            Real Results from{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Real Clients
            </span>
          </h2>
          <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            Measurable outcomes, not just promises. See how we transform businesses.
          </p>
        </div>

        <div className="space-y-8">
          {caseStudies.map((study, index) => (
            <motion.div
              key={study.company}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="rounded-3xl border dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden"
            >
              <div className="grid lg:grid-cols-3">
                {/* Company Info */}
                <div className={`p-8 bg-gradient-to-br ${study.color} text-white`}>
                  <h3 className="text-2xl font-bold mb-2">{study.company}</h3>
                  <p className="text-white/70 text-sm mb-6">{study.industry}</p>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-white/50 uppercase tracking-wider">Challenge</p>
                      <p className="text-sm mt-1">{study.challenge}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/50 uppercase tracking-wider">Solution</p>
                      <p className="text-sm mt-1">{study.solution}</p>
                    </div>
                  </div>

                  <blockquote className="mt-6 pt-6 border-t border-white/20">
                    <p className="text-sm italic">"{study.testimonial.quote}"</p>
                    <footer className="mt-2 text-xs text-white/70">
                      — {study.testimonial.name}, {study.testimonial.role}
                    </footer>
                  </blockquote>
                </div>

                {/* Results */}
                <div className="lg:col-span-2 p-8">
                  <h4 className="font-semibold mb-6">Measurable Outcomes</h4>
                  <div className="grid md:grid-cols-3 gap-6">
                    {study.results.map((result) => {
                      const Icon = result.icon
                      return (
                        <div key={result.label} className="text-center p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border dark:border-neutral-800">
                          <Icon className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-3" />
                          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                            {result.value}
                          </div>
                          <div className="text-sm font-medium">{result.label}</div>
                          <div className="text-xs text-neutral-500 mt-1">{result.detail}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}