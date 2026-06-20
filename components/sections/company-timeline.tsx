'use client'

import { motion } from 'framer-motion'
import { Rocket, Code2, Globe, Zap } from 'lucide-react'

const milestones = [
  {
    year: '2024',
    title: 'Company Founded',
    description: 'IntelliWave established in Nairobi, Kenya with a vision to build enterprise AI for Africa.',
    icon: Rocket,
    color: 'from-indigo-600 to-blue-600',
    status: 'completed',
  },
  {
    year: '2025',
    title: 'First AI Products Launched',
    description: 'Released AI Proposal Generator and AI Cost Estimator. Signed first 10 enterprise customers.',
    icon: Code2,
    color: 'from-purple-600 to-pink-600',
    status: 'completed',
  },
  {
    year: '2025',
    title: 'SOC 2 Type II Certified',
    description: 'Achieved enterprise security certification. Expanded to serve financial services and healthcare.',
    icon: Zap,
    color: 'from-green-600 to-emerald-600',
    status: 'completed',
  },
  {
    year: '2026',
    title: 'Enterprise Platform Launch',
    description: 'Full platform launch with dashboard, automation engine, and consulting assistant.',
    icon: Globe,
    color: 'from-orange-600 to-red-600',
    status: 'in-progress',
  },
  {
    year: 'Future',
    title: 'Global Expansion',
    description: 'Scaling to 10,000+ enterprise customers across Africa and emerging markets worldwide.',
    icon: Rocket,
    color: 'from-cyan-600 to-blue-600',
    status: 'upcoming',
  },
]

export function CompanyTimeline() {
  return (
    <section className="py-24 md:py-32 bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 text-sm font-medium mb-6">
            <Rocket className="w-4 h-4" />
            Our Journey
          </span>
          <h2 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
            Building the{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Future
            </span>
          </h2>
          <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            From a Nairobi startup to an enterprise AI platform serving clients globally.
          </p>
        </div>

        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-neutral-200 dark:bg-neutral-800 transform md:-translate-x-px" />

          <div className="space-y-12">
            {milestones.map((milestone, index) => {
              const Icon = milestone.icon
              const isLeft = index % 2 === 0

              return (
                <motion.div
                  key={milestone.title}
                  initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className={`relative flex items-center ${
                    isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-8 md:left-1/2 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white dark:border-neutral-950 transform -translate-x-1/2 z-10" />

                  {/* Content */}
                  <div className={`ml-16 md:ml-0 md:w-1/2 ${isLeft ? 'md:pr-12' : 'md:pl-12'}`}>
                    <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border dark:border-neutral-800 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${milestone.color} flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            milestone.status === 'completed' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                            milestone.status === 'in-progress' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                            'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          }`}>
                            {milestone.status === 'completed' ? 'Completed' : 
                             milestone.status === 'in-progress' ? 'In Progress' : 'Upcoming'}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-1">{milestone.title}</h3>
                      <p className="text-sm text-neutral-500 mb-2">{milestone.year}</p>
                      <p className="text-neutral-600 dark:text-neutral-400 text-sm">{milestone.description}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}