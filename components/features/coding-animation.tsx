'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const codeLines = [
  { indent: 0, text: 'import { AIEngine } from "@intelliwave/core";', color: 'text-purple-400' },
  { indent: 0, text: '', color: '' },
  { indent: 0, text: 'const intelliwave = new AIEngine({', color: 'text-blue-400' },
  { indent: 2, text: 'model: "enterprise-gpt-4",', color: 'text-green-400' },
  { indent: 2, text: 'region: "global",', color: 'text-green-400' },
  { indent: 2, text: 'scale: "auto-scaling",', color: 'text-green-400' },
  { indent: 0, text: '});', color: 'text-blue-400' },
  { indent: 0, text: '', color: '' },
  { indent: 0, text: 'async function buildFuture() {', color: 'text-yellow-400' },
  { indent: 2, text: 'const result = await intelliwave.deploy({', color: 'text-blue-400' },
  { indent: 4, text: 'security: "SOC2-TypeII",', color: 'text-green-400' },
  { indent: 4, text: 'uptime: "99.99%",', color: 'text-green-400' },
  { indent: 4, text: 'latency: "<10ms",', color: 'text-green-400' },
  { indent: 2, text: '});', color: 'text-blue-400' },
  { indent: 0, text: '', color: '' },
  { indent: 2, text: 'return {', color: 'text-blue-400' },
  { indent: 4, text: 'status: "Production Ready ✅",', color: 'text-green-400' },
  { indent: 4, text: 'performance: "Optimized",', color: 'text-green-400' },
  { indent: 4, text: 'cost: "40% below industry avg",', color: 'text-green-400' },
  { indent: 2, text: '};', color: 'text-blue-400' },
  { indent: 0, text: '}', color: 'text-yellow-400' },
  { indent: 0, text: '', color: '' },
  { indent: 0, text: 'export default buildFuture;', color: 'text-purple-400' },
]

export function CodingAnimation() {
  const [visibleLines, setVisibleLines] = useState(0)
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    if (visibleLines < codeLines.length) {
      const timer = setTimeout(() => {
        setVisibleLines(prev => prev + 1)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [visibleLines])

  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full h-[450px] rounded-2xl overflow-hidden border bg-gradient-to-br from-gray-900 via-gray-950 to-black shadow-2xl">
      {/* Window Title Bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-800/50 border-b border-gray-700">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <div className="flex-1 text-center">
          <span className="text-xs text-gray-400 font-mono">intelliwave-engine.ts</span>
        </div>
      </div>

      {/* Code Content */}
      <div className="p-6 font-mono text-sm leading-relaxed overflow-hidden">
        <div className="relative">
          {codeLines.map((line, index) => {
            if (index >= visibleLines) return null
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="flex"
              >
                {/* Line Number */}
                <span className="text-gray-600 w-8 text-right mr-4 select-none flex-shrink-0">
                  {index + 1}
                </span>
                
                {/* Code Content */}
                <span className={`${line.color} whitespace-pre`}>
                  {'  '.repeat(line.indent)}
                  {line.text}
                  {index === visibleLines - 1 && showCursor && (
                    <span className="inline-block w-2 h-5 bg-primary ml-0.5 animate-pulse" />
                  )}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Glowing Orbs */}
      <motion.div
        className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-2xl"
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent/20 rounded-full blur-2xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.2, 0.4] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Status Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
        className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 backdrop-blur-sm"
      >
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs text-green-400 font-medium">Live Preview</span>
      </motion.div>
    </div>
  )
}