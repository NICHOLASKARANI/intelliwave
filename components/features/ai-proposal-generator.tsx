'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, FileText, Send, Loader2, Check, Copy,
  Building2, DollarSign, Clock, Users, ArrowRight
} from 'lucide-react'

interface Proposal {
  title: string
  overview: string
  timeline: string
  budget: string
  team: string
  deliverables: string[]
}

export function AIProposalGenerator() {
  const [companyName, setCompanyName] = useState('')
  const [projectType, setProjectType] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [step, setStep] = useState(1)

  const projectTypes = [
    'AI/ML Solution',
    'Web Application',
    'Mobile App',
    'Enterprise SaaS',
    'IIoT System',
    'Cloud Migration',
  ]

  const generateProposal = async () => {
    setIsGenerating(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setProposal({
      title: `${projectType} for ${companyName}`,
      overview: `Comprehensive ${projectType.toLowerCase()} solution designed to transform ${companyName}'s operations with cutting-edge technology and AI-powered automation.`,
      timeline: '12-16 weeks',
      budget: 'KSh 1,500,000 - 3,000,000',
      team: '5-7 dedicated engineers',
      deliverables: [
        'Complete system architecture',
        'Fully functional application',
        'API documentation',
        'Admin dashboard',
        'User training materials',
        '12 months support',
      ],
    })
    setIsGenerating(false)
  }

  return (
    <div className="rounded-3xl border bg-white dark:bg-neutral-950 shadow-2xl overflow-hidden">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">AI Proposal Generator</h3>
            <p className="text-sm text-neutral-500">Generate professional proposals in seconds</p>
          </div>
        </div>

        {!proposal ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Company Name</label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter your company name"
                className="w-full px-4 py-3 rounded-xl border dark:border-neutral-800 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Project Type</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {projectTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setProjectType(type)}
                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      projectType === type
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-indigo-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={generateProposal}
              disabled={!companyName || !projectType || isGenerating}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              {isGenerating ? 'Generating Proposal...' : 'Generate Proposal'}
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border border-indigo-200 dark:border-indigo-800">
              <h4 className="text-xl font-bold mb-4">{proposal.title}</h4>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">{proposal.overview}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-neutral-900">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="text-xs text-neutral-500">Timeline</p>
                    <p className="font-semibold">{proposal.timeline}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-neutral-900">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-xs text-neutral-500">Budget</p>
                    <p className="font-semibold">{proposal.budget}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-neutral-900">
                  <Users className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-neutral-500">Team Size</p>
                    <p className="font-semibold">{proposal.team}</p>
                  </div>
                </div>
              </div>

              <h5 className="font-semibold mb-3">Deliverables</h5>
              <ul className="space-y-2">
                {proposal.deliverables.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(JSON.stringify(proposal, null, 2))}
                className="flex-1 py-3 border dark:border-neutral-800 rounded-xl font-medium hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Proposal
              </button>
              <button
                onClick={() => { setProposal(null); setCompanyName(''); setProjectType('') }}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                New Proposal
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}