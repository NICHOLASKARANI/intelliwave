'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export function CodingAnimation() {
  const [visibleLines, setVisibleLines] = useState(0)
  const [blink, setBlink] = useState(true)

  const codeLines = [
    { text: 'function buildFuture() {', color: '#c678dd' },
    { text: '  const vision = "Global AI Giant";', color: '#98c379' },
    { text: '  const team = 500;', color: '#e5c07b' },
    { text: '  const users = 450000;', color: '#e5c07b' },
    { text: '  ', color: '' },
    { text: '  const result = await deploy({', color: '#61afef' },
    { text: '    scale: "enterprise",', color: '#98c379' },
    { text: '    security: "SOC2",', color: '#98c379' },
    { text: '    region: "global",', color: '#98c379' },
    { text: '  });', color: '#61afef' },
    { text: '  ', color: '' },
    { text: '  return {', color: '#61afef' },
    { text: '    status: "Production Ready",', color: '#98c379' },
    { text: '    uptime: "99.99%",', color: '#98c379' },
    { text: '  };', color: '#61afef' },
    { text: '}', color: '#c678dd' },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleLines((prev) => {
        if (prev < codeLines.length) return prev + 1
        return prev
      })
    }, 200)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink((prev) => !prev)
    }, 500)
    return () => clearInterval(blinkInterval)
  }, [])

  return (
    <div className="relative w-full h-[450px] rounded-2xl overflow-hidden border border-gray-800 bg-[#1e1e1e] shadow-2xl">
      {/* Title Bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-[#2d2d2d] border-b border-gray-700">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="text-xs text-gray-400 ml-2">build-future.ts</span>
      </div>

      {/* Code Content */}
      <div className="p-6 font-mono text-sm">
        {codeLines.map((line, index) => {
          if (index >= visibleLines) return null
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex"
            >
              <span className="text-gray-600 w-8 select-none">{index + 1}</span>
              <span style={{ color: line.color || '#abb2bf' }}>
                {line.text || '\u00A0'}
              </span>
            </motion.div>
          )
        })}
        {visibleLines < codeLines.length && (
          <span className={`inline-block w-2 h-4 bg-white ml-10 ${blink ? 'opacity-100' : 'opacity-0'}`}>
            |
          </span>
        )}
      </div>

      {/* Bottom Status */}
      <div className="absolute bottom-3 right-4 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-xs text-green-400">Live</span>
      </div>

      {/* Glow Effects */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
    </div>
  )
}