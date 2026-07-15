'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export function PremiumLogo() {
  return (
    <motion.div
      className="relative w-12 h-12"
      initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Glow ring */}
      <motion.div
        className="absolute -inset-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 opacity-50 blur-lg"
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3],
          rotate: [0, 360]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Outer ring */}
      <motion.div
        className="absolute -inset-1 rounded-full border border-blue-400/30"
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Logo */}
      <div className="relative w-full h-full rounded-xl overflow-hidden border border-white/20 shadow-2xl">
        <Image
          src="/logo.png"
          alt="IntelliWavve"
          fill
          className="object-cover"
          priority
        />
      </div>
      
      {/* Breathing effect */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-t from-blue-500/20 to-transparent"
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  )
}