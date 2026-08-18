'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Store, Bike, Building2, Menu, X, ArrowRight } from 'lucide-react'

export default function MainHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { name: 'WaveCore ERP', href: '/wavecore-erp', icon: Building2, desc: 'Business Management' },
    { name: 'Marketplace', href: '/marketplace', icon: Store, desc: 'Buy & Sell' },
    { name: 'Wavve Ride', href: '/ride', icon: Bike, desc: 'Rides & Delivery' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
      <div className="flex items-center justify-between px-4 h-16 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/images/Wavecore.jpeg" alt="IntelliWavve" width={40} height={40} className="rounded-xl object-cover" />
          <span className="font-bold text-lg hidden sm:block">IntelliWavve</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          {navLinks.map(link => {
            const Icon = link.icon
            return (
              <Link key={link.name} href={link.href}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all">
                <Icon className="w-4 h-4" />
                {link.name}
              </Link>
            )
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/wavecore-erp/auth/login" className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-neutral-100">
            Sign In
          </Link>
          <Link href="/wavecore-erp/auth/signup" className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 flex items-center gap-1">
            Get Started <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <nav className="md:hidden border-t px-4 py-3 space-y-2 bg-white dark:bg-neutral-900">
          {navLinks.map(link => {
            const Icon = link.icon
            return (
              <Link key={link.name} href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{link.name}</p>
                  <p className="text-xs text-muted-foreground">{link.desc}</p>
                </div>
              </Link>
            )
          })}
          <div className="pt-3 space-y-2">
            <Link href="/wavecore-erp/auth/login"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 rounded-xl border text-center font-medium">
              Sign In
            </Link>
            <Link href="/wavecore-erp/auth/signup"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 rounded-xl bg-blue-600 text-white text-center font-medium">
              Create Account
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}