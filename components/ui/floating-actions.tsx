'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp, ArrowDown, Calendar, MessageCircle, X, Plus } from 'lucide-react'
import Link from 'next/link'

export function FloatingActions() {
  const [showScroll, setShowScroll] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = (scrollTop / docHeight) * 100
      setScrollProgress(progress)
      setShowScroll(scrollTop > 300)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
  const scrollToBottom = () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })

  const actions = [
    { icon: Calendar, label: 'Book Demo', href: '/contact', color: 'bg-indigo-600 hover:bg-indigo-700' },
    { icon: MessageCircle, label: 'Contact', href: '/contact', color: 'bg-green-600 hover:bg-green-700' },
  ]

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
      {/* Quick Actions Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="flex flex-col gap-2 mb-2"
          >
            {actions.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className={`flex items-center gap-3 px-4 py-3 ${action.color} text-white rounded-xl shadow-lg transition-all text-sm font-medium`}
                >
                  <Icon className="w-4 h-4" />
                  {action.label}
                </Link>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to Top */}
      <AnimatePresence>
        {showScroll && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={scrollToTop}
            className="w-10 h-10 rounded-full bg-white dark:bg-neutral-800 border dark:border-neutral-700 shadow-lg flex items-center justify-center hover:shadow-xl transition-all"
            aria-label="Scroll to top"
          >
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(99,102,241,0.2)" strokeWidth="2" />
              <circle cx="18" cy="18" r="16" fill="none" stroke="#6366F1" strokeWidth="2" strokeDasharray={`${scrollProgress} 100`} strokeLinecap="round" />
            </svg>
            <ArrowUp className="w-4 h-4 text-indigo-600 relative z-10" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Scroll to Bottom */}
      <motion.button
        onClick={scrollToBottom}
        className="w-10 h-10 rounded-full bg-white dark:bg-neutral-800 border dark:border-neutral-700 shadow-lg flex items-center justify-center hover:shadow-xl transition-all"
        aria-label="Scroll to bottom"
      >
        <ArrowDown className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
      </motion.button>

      {/* Main Toggle */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.95 }}
        className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all ${
          isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'
        } text-white`}
        aria-label="Quick actions"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
      </motion.button>
    </div>
  )
}