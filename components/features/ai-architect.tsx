'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Database, Cloud, Code2, Layers, ArrowRight, Loader2 } from 'lucide-react'

export function AIArchitect() {
  const [idea, setIdea] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const generateArchitecture = async () => {
    if (!idea.trim()) return
    setLoading(true)
    setResult(null)

    setTimeout(() => {
      setResult({
        architecture: {
          frontend: 'Next.js 15 + React 18 + Tailwind CSS',
          backend: 'Node.js + Express + GraphQL',
          database: 'PostgreSQL + Redis Cache',
          cloud: 'AWS (ECS + RDS + S3 + CloudFront)',
          ai: 'TensorFlow + OpenAI API',
        },
        diagram: `
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Frontend   │───▶│   API Layer  │───▶│   Database   │
│  Next.js 15  │    │   GraphQL    │    │  PostgreSQL  │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                    │
        ▼                   ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   CDN/Vercel │    │  Redis Cache │    │   AWS S3    │
└──────────────┘    └──────────────┘    └──────────────┘
        `,
        cost: {
          monthly: 'KSh 45,000 - 150,000',
          setup: 'KSh 300,000 - 800,000',
          team: '3-5 developers',
          timeline: '8-12 weeks',
        },
        stack: ['Next.js', 'TypeScript', 'PostgreSQL', 'Redis', 'AWS', 'Docker', 'GitHub Actions'],
      })
      setLoading(false)
    }, 2000)
  }

  return (
    <div className="p-8 rounded-2xl border bg-gradient-to-br from-gray-950 to-blue-950/20 text-white">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-6 h-6 text-blue-400" />
        <h3 className="text-2xl font-bold">AI Software Architect</h3>
      </div>

      <p className="text-gray-400 mb-6">
        Describe your project idea and our AI will generate a complete architecture, 
        tech stack, and cost estimation.
      </p>

      <div className="flex gap-3 mb-6">
        <input
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="e.g., Build a logistics platform for East Africa..."
          className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          onKeyDown={(e) => e.key === 'Enter' && generateArchitecture()}
        />
        <button
          onClick={generateArchitecture}
          disabled={loading || !idea.trim()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Layers className="w-5 h-5" />}
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Architecture */}
          <div className="p-4 rounded-xl bg-black/40 border border-gray-700">
            <h4 className="font-bold text-blue-400 mb-3">Recommended Architecture</h4>
            <pre className="text-xs text-green-400 font-mono whitespace-pre">{result.diagram}</pre>
          </div>

          {/* Tech Stack */}
          <div className="p-4 rounded-xl bg-black/40 border border-gray-700">
            <h4 className="font-bold text-blue-400 mb-3">Technology Stack</h4>
            <div className="flex flex-wrap gap-2">
              {result.stack.map((tech: string) => (
                <span key={tech} className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Cost */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(result.cost).map(([key, value]) => (
              <div key={key} className="p-4 rounded-xl bg-black/40 border border-gray-700 text-center">
                <div className="text-xs text-gray-500 uppercase mb-1">{key}</div>
                <div className="font-bold text-blue-400">{value as string}</div>
              </div>
            ))}
          </div>

          <button className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
            Book Consultation <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </div>
  )
}