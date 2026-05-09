'use client'

import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'

export function FloatingWhatsApp() {
  const phoneNumber = '254714694493'
  const message = encodeURIComponent('Hello Intelliwave! I need help with...')
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-50 flex items-center gap-3 group"
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.05 }}
    >
      {/* Label */}
      <motion.div
        className="bg-white dark:bg-black text-foreground px-4 py-2 rounded-full shadow-xl text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
        initial={{ x: 20, opacity: 0 }}
        whileHover={{ x: 0, opacity: 1 }}
      >
        Chat with us!
      </motion.div>

      {/* Button */}
      <motion.div
        className="relative"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Pulse rings */}
        <motion.div
          className="absolute inset-0 rounded-full bg-green-500"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute inset-0 rounded-full bg-green-500"
          animate={{
            scale: [1, 2, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 0.5,
            ease: 'easeInOut',
          }}
        />

        {/* Main button */}
        <div className="relative w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-2xl cursor-pointer transition-colors">
          <MessageCircle className="w-7 h-7 text-white" />
        </div>
      </motion.div>

      {/* Notification dot */}
      <motion.div
        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
        }}
      />
    </motion.a>
  )
}