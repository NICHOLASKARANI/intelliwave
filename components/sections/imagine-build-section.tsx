'use client'

import { motion } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function ImagineBuildSection() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-accent to-primary p-12 md:p-16">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <motion.div
        className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.5, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      
      <div className="relative text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center mx-auto mb-8"
        >
          <Sparkles className="w-10 h-10 text-white" />
        </motion.div>
        
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Imagine It.{' '}
          <span className="text-yellow-300">We'll Build It.</span>
        </h2>
        <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
          From concept to deployment, our 500+ AI engineers turn your boldest ideas 
          into enterprise-grade reality. No project too complex, no vision too ambitious.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/contact">
            <button className="px-8 py-4 bg-white text-primary rounded-xl font-bold hover:bg-gray-100 transition-all flex items-center gap-2 group">
              Start Building
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
          <Link href="/portfolio">
            <button className="px-8 py-4 bg-white/20 backdrop-blur-xl text-white rounded-xl font-bold hover:bg-white/30 transition-all border border-white/30">
              View Our Work
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}