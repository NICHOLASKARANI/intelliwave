'use client'

import { useEffect, useRef } from 'react'

interface Node {
  x: number
  y: number
  city: string
  country: string
  pulses: number
}

export function GlobalNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = 400

    // African tech hubs + global connections
    const nodes: Node[] = [
      { x: 380, y: 200, city: 'Nairobi', country: 'Kenya', pulses: 0 },
      { x: 350, y: 280, city: 'Johannesburg', country: 'SA', pulses: 0 },
      { x: 200, y: 180, city: 'Lagos', country: 'Nigeria', pulses: 0 },
      { x: 420, y: 120, city: 'Cairo', country: 'Egypt', pulses: 0 },
      { x: 100, y: 60, city: 'New York', country: 'USA', pulses: 0 },
      { x: 300, y: 50, city: 'London', country: 'UK', pulses: 0 },
      { x: 500, y: 100, city: 'Dubai', country: 'UAE', pulses: 0 },
      { x: 600, y: 150, city: 'Singapore', country: 'Singapore', pulses: 0 },
    ]

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw connections
      nodes.forEach((node, i) => {
        nodes.slice(i + 1).forEach(target => {
          const dx = target.x - node.x
          const dy = target.y - node.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist < 300) {
            ctx.beginPath()
            ctx.moveTo(node.x, node.y)
            ctx.lineTo(target.x, target.y)
            ctx.strokeStyle = `rgba(0, 150, 255, ${0.15 * (1 - dist / 300)})`
            ctx.lineWidth = 0.5
            ctx.stroke()

            // Data packets traveling
            const packetPos = (Date.now() % 3000) / 3000
            const px = node.x + dx * packetPos
            const py = node.y + dy * packetPos
            
            ctx.beginPath()
            ctx.arc(px, py, 2, 0, Math.PI * 2)
            ctx.fillStyle = '#00FF88'
            ctx.fill()
          }
        })
      })

      // Draw nodes
      nodes.forEach(node => {
        // Pulse
        const pulse = Math.sin(Date.now() * 0.003 + node.pulses) * 5
        ctx.beginPath()
        ctx.arc(node.x, node.y, 8 + pulse, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0, 150, 255, 0.3)'
        ctx.fill()

        // Core
        ctx.beginPath()
        ctx.arc(node.x, node.y, 4, 0, Math.PI * 2)
        ctx.fillStyle = '#0066FF'
        ctx.fill()

        // Glow
        ctx.beginPath()
        ctx.arc(node.x, node.y, 6, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0, 102, 255, 0.5)'
        ctx.fill()

        // Label
        if (node.country === 'Kenya') {
          ctx.font = 'bold 11px monospace'
          ctx.fillStyle = '#00FF88'
          ctx.fillText('★ ' + node.city, node.x + 10, node.y + 4)
        } else {
          ctx.font = '10px monospace'
          ctx.fillStyle = '#888'
          ctx.fillText(node.city, node.x + 10, node.y + 4)
        }
      })

      requestAnimationFrame(animate)
    }

    animate()
  }, [])

  return (
    <div className="relative w-full">
      <canvas ref={canvasRef} className="w-full h-[400px]" />
      <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs text-green-400">Live Network</span>
      </div>
    </div>
  )
}