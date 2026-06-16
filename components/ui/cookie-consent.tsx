'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Shield, Cookie } from 'lucide-react'

export function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setShow(true)
    }
  }, [])

  const acceptAll = () => {
    localStorage.setItem('cookie-consent', 'all')
    setShow(false)
  }

  const acceptEssential = () => {
    localStorage.setItem('cookie-consent', 'essential')
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 z-50 max-w-2xl mx-auto"
        >
          <div className="p-6 rounded-2xl bg-background border shadow-2xl backdrop-blur-xl">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Cookie className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold mb-1">Cookie Preferences</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  We use cookies to enhance your experience, analyze site usage, and provide tailored content. 
                  See our <a href="/cookies" className="text-primary hover:underline">Cookie Policy</a>.
                </p>
                <div className="flex gap-2">
                  <button onClick={acceptAll} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                    Accept All
                  </button>
                  <button onClick={acceptEssential} className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                    Essential Only
                  </button>
                </div>
              </div>
              <button onClick={acceptEssential} className="p-1 hover:bg-muted rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}