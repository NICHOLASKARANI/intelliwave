'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Zap, Globe, Shield, Code2, Cloud, Cpu } from 'lucide-react'

export function CodingAnimation() {
  return (
    <div className="relative w-full h-[500px] flex items-center justify-center">
      {/* Main Orb Container */}
      <motion.div
        className="relative w-[400px] h-[400px]"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {/* Outer Ring 1 */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/30" />
        
        {/* Outer Ring 2 - Rotates opposite direction */}
        <motion.div
          className="absolute inset-4 rounded-full border-2 border-accent/20"
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Outer Ring 3 */}
        <motion.div
          className="absolute inset-8 rounded-full border border-primary/10"
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />

        {/* Dotted Ring */}
        <div 
          className="absolute inset-12 rounded-full border border-dashed border-primary/20"
        />

        {/* Glowing Center Orb */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center relative"
            animate={{
              scale: [1, 1.1, 1],
              boxShadow: [
                '0 0 40px rgba(0,102,255,0.5)',
                '0 0 80px rgba(124,58,237,0.5)',
                '0 0 40px rgba(0,102,255,0.5)',
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {/* Logo inside the orb */}
            <div className="relative w-20 h-20">
              <Image
                src="/logo.png"
                alt="Intelliwave"
                fill
                className="object-contain"
                priority
              />
            </div>
            
            {/* Orb glow rings */}
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/30 blur-xl"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </motion.div>
        </div>

        {/* Orbiting Elements */}
        {[
          { icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/20', position: { top: '5%', left: '45%' } },
          { icon: Globe, color: 'text-blue-400', bg: 'bg-blue-500/20', position: { top: '20%', right: '5%' } },
          { icon: Shield, color: 'text-green-400', bg: 'bg-green-500/20', position: { bottom: '20%', right: '8%' } },
          { icon: Code2, color: 'text-purple-400', bg: 'bg-purple-500/20', position: { bottom: '8%', left: '45%' } },
          { icon: Cloud, color: 'text-cyan-400', bg: 'bg-cyan-500/20', position: { top: '25%', left: '5%' } },
          { icon: Cpu, color: 'text-red-400', bg: 'bg-red-500/20', position: { bottom: '30%', left: '8%' } },
        ].map((item, index) => {
          const Icon = item.icon
          return (
            <motion.div
              key={index}
              className={`absolute w-12 h-12 rounded-xl ${item.bg} backdrop-blur-xl border border-white/20 flex items-center justify-center`}
              style={item.position}
              animate={{
                y: [0, -15, 0],
                x: [0, index % 2 === 0 ? 10 : -10, 0],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 4 + index,
                repeat: Infinity,
                delay: index * 0.5,
                ease: "easeInOut"
              }}
            >
              <Icon className={`w-6 h-6 ${item.color}`} />
            </motion.div>
          )
        })}

        {/* Small floating dots */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`dot-${i}`}
            className="absolute w-1.5 h-1.5 rounded-full bg-primary/60"
            style={{
              top: `${50 + 40 * Math.sin(i * 30 * Math.PI / 180)}%`,
              left: `${50 + 40 * Math.cos(i * 30 * Math.PI / 180)}%`,
            }}
            animate={{
              scale: [0.5, 1.5, 0.5],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>

      {/* Background Glows */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 0.9, 1.2],
          x: [0, -50, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

      {/* Status Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 backdrop-blur-xl"
      >
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-sm text-green-400 font-medium">100+ Countries</span>
      </motion.div>

      {/* Top Badge */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="absolute top-8 flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-xl"
      >
        <Globe className="w-4 h-4 text-primary" />
        <span className="text-sm text-primary font-medium">Global AI Infrastructure</span>
      </motion.div>
    </div>
  )
}