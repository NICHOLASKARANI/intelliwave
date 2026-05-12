'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export function CodingAnimation() {
  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border bg-gradient-to-br from-gray-900 to-black">
      {/* Animated code lines */}
      <div className="absolute inset-0 p-6 font-mono text-sm">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.2, duration: 0.5 }}
            className="flex gap-2 mb-2"
          >
            <span className="text-gray-600 w-8 text-right">{i + 1}</span>
            <span className="text-blue-400">const</span>
            <span className="text-white">buildFuture</span>
            <span className="text-gray-400">=</span>
            <span className="text-purple-400">async</span>
            <span className="text-gray-400">()</span>
            <span className="text-yellow-400">=&gt;</span>
            <span className="text-gray-400">{'{'}</span>
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-primary"
            >
              ▋
            </motion.span>
          </motion.div>
        ))}
      </div>

      {/* Floating elements */}
      <motion.div
        className="absolute top-10 right-10 w-20 h-20 rounded-full bg-primary/20 blur-xl"
        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-10 left-10 w-32 h-32 rounded-full bg-accent/20 blur-xl"
        animate={{ scale: [1.5, 1, 1.5], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      {/* Center image placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="w-48 h-48 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 backdrop-blur-xl border border-white/20 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <div className="text-center">
            <p className="text-4xl font-bold text-white">&lt;/&gt;</p>
            <p className="text-xs text-white/70 mt-2">Building Future</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}