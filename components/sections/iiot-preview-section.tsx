'use client'

import { motion } from 'framer-motion'
import { Factory, Activity, Shield, Zap, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function IIoTPreviewSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-gray-950 to-blue-950/30 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,255,136,0.3) 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }} />
      
      <div className="container relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-green-400">Industry 4.0 Solutions</span>
            </div>

            <h2 className="text-5xl font-bold mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-400">
                Industrial IoT
              </span>
              <br />
              <span className="text-white">& Automation</span>
            </h2>

            <p className="text-xl text-gray-400 mb-8 leading-relaxed">
              Transform your operations with intelligent, interconnected systems. 
              Real-time monitoring, predictive maintenance, and autonomous decision-making 
              powered by AI and edge computing.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { icon: Activity, label: '70% Less Downtime' },
                { icon: Shield, label: 'Enhanced Safety' },
                { icon: Zap, label: '40% Energy Savings' },
                { icon: Factory, label: 'Smart Manufacturing' },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <Icon className="w-5 h-5 text-green-400" />
                    <span className="text-sm text-gray-300">{item.label}</span>
                  </div>
                )
              })}
            </div>

            <Link href="/iiot-automation">
              <Button size="lg" className="group bg-gradient-to-r from-green-600 to-blue-600 text-white">
                Explore IIoT Solutions
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative w-full aspect-square rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/5 to-blue-500/5 flex items-center justify-center overflow-hidden">
              {/* Animated circuit lines */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent"
                  style={{ 
                    top: `${20 + i * 12}%`, 
                    left: 0, 
                    right: 0,
                    transform: `rotate(${i * 15}deg)`
                  }}
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 3 + i, repeat: Infinity, ease: 'linear', delay: i * 0.5 }}
                />
              ))}
              
              {/* Center icon */}
              <div className="relative z-10 text-center">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-green-500/25">
                  <Factory className="w-12 h-12 text-white" />
                </div>
                <p className="text-green-400 font-mono text-sm">IIoT Network Active</p>
                <p className="text-gray-500 text-xs mt-1">1,247 Sensors Connected</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}