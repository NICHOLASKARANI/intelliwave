'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export function AnimatedLogo() {
  return (
    <motion.div
      className="relative w-16 h-16"
      initial={{ opacity: 0, rotate: -180, scale: 0 }}
      animate={{ opacity: 1, rotate: 0, scale: 1 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
    >
      {/* Glow Ring */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 blur-xl"
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Rotating Border */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 border-r-purple-500"
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Logo Image */}
      <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white/20">
        <Image src="/logo.png" alt="IntelliWave" fill className="object-cover" priority />
      </div>
      
      {/* Pulse Dot */}
      <motion.div
        className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
        animate={{ scale: [1, 1.5, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </motion.div>
  )
}