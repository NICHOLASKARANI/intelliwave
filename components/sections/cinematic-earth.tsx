'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Satellite, Globe, Shield } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function CinematicEarth() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    let animationId: number
    const particles: any[] = []
    const satellites: any[] = []

    // Create particles
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.2,
      })
    }

    // Create satellites
    for (let i = 0; i < 3; i++) {
      satellites.push({
        angle: (i * 120) * Math.PI / 180,
        distance: 150 + i * 30,
        speed: 0.003 + i * 0.001,
        size: 3 + i,
      })
    }

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw Earth
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 120)
      gradient.addColorStop(0, '#1a237e')
      gradient.addColorStop(0.5, '#0d47a1')
      gradient.addColorStop(1, '#01579b')
      ctx.beginPath()
      ctx.arc(centerX, centerY, 100, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()

      // Draw atmosphere
      ctx.beginPath()
      ctx.arc(centerX, centerY, 105, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)'
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw satellites
      satellites.forEach(sat => {
        sat.angle += sat.speed
        const x = centerX + Math.cos(sat.angle) * sat.distance
        const y = centerY + Math.sin(sat.angle) * sat.distance

        // Draw orbit
        ctx.beginPath()
        ctx.arc(centerX, centerY, sat.distance, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.1)'
        ctx.setLineDash([5, 15])
        ctx.stroke()
        ctx.setLineDash([])

        // Draw satellite
        ctx.beginPath()
        ctx.arc(x, y, sat.size, 0, Math.PI * 2)
        ctx.fillStyle = '#64b5f6'
        ctx.fill()

        // Signal lines
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(centerX, centerY)
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.2)'
        ctx.lineWidth = 1
        ctx.stroke()
      })

      // Draw particles
      particles.forEach(p => {
        p.x += p.speedX
        p.y += p.speedY
        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`
        ctx.fill()
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
              <Satellite className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400">Global Infrastructure Network</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Building the Intelligent{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400">
                Operating System
              </span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
              className="text-xl text-gray-400 mb-8 leading-relaxed">
              For Governments, Enterprises, Universities, Healthcare, and the Industries of Tomorrow.
            </motion.p>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
              className="flex gap-4">
              <Link href="/contact">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-2xl shadow-xl shadow-blue-500/25">
                  Explore Platform <ArrowRight className="ml-2" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg rounded-2xl border-white/20 text-white hover:bg-white/10">
                  View Demo
                </Button>
              </Link>
            </motion.div>
          </div>

          <div className="hidden lg:block">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
              className="w-80 h-80 mx-auto rounded-full border border-blue-500/20 flex items-center justify-center">
              <Globe className="w-40 h-40 text-blue-400/50" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}