'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'

export function CodingAnimation() {
  const [displayedCode, setDisplayedCode] = useState<string[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  const fullCode = `import { AIEngine } from '@intelliwave/core';
import { CloudInfra } from '@intelliwave/cloud';

// Initialize AI Engine
const ai = new AIEngine({
  model: 'enterprise-v4',
  region: 'global',
  scaling: 'automatic'
});

// Deploy enterprise solution
async function deployEnterprise() {
  const config = {
    security: 'SOC2-TypeII',
    compliance: ['GDPR', 'Kenya-DPA'],
    uptime: '99.99%',
    latency: '<10ms'
  };

  const result = await ai.deploy(config);
  
  return {
    status: 'Production Ready',
    performance: 'Optimized',
    cost: '40% below average'
  };
}

export default deployEnterprise;`

  useEffect(() => {
    const lines = fullCode.split('\n')
    let currentLine = 0
    let currentChar = 0
    const displayLines: string[] = new Array(lines.length).fill('')
    
    const interval = setInterval(() => {
      if (currentLine < lines.length) {
        if (currentChar < lines[currentLine].length) {
          displayLines[currentLine] = lines[currentLine].substring(0, currentChar + 1)
          currentChar++
        } else {
          displayLines[currentLine] = lines[currentLine]
          currentLine++
          currentChar = 0
        }
        setDisplayedCode([...displayLines])
      } else {
        clearInterval(interval)
      }
    }, 30)

    return () => clearInterval(interval)
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [displayedCode])

  return (
    <div className="relative w-full h-[450px] rounded-2xl overflow-hidden border border-gray-700 bg-[#0d1117] shadow-2xl">
      {/* Window Title Bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#161b22] border-b border-gray-700">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
        </div>
        <div className="flex-1 text-center">
          <span className="text-xs text-gray-400 font-mono">intelliwave-engine.ts</span>
        </div>
        <div className="flex gap-2">
          <span className="text-xs text-gray-500">UTF-8</span>
          <span className="text-xs text-gray-500">TypeScript</span>
        </div>
      </div>

      {/* Line Numbers Bar */}
      <div className="absolute left-0 top-10 bottom-0 w-10 bg-[#0d1117] border-r border-gray-800 flex flex-col items-end pr-2 pt-4 text-xs text-gray-600 font-mono select-none">
        {displayedCode.map((_, i) => (
          <div key={i} className="leading-6">{i + 1}</div>
        ))}
      </div>

      {/* Code Content */}
      <div 
        ref={containerRef}
        className="pt-4 pb-4 pl-12 pr-4 font-mono text-sm leading-6 overflow-y-auto h-[calc(100%-40px)]"
      >
        <pre className="text-left">
          <code>
            {displayedCode.map((line, index) => {
              // Simple syntax highlighting
              let highlightedLine = line
                .replace(/(import|from|const|new|async|function|return|export|default)/g, 
                  '<span class="text-pink-400">$1</span>')
                .replace(/('.*?')/g, 
                  '<span class="text-green-400">$1</span>')
                .replace(/(\/\/.*)/g, 
                  '<span class="text-gray-500">$1</span>')
                .replace(/(\{|\}|\(|\)|;)/g, 
                  '<span class="text-gray-400">$1</span>')
                .replace(/(\b[A-Z][a-zA-Z]*\b)/g, 
                  '<span class="text-blue-400">$1</span>')
              
              return (
                <div key={index} className="flex">
                  <span 
                    dangerouslySetInnerHTML={{ __html: highlightedLine || '&nbsp;' }}
                  />
                  {index === displayedCode.length - 1 && displayedCode[displayedCode.length - 1]?.length > 0 && (
                    <span className="inline-block w-2 h-5 bg-white ml-0.5 animate-pulse" />
                  )}
                </div>
              )
            })}
          </code>
        </pre>
      </div>

      {/* Bottom Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-1.5 bg-[#161b22] border-t border-gray-700 text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>TypeScript</span>
          <span>Ln {displayedCode.length}, Col 1</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-400">Live</span>
        </div>
      </div>

      {/* Glow Effects */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  )
}