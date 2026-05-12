'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Play, Loader2, Copy, Check, Zap } from 'lucide-react'

export function AIDemoSandbox() {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [demoCode, setDemoCode] = useState('')
  const [copied, setCopied] = useState(false)

  const generateDemo = async () => {
    setIsGenerating(true)
    setDemoCode('')
    // Simulate AI generation with typing effect
    const code = `// 🚀 Intelliwave AI Generated Solution
// Engineering the Future with AI

import { AIEngine } from '@intelliwave/core';

class ${prompt.split(' ').slice(0, 2).join('') || 'Enterprise'}System {
  constructor() {
    this.ai = new AIEngine({
      model: 'intelliwave-gpt-4',
      region: 'global',
      scale: 'enterprise'
    });
  }

  async deploy() {
    const result = await this.ai.process({
      type: 'production',
      security: 'SOC2-TypeII',
      compliance: ['GDPR', 'Kenya-DPA']
    });
    
    return {
      status: 'Production Ready ✅',
      uptime: '99.99%',
      latency: '<10ms',
      cost: '40% below industry avg'
    };
  }
}

export default new ${prompt.split(' ').slice(0, 2).join('') || 'Enterprise'}System();`

    let index = 0
    const interval = setInterval(() => {
      setDemoCode(code.slice(0, index))
      index++
      if (index > code.length) {
        clearInterval(interval)
        setIsGenerating(false)
      }
    }, 15)
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-background via-background to-primary/5 p-8">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full blur-3xl" />
      
      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">AI Demo Sandbox</h3>
            <p className="text-sm text-muted-foreground">See our AI generate code in real-time</p>
          </div>
        </div>

        {/* Input Area */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'Healthcare AI platform with patient triage'"
              className="flex-1 bg-muted/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={(e) => e.key === 'Enter' && generateDemo()}
            />
            <button
              onClick={generateDemo}
              disabled={isGenerating || !prompt}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isGenerating ? 'Engineering...' : 'Generate'}
            </button>
          </div>

          {/* Suggestions */}
          <div className="flex flex-wrap gap-2">
            {['E-commerce platform', 'FinTech app', 'AI chatbot', 'ERP system'].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setPrompt(`Build a ${suggestion.toLowerCase()}`)}
                className="px-3 py-1 text-xs bg-muted/50 hover:bg-primary/10 border rounded-full transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Output Area */}
        <AnimatePresence>
          {demoCode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.5 }}
              className="mt-6"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-green-500">AI Generated Code</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(demoCode)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="bg-black/90 text-green-400 p-6 rounded-xl text-xs md:text-sm overflow-auto max-h-96 border border-green-500/20">
                <code>{demoCode}</code>
                {isGenerating && <span className="animate-pulse">▋</span>}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}