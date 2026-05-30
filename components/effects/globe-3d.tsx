'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface Point {
  x: number
  y: number
  z: number
  size: number
  color: string
  pulse: number
}

export function Globe3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointsRef = useRef<Point[]>([])
  const animationRef = useRef<number>(0)
  const rotationRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = 400
    const height = 400
    canvas.width = width
    canvas.height = height

    const centerX = width / 2
    const centerY = height / 2
    const radius = 140

    // Generate points on sphere
    const points: Point[] = []
    const numPoints = 200

    for (let i = 0; i < numPoints; i++) {
      const phi = Math.acos(2 * Math.random() - 1)
      const theta = 2 * Math.PI * Math.random()
      
      points.push({
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.sin(phi) * Math.sin(theta),
        z: radius * Math.cos(phi),
        size: Math.random() * 2 + 1,
        color: Math.random() > 0.3 ? '#0066FF' : '#7C3AED',
        pulse: Math.random() * Math.PI * 2,
      })
    }
    pointsRef.current = points

    // Add Africa highlight points
    const africaPoints = [
      { lat: -1.2921, lng: 36.8219 },  // Nairobi
      { lat: -26.2041, lng: 28.0473 }, // Johannesburg
      { lat: 6.5244, lng: 3.3792 },    // Lagos
      { lat: 30.0444, lng: 31.2357 },  // Cairo
      { lat: 9.1450, lng: 40.4897 },   // Addis Ababa
      { lat: 14.7167, lng: -17.4677 }, // Dakar
    ]

    africaPoints.forEach(({ lat, lng }) => {
      const phi = (90 - lat) * (Math.PI / 180)
      const theta = (lng + 180) * (Math.PI / 180)
      
      points.push({
        x: (radius + 5) * Math.sin(phi) * Math.cos(theta),
        y: (radius + 5) * Math.sin(phi) * Math.sin(theta),
        z: (radius + 5) * Math.cos(phi),
        size: 3,
        color: '#00FF88',
        pulse: 0,
      })
    })

    const animate = () => {
      if (!ctx) return
      ctx.clearRect(0, 0, width, height)

      rotationRef.current.y += 0.005
      const { x: rx, y: ry } = rotationRef.current

      // Sort points by z-index for depth
      const sorted = [...pointsRef.current].sort((a, b) => {
        const az = a.x * Math.sin(ry) + a.z * Math.cos(ry)
        const bz = b.x * Math.sin(ry) + b.z * Math.cos(ry)
        return bz - az
      })

      sorted.forEach((point) => {
        // Rotate around Y axis
        const x1 = point.x * Math.cos(ry) - point.z * Math.sin(ry)
        const z1 = point.x * Math.sin(ry) + point.z * Math.cos(ry)
        const y1 = point.y

        // Project to 2D
        const scale = 300 / (300 + z1)
        const x2 = x1 * scale + centerX
        const y2 = y1 * scale + centerY

        // Opacity based on depth
        const opacity = 0.3 + (z1 + radius) / (2 * radius) * 0.7

        ctx.beginPath()
        ctx.arc(x2, y2, point.size * scale, 0, Math.PI * 2)
        ctx.fillStyle = point.color
        ctx.globalAlpha = opacity
        ctx.fill()

        // Pulse effect for Africa points
        if (point.color === '#00FF88') {
          ctx.beginPath()
          ctx.arc(x2, y2, point.size * scale + Math.sin(Date.now() * 0.003 + point.pulse) * 3, 0, Math.PI * 2)
          ctx.strokeStyle = '#00FF88'
          ctx.globalAlpha = 0.5
          ctx.lineWidth = 1
          ctx.stroke()
        }

        ctx.globalAlpha = 1
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => cancelAnimationFrame(animationRef.current)
  }, [])

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <canvas ref={canvasRef} className="w-[400px] h-[400px]" />
      
      {/* Glow effects */}
      <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
    </div>
  )
}