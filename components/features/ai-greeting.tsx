'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Sparkles, ArrowRight, X } from 'lucide-react'
import Link from 'next/link'

export function AIGreeting() {
  const [isVisible, setIsVisible] = useState(false)
  const [hasBeenShown, setHasBeenShown] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasBeenShown) {
        setIsVisible(true)
        setHasBeenShown(true)
      }
    }, 3000)
    return () => clearTimeout(timer)
  }, [hasBeenShown])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-8 right-8 z-50 max-w-md"
        >
          <div className="relative p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-blue-500/30 shadow-2xl shadow-blue-500/20">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-20" />
            
            <div className="relative">
              <div className="flex items-start gap-4 mb-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0"
                >
                  <Bot className="w-7 h-7 text-white" />
                </motion.div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">AI Assistant</h3>
                  <p className="text-sm text-gray-300">
                    Welcome to IntelliWavve. How can we transform your business today?
                  </p>
                </div>
                <button
                  onClick={() => setIsVisible(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link href="/contact" className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors">
                  Book Demo <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/contact" className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors border border-white/20">
                  <Sparkles className="w-4 h-4" /> Talk to AI
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}