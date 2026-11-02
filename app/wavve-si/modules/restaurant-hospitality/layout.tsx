'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UtensilsCrossed, LayoutDashboard, ShoppingCart, BookOpen, Users, ArrowLeft } from 'lucide-react'

const TABS = [
  { href: '/wavve-si/modules/restaurant-hospitality', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/wavve-si/modules/restaurant-hospitality/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/wavve-si/modules/restaurant-hospitality/menu', label: 'Menu', icon: BookOpen },
  { href: '/wavve-si/modules/restaurant-hospitality/customers', label: 'Customers', icon: Users },
]

export default function RestaurantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/wavve-si/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Wavve SI
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <UtensilsCrossed className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Restaurant & Hospitality</h1>
            <p className="text-sm text-slate-400">Point of sale, orders, menu, and customer management</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/10 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = tab.exact ? pathname === tab.href : pathname?.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                isActive ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </Link>
          )
        })}
      </div>

      {/* Page content */}
      {children}
    </div>
  )
}