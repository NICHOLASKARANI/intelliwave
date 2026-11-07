'use client'
import { useEffect, useState, useRef } from 'react'
import { useInView } from 'framer-motion'

interface AnimatedCounterProps {
  target?: number
  end?: number
  suffix?: string
  prefix?: string
  decimals?: number
  duration?: number
  className?: string
}

export function AnimatedCounter({
  target,
  end,
  suffix = '',
  prefix = '',
  decimals = 0,
  duration = 2000,
  className,
}: AnimatedCounterProps) {
  const finalValue = target ?? end ?? 0
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  useEffect(() => {
    if (!isInView) return
    let rafId: number
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(finalValue * eased)

      if (progress < 1) {
        rafId = requestAnimationFrame(animate)
      } else {
        setCount(finalValue)
      }
    }

    rafId = requestAnimationFrame(animate)
    return () => { if (rafId) cancelAnimationFrame(rafId) }
  }, [isInView, finalValue, duration])

  const formatted = decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toString()

  return (
    <span ref={ref} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  )
}