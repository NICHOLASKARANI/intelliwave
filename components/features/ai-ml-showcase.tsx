'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, Cpu, Zap, TrendingUp, MessageSquare, Calculator } from 'lucide-react'

export function AIMLShowcase() {
  const [activeTab, setActiveTab] = useState('estimate')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const tabs = [
    { id: 'estimate', icon: Calculator, label: 'AI Estimator' },
    { id: 'recommend', icon: Brain, label: 'Smart Recommend' },
    { id: 'chat', icon: MessageSquare, label: 'AI Chat' },
  ]

  const handleEstimate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectType: 'webapp',
          features: ['auth', 'dashboard', 'api'],
          complexity: 'medium',
        }),
      })
      const data = await res.json()
      setResult(data.data)
    } catch (error) {
      console.error('Error:', error)
    }
    setLoading(false)
  }

  const handleRecommend = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: {
            goal: 'Build a SaaS Product',
            timeline: '1-3 Months',
            scale: 'Enterprise (100,000+)',
          },
        }),
      })
      const data = await res.json()
      setResult(data.data)
    } catch (error) {
      console.error('Error:', error)
    }
    setLoading(false)
  }

  const handleChat = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Tell me about your services and pricing',
        }),
      })
      const data = await res.json()
      setResult(data.data)
    } catch (error) {
      console.error('Error:', error)
    }
    setLoading(false)
  }

  return (
    <div className="p-8 rounded-2xl border bg-gradient-to-br from-background via-background to-primary/5">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold">AI & ML-Powered Features</h3>
        <p className="text-muted-foreground mt-2">
          Experience our intelligent automation in action
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 justify-center">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setResult(null) }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-muted hover:bg-primary/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Demo Buttons */}
      <div className="flex gap-4 justify-center mb-8">
        {activeTab === 'estimate' && (
          <button
            onClick={handleEstimate}
            disabled={loading}
            className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {loading ? 'Calculating...' : 'Get AI Estimate'}
          </button>
        )}
        {activeTab === 'recommend' && (
          <button
            onClick={handleRecommend}
            disabled={loading}
            className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Get Recommendations'}
          </button>
        )}
        {activeTab === 'chat' && (
          <button
            onClick={handleChat}
            disabled={loading}
            className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Talk to AI'}
          </button>
        )}
      </div>

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-black/40 border border-gray-700"
        >
          <pre className="text-green-400 text-sm overflow-auto max-h-64">
            {JSON.stringify(result, null, 2)}
          </pre>
        </motion.div>
      )}

      {/* Features Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {[
          { icon: Cpu, label: 'ML Models', value: '50+' },
          { icon: Zap, label: 'API Latency', value: '<100ms' },
          { icon: TrendingUp, label: 'Accuracy', value: '97%' },
          { icon: Brain, label: 'AI Features', value: '25+' },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="text-center p-4 rounded-xl bg-muted/50">
              <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-lg font-bold">{item.value}</div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}