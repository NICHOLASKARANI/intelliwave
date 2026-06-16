'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ArrowRight, FileText, Code2, Briefcase, BookOpen } from 'lucide-react'
import Link from 'next/link'

const searchItems = [
  { icon: Code2, label: 'AI Development Services', href: '/services', category: 'Services' },
  { icon: Briefcase, label: 'Enterprise Solutions', href: '/services', category: 'Services' },
  { icon: FileText, label: 'Pricing & Packages', href: '/pricing', category: 'Info' },
  { icon: BookOpen, label: 'Blog & Insights', href: '/blog', category: 'Content' },
  { icon: Code2, label: 'IIoT Automation', href: '/iiot-automation', category: 'Services' },
  { icon: Briefcase, label: 'Portfolio', href: '/portfolio', category: 'Info' },
  { icon: FileText, label: 'Contact Us', href: '/contact', category: 'Support' },
  { icon: BookOpen, label: 'About IntelliWave', href: '/about', category: 'Info' },
]

export function SearchPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(searchItems)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setResults(searchItems)
      return
    }
    const filtered = searchItems.filter(item =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
    )
    setResults(filtered)
  }, [query])

  return (
    <>
      {/* Search Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border bg-muted/50 text-sm text-muted-foreground hover:bg-muted transition-colors"
      >
        <Search className="w-4 h-4" />
        <span>Search...</span>
        <kbd className="ml-4 px-2 py-0.5 rounded bg-background text-xs border">⌘K</kbd>
      </button>

      {/* Search Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-background border shadow-2xl overflow-hidden"
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 p-4 border-b">
                <Search className="w-5 h-5 text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search pages, services, articles..."
                  className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
                />
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-muted rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto p-2">
                {results.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No results found for "{query}"
                  </div>
                ) : (
                  results.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href + item.label}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors group"
                      >
                        <Icon className="w-5 h-5 text-primary flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.category}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    )
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t text-xs text-muted-foreground text-center">
                Press <kbd className="px-1.5 py-0.5 rounded bg-muted">ESC</kbd> to close • 
                <kbd className="px-1.5 py-0.5 rounded bg-muted ml-1">↑↓</kbd> to navigate
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}