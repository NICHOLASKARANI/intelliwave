'use client'

import { motion } from 'framer-motion'
import { Brain, Bot, Eye, MessageSquare, Scan, TrendingUp, Network, Lightbulb, Zap, Cpu } from 'lucide-react'

const capabilities = [
  { icon: Brain, label: 'Generative AI', color: 'from-purple-500 to-pink-500' },
  { icon: Bot, label: 'AI Agents', color: 'from-blue-500 to-cyan-500' },
  { icon: MessageSquare, label: 'NLP', color: 'from-green-500 to-emerald-500' },
  { icon: Eye, label: 'Computer Vision', color: 'from-orange-500 to-red-500' },
  { icon: Scan, label: 'OCR', color: 'from-yellow-500 to-orange-500' },
  { icon: TrendingUp, label: 'Predictive Analytics', color: 'from-indigo-500 to-blue-500' },
  { icon: Network, label: 'Machine Learning', color: 'from-pink-500 to-rose-500' },
  { icon: Lightbulb, label: 'Knowledge Graphs', color: 'from-cyan-500 to-blue-500' },
  { icon: Zap, label: 'Intelligent Automation', color: 'from-red-500 to-orange-500' },
  { icon: Cpu, label: 'IoT Intelligence', color: 'from-teal-500 to-green-500' },
]

export function AICapabilities() {
  return (
    <section className="py-24 bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 text-sm font-medium mb-6">
            <Brain className="w-4 h-4" /> AI Capabilities
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-4">
            Powered by{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">Advanced AI</span>
          </h2>
          <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto">
            Enterprise-grade AI capabilities powering intelligent automation and decision-making.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {capabilities.map((cap, index) => {
            const Icon = cap.icon
            return (
              <motion.div
                key={cap.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border bg-background hover:shadow-lg transition-all cursor-default"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cap.color} p-3`}>
                  <Icon className="w-full h-full text-white" />
                </div>
                <span className="text-sm font-medium text-center">{cap.label}</span>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}