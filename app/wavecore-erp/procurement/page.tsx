'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Truck, Package, FileText, Download, Loader2, Plus,
  Users, ClipboardList, FileSpreadsheet, CheckCircle,
  TrendingUp, DollarSign, BarChart3
} from 'lucide-react'

export default function ProcurementPage() {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/purchase-orders')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const modules = [
    { name: 'Suppliers', desc: 'Manage supplier database', href: '/wavecore-erp/procurement/suppliers', icon: Users, color: 'from-blue-500 to-indigo-600' },
    { name: 'Requisitions', desc: 'Purchase requests', href: '/wavecore-erp/procurement/requisitions', icon: ClipboardList, color: 'from-green-500 to-emerald-600' },
    { name: 'RFQs', desc: 'Request for quotations', href: '/wavecore-erp/procurement/rfqs', icon: FileText, color: 'from-purple-500 to-violet-600' },
    { name: 'Quotes', desc: 'Supplier quotations', href: '/wavecore-erp/procurement/quotes', icon: FileSpreadsheet, color: 'from-orange-500 to-amber-600' },
    { name: 'Purchase Orders', desc: 'PO management', href: '/wavecore-erp/procurement/orders', icon: Package, color: 'from-pink-500 to-rose-600' },
    { name: 'Goods Receipts', desc: 'Receive inventory', href: '/wavecore-erp/procurement/receipts', icon: CheckCircle, color: 'from-teal-500 to-cyan-600' },
    { name: 'Analytics', desc: 'Procurement insights', href: '/wavecore-erp/procurement/analytics', icon: BarChart3, color: 'from-red-500 to-rose-600' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Procurement</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 p-6 lg:p-8 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Truck className="w-8 h-8" /> Procurement
              </h1>
              <p className="text-white/80 text-sm">Suppliers • RFQs • Quotes • Purchase Orders • 3-Way Match</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-emerald-500" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <Users className="w-6 h-6 text-blue-500 mb-3" />
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Suppliers</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <Package className="w-6 h-6 text-green-500 mb-3" />
                <p className="text-2xl font-bold">{data.purchaseOrders?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Purchase Orders</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <ClipboardList className="w-6 h-6 text-purple-500 mb-3" />
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Requisitions</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <DollarSign className="w-6 h-6 text-emerald-500 mb-3" />
                <p className="text-2xl font-bold">KSh 0</p>
                <p className="text-xs text-muted-foreground">Total Spend</p>
              </div>
            </div>

            <h2 className="text-xl font-bold mb-4">Procurement Modules</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {modules.map(module => {
                const Icon = module.icon
                return (
                  <Link key={module.name} href={module.href}
                    className="p-6 rounded-2xl border bg-white dark:bg-neutral-900 hover:border-emerald-500 hover:shadow-xl transition-all group">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-bold text-sm">{module.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{module.desc}</p>
                  </Link>
                )
              })}
            </div>

            {/* 3-Way Match Info */}
            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
              <h3 className="font-bold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" /> 3-Way Matching
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Purchase Order + Goods Receipt + Supplier Invoice = 3-Way Match
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}