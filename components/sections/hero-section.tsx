'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, Zap, Globe } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 animate-pulse-slow" />
      
      {/* Floating orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -100, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/30 rounded-full blur-3xl"
        animate={{
          x: [0, -100, 0],
          y: [0, 100, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      <div className="container relative mx-auto px-4 py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glassmorphism text-sm"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Africa's #1 AI Software Company</span>
            </motion.div>

            {/* Main heading */}
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
              <span className="text-gradient">Engineering</span>
              <br />
              <span className="relative">
                the Future
                <motion.span
                  className="absolute -bottom-2 left-0 w-full h-2 bg-primary/50 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                />
              </span>
              <br />
              with{' '}
              <span className="relative inline-block">
                AI
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary to-accent blur-2xl opacity-50"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </span>
            </h1>

            {/* Description */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
              Building Africa's Global AI Giant. Enterprise SaaS, Cloud Infrastructure, 
              AI Agents, and Custom Software Solutions trusted by Fortune 500 companies 
              and 450,000+ businesses worldwide.
            </p>

            {/* Stats */}
            <div className="flex gap-8">
              <div>
                <div className="text-3xl font-bold text-gradient">450K+</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gradient">100+</div>
                <div className="text-sm text-muted-foreground">Countries</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gradient">500+</div>
                <div className="text-sm text-muted-foreground">AI Engineers</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/contact">
                <Button size="lg" className="group bg-primary hover:bg-primary-600 text-white">
                  Start Your Project
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/services">
                <Button size="lg" variant="outline" className="glassmorphism">
                  Explore Services
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-background bg-gradient-to-br from-primary to-accent"
                  />
                ))}
              </div>
              <div className="text-sm">
                <span className="font-bold">4.9/5</span> rating from{' '}
                <span className="text-primary">10,000+</span> reviews
              </div>
            </div>
          </motion.div>

          {/* Hero Image/Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative lg:block"
          >
            <div className="relative w-full aspect-square">
              {/* Glowing orb */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-accent to-primary glow"
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              
              {/* AI Circuit pattern */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="w-4/5 h-4/5 border-2 border-white/20 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute w-3/5 h-3/5 border-2 border-primary/30 rounded-full"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute w-2/5 h-2/5 border-2 border-accent/30 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
              </div>

              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="glassmorphism rounded-full p-8">
                  <Zap className="w-16 h-16 text-primary" />
                </div>
              </div>

              {/* Floating elements */}
              <motion.div
                className="absolute top-10 right-10 glassmorphism rounded-lg p-3"
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Globe className="w-6 h-6 text-primary" />
              </motion.div>
              
              <motion.div
                className="absolute bottom-10 left-10 glassmorphism rounded-lg p-3"
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 5, repeat: Infinity, delay: 1 }}
              >
                <Sparkles className="w-6 h-6 text-accent" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}