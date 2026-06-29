'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  onClose: () => void
  duration?: number
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const colors = {
  success: 'from-green-500 to-emerald-500 border-green-500/30',
  error: 'from-red-500 to-rose-500 border-red-500/30',
  warning: 'from-orange-500 to-yellow-500 border-orange-500/30',
  info: 'from-blue-500 to-cyan-500 border-blue-500/30',
}

export function PremiumToast({ message, type = 'info', onClose, duration = 4000 }: ToastProps) {
  const [progress, setProgress] = useState(100)
  const Icon = icons[type]

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer)
          return 0
        }
        return prev - (100 / (duration / 100))
      })
    }, 100)

    const closeTimer = setTimeout(onClose, duration)
    return () => {
      clearInterval(timer)
      clearTimeout(closeTimer)
    }
  }, [duration, onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      className={`relative glass rounded-2xl border ${colors[type]} p-4 min-w-[320px] max-w-[420px] shadow-2xl`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-1.5 rounded-full bg-gradient-to-br ${colors[type].split(' ')[0]}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <p className="text-sm flex-1 pt-0.5">{message}</p>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${colors[type].split(' ')[0]}`}
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
    </motion.div>
  )
}