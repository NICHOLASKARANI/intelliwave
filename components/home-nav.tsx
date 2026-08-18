'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Store, Bike, Building2, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function HomeNav() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const links = [
    { name: 'ERP', href: '/wavecore-erp', icon: Building2 },
    { name: 'Marketplace', href: '/marketplace', icon: Store },
    { name: 'Wavve Ride', href: '/ride', icon: Bike },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
      <div className="flex items-center justify-between px-4 h-16 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/images/Wavecore.jpeg" alt="IntelliWavve" width={40} height={40} className="rounded-xl object-cover" />
          <span className="font-bold text-lg">IntelliWavve</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map(link => {
            const Icon = link.icon
            return (
              <Link key={link.name} href={link.href}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-blue-600 transition-colors">
                <Icon className="w-4 h-4" />
                {link.name}
              </Link>
            )
          })}
          <Link href="/wavecore-erp/auth/login"
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
            Sign In
          </Link>
        </nav>

        {/* Mobile Toggle */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <nav className="md:hidden border-t px-4 py-3 space-y-2">
          {links.map(link => {
            const Icon = link.icon
            return (
              <Link key={link.name} href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <Icon className="w-5 h-5 text-blue-500" />
                <span className="font-medium">{link.name}</span>
              </Link>
            )
          })}
          <Link href="/wavecore-erp/auth/login"
            onClick={() => setMobileOpen(false)}
            className="block px-4 py-3 rounded-xl bg-blue-600 text-white text-center font-medium">
            Sign In
          </Link>
        </nav>
      )}
    </header>
  )
}