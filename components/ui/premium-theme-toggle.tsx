'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'

export function PremiumThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`relative w-16 h-8 rounded-full transition-colors duration-500 ${
        isDark ? 'bg-indigo-900' : 'bg-sky-300'
      }`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Stars (visible in dark mode) */}
      {isDark && (
        <>
          <motion.span className="absolute top-1 left-2 w-1 h-1 bg-white rounded-full" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity }} />
          <motion.span className="absolute top-3 left-4 w-0.5 h-0.5 bg-white rounded-full" animate={{ opacity: [1, 0, 1] }} transition={{ duration: 3, repeat: Infinity }} />
          <motion.span className="absolute top-1 right-3 w-0.5 h-0.5 bg-white rounded-full" animate={{ opacity: [0, 1] }} transition={{ duration: 2.5, repeat: Infinity }} />
        </>
      )}

      {/* Clouds (visible in light mode) */}
      {!isDark && (
        <>
          <motion.span className="absolute top-2 right-2 w-4 h-1.5 bg-white rounded-full" animate={{ x: [0, 3, 0] }} transition={{ duration: 4, repeat: Infinity }} />
        </>
      )}

      {/* Toggle Circle */}
      <motion.div
        className={`absolute top-1 w-6 h-6 rounded-full shadow-lg flex items-center justify-center ${
          isDark ? 'left-1 bg-indigo-400' : 'left-9 bg-yellow-400'
        }`}
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {isDark ? (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Z"/>
          </svg>
        ) : (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12,9a3,3,0,1,0,3,3A3,3,0,0,0,12,9Zm0,4a1,1,0,1,1,1-1A1,1,0,0,1,12,13Z"/>
            <path d="M12,2a1,1,0,0,0-1,1V4a1,1,0,0,0,2,0V3A1,1,0,0,0,12,2Z"/>
            <path d="M12,20a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V21A1,1,0,0,0,12,20Z"/>
            <path d="M21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Z"/>
            <path d="M4,11H3a1,1,0,0,0,0,2H4a1,1,0,0,0,0-2Z"/>
            <path d="M18.36,5.64a1,1,0,0,0,0,1.42l.71.7a1,1,0,1,0,1.42-1.42l-.71-.7A1,1,0,0,0,18.36,5.64Z"/>
            <path d="M4.22,18.36a1,1,0,0,0,1.42,0l.7-.71a1,1,0,0,0-1.42-1.42l-.7.71A1,1,0,0,0,4.22,18.36Z"/>
          </svg>
        )}
      </motion.div>
    </button>
  )
}