'use client'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'

export function ShopDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-sm font-medium hover:text-blue-400 transition-colors px-3 py-2"
      >
        Shop
        <svg className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-black border border-white/20 rounded-2xl shadow-2xl overflow-hidden z-50">
          <a href="/shopwavvemarket"   className="block px-6 py-4 hover:bg-white/10 transition-colors border-b border-white/10">
            <span className="block text-white font-bold">Shop WavveMarket</span>
          </a>
          <a href="/shopwavecore-erp"   className="block px-6 py-4 hover:bg-white/10 transition-colors">
            <span className="block text-white font-bold">Shop WaveCore ERP</span>
          </a>
        </div>
      )}
    </div>
  )
}