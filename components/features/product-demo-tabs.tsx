'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, FileText, Calculator, Zap } from 'lucide-react'
import { EnterpriseDashboard } from '@/components/features/enterprise-dashboard'
import { AIProposalGenerator } from '@/components/features/ai-proposal-generator'

const demos = [
  {
    id: 'dashboard',
    label: 'Analytics Dashboard',
    icon: BarChart3,
    component: EnterpriseDashboard,
    description: 'Real-time enterprise analytics with live data streaming and interactive charts.',
  },
  {
    id: 'proposal',
    label: 'AI Proposal Generator',
    icon: FileText,
    component: AIProposalGenerator,
    description: 'Generate professional project proposals with scope, budget, and timeline in seconds.',
  },
  {
    id: 'estimator',
    label: 'AI Cost Estimator',
    icon: Calculator,
    component: () => (
      <div className="p-8 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
        <Calculator className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">AI Cost Estimator</h3>
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          Get accurate project cost estimates powered by AI.
        </p>
        <input
          placeholder="Describe your project..."
          className="w-full px-4 py-3 rounded-xl border dark:border-neutral-800 bg-transparent mb-3"
        />
        <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
          Generate Estimate
        </button>
      </div>
    ),
    description: 'AI-powered cost estimation for software projects with timeline and team size recommendations.',
  },
  {
    id: 'automation',
    label: 'AI Automation',
    icon: Zap,
    component: () => (
      <div className="p-8 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
        <Zap className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">AI Automation Engine</h3>
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          Automate repetitive workflows with custom AI agents.
        </p>
        <div className="grid grid-cols-3 gap-4">
          {['Data Entry', 'Reporting', 'Compliance'].map((item) => (
            <div key={item} className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-sm font-medium">
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
    description: 'Custom AI agents that automate repetitive tasks and free up your team for strategic work.',
  },
]

export function ProductDemoTabs() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const activeDemo = demos.find((d) => d.id === activeTab) || demos[0]
  const DemoComponent = activeDemo.component

  return (
    <section className="py-24 md:py-32 bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Interactive Demos
          </span>
          <h2 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
            See IntelliWave{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              In Action
            </span>
          </h2>
          <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            Explore our products without signing up. Every demo is fully interactive.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {demos.map((demo) => {
            const Icon = demo.icon
            return (
              <button
                key={demo.id}
                onClick={() => setActiveTab(demo.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === demo.id
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {demo.label}
              </button>
            )
          })}
        </div>

        {/* Demo Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-center text-neutral-500 mb-6">{activeDemo.description}</p>
            <DemoComponent />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}