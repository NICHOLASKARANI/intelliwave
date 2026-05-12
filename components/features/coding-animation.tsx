'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'

// Syntax highlighting function that returns React elements
function highlightSyntax(line: string, index: number): React.ReactNode {
  const elements: React.ReactNode[] = []
  let remaining = line
  
  // Define patterns in order of priority
  const patterns = [
    // Comments
    { regex: /(\/\/.*)/, className: 'text-gray-500 italic' },
    // Strings (single and double quotes)
    { regex: /('.*?'|".*?")/g, className: 'text-green-400' },
    // Keywords
    { regex: /\b(import|from|export|default|const|let|var|new|async|await|function|return|if|else|class|interface|type|extends|implements)\b/g, className: 'text-pink-400' },
    // Boolean/null/undefined
    { regex: /\b(true|false|null|undefined)\b/g, className: 'text-orange-400' },
    // Numbers
    { regex: /\b(\d+\.?\d*)\b/g, className: 'text-yellow-400' },
    // Capitalized words (Types/Classes)
    { regex: /\b([A-Z][a-zA-Z]*)\b/g, className: 'text-blue-400' },
  ]
  
  if (!line.trim()) {
    return <span key={index}>&nbsp;</span>
  }
  
  // Simple tokenization
  const tokens = line.split(/(\s+|\b|(?=[{}();,.:\[\]]))/g).filter(Boolean)
  
  return (
    <span key={index}>
      {tokens.map((token, i) => {
        let className = 'text-gray-300'
        
        for (const pattern of patterns) {
          if (pattern.regex.test(token)) {
            className = pattern.className
            // Reset lastIndex for global regex
            if (pattern.regex.global) {
              pattern.regex.lastIndex = 0
            }
            break
          }
        }
        
        // Check for strings specifically
        if ((token.startsWith("'") && token.endsWith("'")) || 
            (token.startsWith('"') && token.endsWith('"')) ||
            (token.startsWith('`') && token.endsWith('`'))) {
          className = 'text-green-400'
        }
        
        // Check for comments
        if (token.startsWith('//')) {
          className = 'text-gray-500 italic'
        }
        
        return (
          <span key={i} className={className}>
            {token}
          </span>
        )
      })}
    </span>
  )
}

export function CodingAnimation() {
  const [displayedLines, setDisplayedLines] = useState<number>(0)
  const [currentLineChars, setCurrentLineChars] = useState<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const fullCode = [
    "import { AIEngine } from '@intelliwave/core';",
    "import { CloudInfra } from '@intelliwave/cloud';",
    "",
    "// Initialize AI Engine",
    "const ai = new AIEngine({",
    "  model: 'enterprise-v4',",
    "  region: 'global',",
    "  scaling: 'automatic'",
    "});",
    "",
    "// Deploy enterprise solution",
    "async function deployEnterprise() {",
    "  const config = {",
    "    security: 'SOC2-TypeII',",
    "    compliance: ['GDPR', 'Kenya-DPA'],",
    "    uptime: '99.99%',",
    "    latency: '<10ms'",
    "  };",
    "",
    "  const result = await ai.deploy(config);",
    "  ",
    "  return {",
    "    status: 'Production Ready',",
    "    performance: 'Optimized',",
    "    cost: '40% below average'",
    "  };",
    "}",
    "",
    "export default deployEnterprise;"
  ]

  useEffect(() => {
    if (displayedLines >= fullCode.length) return

    const currentLine = fullCode[displayedLines]
    
    if (currentLineChars < currentLine.length) {
      const timer = setTimeout(() => {
        setCurrentLineChars(prev => prev + 1)
      }, 25)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => {
        setDisplayedLines(prev => prev + 1)
        setCurrentLineChars(0)
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [displayedLines, currentLineChars, fullCode])

  // Auto-scroll
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [displayedLines, currentLineChars])

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

      {/* Editor Body */}
      <div className="flex h-[calc(100%-65px)]">
        {/* Line Numbers */}
        <div className="w-10 bg-[#0d1117] border-r border-gray-800 pt-4 select-none flex-shrink-0">
          {fullCode.map((_, i) => (
            <div 
              key={i} 
              className="text-xs text-gray-600 font-mono text-right pr-2 leading-6"
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code Area */}
        <div 
          ref={containerRef}
          className="flex-1 pt-4 px-4 font-mono text-sm leading-6 overflow-y-auto"
        >
          <pre className="text-left m-0">
            <code>
              {fullCode.map((line, index) => {
                if (index < displayedLines) {
                  // Line is fully displayed
                  return (
                    <div key={index} className="flex">
                      {highlightSyntax(line, index)}
                    </div>
                  )
                } else if (index === displayedLines) {
                  // Current line being typed
                  const partialLine = line.substring(0, currentLineChars)
                  return (
                    <div key={index} className="flex items-center">
                      {highlightSyntax(partialLine, index)}
                      {currentLineChars < line.length && (
                        <span className="inline-block w-2 h-4 bg-white ml-0.5 animate-pulse" />
                      )}
                    </div>
                  )
                } else {
                  // Not yet displayed
                  return <div key={index} className="h-6">&nbsp;</div>
                }
              })}
            </code>
          </pre>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-1.5 bg-[#161b22] border-t border-gray-700 text-xs">
        <div className="flex items-center gap-4">
          <span className="text-gray-500">TypeScript</span>
          <span className="text-gray-600">
            Ln {displayedLines + 1}, Col {currentLineChars + 1}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-400 font-medium">Live</span>
        </div>
      </div>

      {/* Glow Effects */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  )
}