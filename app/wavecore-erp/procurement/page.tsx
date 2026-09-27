'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Package, Users, ClipboardList, Inbox, Package2, Receipt, FileSignature,
  Wallet, Plus, Loader2, AlertTriangle, CheckCircle2, TrendingUp,
  BarChart3, Calendar, Clock, AlertCircle, ArrowRight, Activity,
  Building2, Sparkles, ChevronRight, Layers, Award, DollarSign,
} from 'lucide-react'

interface KPIs {
  openPOs: number
  awaiting: number
  grnsThisMonth: number
  invoicesMatched: number
  paymentRunsPending: number
  totalSpend12mo: number
}

interface SpendBucket {
  key: string
  label: string
  totalSpend: number
  invoiceCount: number
  avgInvoice: number
  sharePct: number
}

interface Analytics {
  dimension: string
  totalSpend: number
  rowCount: number
  buckets: SpendBucket[]
}

const MODULES: { href: string; label: string; icon: any; color: string; desc: string }[] = [
  { href: '/wavecore-erp/procurement/suppliers',         label: 'Suppliers',        icon: Users,          color: 'from-blue-600 to-indigo-700',      desc: 'Directory, 360, scorecards' },
  { href: '/wavecore-erp/procurement/requisitions',      label: 'Requisitions',     icon: ClipboardList,  color: 'from-purple-600 to-fuchsia-700',   desc: 'Raise & approve demand' },
  { href: '/wavecore-erp/procurement/approvals/inbox',   label: 'Approvals',        icon: Inbox,          color: 'from-amber-600 to-orange-700',     desc: 'Pending queue & history' },
  { href: '/wavecore-erp/procurement/orders',            label: 'Purchase Orders',  icon: Package,        color: 'from-pink-600 to-rose-700',        desc: 'Create, send, lifecycle' },
  { href: '/wavecore-erp/procurement/goods-receipts',    label: 'Goods Receipts',   icon: Package2,       color: 'from-emerald-600 to-teal-700',     desc: 'Receive & inspect' },
  { href: '/wavecore-erp/procurement/supplier-invoices', label: 'Supplier Invoices',icon: Receipt,        color: 'from-indigo-600 to-violet-700',    desc: '3-way match & payment' },
  { href: '/wavecore-erp/procurement/contracts',         label: 'Contracts',        icon: FileSignature,  color: 'from-sky-600 to-blue-700',         desc: 'MSAs, NDAs, service terms' },
  { href: '/wavecore-erp/procurement/rfqs',              label: 'RFQs',             icon: TrendingUp,     color: 'from-fuchsia-600 to-pink-700',     desc: 'Quotes & bid analysis' },
  { href: '/wavecore-erp/procurement/payment-runs',      label: 'Payment Runs',     icon: Wallet,         color: 'from-green-600 to-emerald-700',    desc: 'Batch pay approved invoices' },
]

export default function ProcurementDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [kpis, setKpis] = useState<KPIs>({
    openPOs: 0, awaiting: 0, grnsThisMonth: 0, invoicesMatched: 0,
    paymentRunsPending: 0, totalSpend12mo: 0,
  })

  const [bySupplier, setBySupplier] = useState<Analytics | null>(null)
  const [byMonth, setByMonth] = useState<Analytics | null>(null)
  const [byStatus, setByStatus] = useState<Analytics | null>(null)

  const [expiring, setExpiring] = useState<any[]>([])
  const [closingRFQs, setClosingRFQs] = useState<any[]>([])
  const [pendingRuns, setPendingRuns] = useState<any[]>([])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const [poRes, grnRes, invRes, prunRes, supplierRes, monthRes, statusRes, expRes, rfqRes] = await Promise.all([
          fetch('/api/wavecore/procurement/purchase-orders?limit=100').then(r => r.json()).catch(() => ({})),
          fetch('/api/wavecore/procurement/goods-receipts?limit=100').then(r => r.json()).catch(() => ({})),
          fetch('/api/wavecore/procurement/supplier-invoices?limit=100').then(r => r.json()).catch(() => ({})),
          fetch('/api/wavecore/procurement/payment-runs?limit=100').then(r => r.json()).catch(() => ({})),
          fetch('/api/wavecore/procurement/spend/analytics?dimension=supplier&limit=10').then(r => r.json()).catch(() => null),
          fetch('/api/wavecore/procurement/spend/analytics?dimension=month&limit=12').then(r => r.json()).catch(() => null),
          fetch('/api/wavecore/procurement/spend/analytics?dimension=status&limit=10').then(r => r.json()).catch(() => null),
          fetch('/api/wavecore/procurement/contracts/expiring?days=60').then(r => r.json()).catch(() => ({})),
          fetch('/api/wavecore/procurement/rfqs?status=PUBLISHED&limit=100').then(r => r.json()).catch(() => ({})),
        ])

        if (cancelled) return

        const pos = poRes.purchaseOrders || []
        const grns = grnRes.goodsReceipts || []
        const invs = invRes.supplierInvoices || []
        const runs = prunRes.paymentRuns || []

        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

        setKpis({
          openPOs: pos.filter((p: any) => ['APPROVED','SENT','ACKNOWLEDGED','PARTIALLY_RECEIVED'].includes(p.status)).length,
          awaiting: pos.filter((p: any) => p.status === 'SUBMITTED').length,
          grnsThisMonth: grns.filter((g: any) => g.receivedAt && new Date(g.receivedAt).getTime() >= monthStart).length,
          invoicesMatched: invs.filter((i: any) => i.matchStatus === 'AUTO_MATCHED' || i.status === 'MATCHED' || i.status === 'PAID').length,
          paymentRunsPending: runs.filter((r: any) => r.status === 'PENDING_APPROVAL' || r.status === 'APPROVED').length,
          totalSpend12mo: supplierRes?.totalSpend || 0,
        })

        if (supplierRes) setBySupplier(supplierRes)
        if (monthRes) setByMonth(monthRes)
        if (statusRes) setByStatus(statusRes)

        setExpiring((expRes.contracts || []).slice(0, 5))
        setClosingRFQs((rfqRes.rfqs || []).filter((r: any) => {
          if (!r.closingDate) return false
          const d = Math.floor((new Date(r.closingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          return d >= 0 && d <= 7
        }).slice(0, 5))
        setPendingRuns(runs.filter((r: any) => r.status === 'PENDING_APPROVAL').slice(0, 5))
      } catch {
        if (!cancelled) setError('Some data could not be loaded')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const spendLabel = (n: number) => {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
    return String(n)
  }

  if (loading) return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
    </div>
  )

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-500">Procurement Dashboard</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 lg:p-8 mb-6">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 flex items-center gap-3">
                <Package className="w-8 h-8" /> Procurement
              </h1>
              <p className="text-white/80 text-sm">End-to-end source-to-pay · updated just now</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link href="/wavecore-erp/procurement/orders" className="px-4 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
                <Package className="w-4 h-4" /> Purchase Orders
              </Link>
              <Link href="/wavecore-erp/procurement/rfqs" className="px-4 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> RFQs
              </Link>
              <Link href="/wavecore-erp/procurement/supplier-invoices" className="px-5 py-3 rounded-xl bg-white text-emerald-700 font-bold flex items-center gap-2 shadow-lg">
                <Receipt className="w-4 h-4" /> Invoices
              </Link>
            </div>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-amber-900/20 text-amber-300 border border-amber-800 flex items-start gap-2"><AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}

        {/* Module quick-links */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 mb-6">
          {MODULES.map(m => {
            const Icon = m.icon
            return (
              <Link key={m.href} href={m.href} className="group rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 hover:border-neutral-400 transition">
                <div className={'w-10 h-10 rounded-xl bg-gradient-to-br ' + m.color + ' flex items-center justify-center mb-3'}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="font-bold text-sm">{m.label}</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">{m.desc}</p>
                <ChevronRight className="w-4 h-4 text-neutral-400 mt-2 group-hover:translate-x-0.5 transition" />
              </Link>
            )
          })}
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <Kpi icon={Package} label="Open POs" value={kpis.openPOs} color="text-pink-500" />
          <Kpi icon={Clock} label="Awaiting approval" value={kpis.awaiting} color="text-amber-500" />
          <Kpi icon={Package2} label="GRNs this month" value={kpis.grnsThisMonth} color="text-emerald-500" />
          <Kpi icon={CheckCircle2} label="Invoices matched" value={kpis.invoicesMatched} color="text-indigo-500" />
          <Kpi icon={Wallet} label="Runs pending" value={kpis.paymentRunsPending} color="text-green-500" />
          <Kpi icon={DollarSign} label="Spend (12mo)" value={spendLabel(kpis.totalSpend12mo)} color="text-blue-500" />
        </div>

        {/* Spend analytics */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* By supplier */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Top suppliers (12mo)
            </h3>
            {!bySupplier || bySupplier.buckets.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-6">No spend data yet</p>
            ) : (
              <div className="space-y-3">
                {bySupplier.buckets.slice(0, 7).map((b: SpendBucket) => (
                  <div key={b.key}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium truncate">{b.label}</span>
                      <span className="text-xs font-bold">{spendLabel(b.totalSpend)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                        style={{ width: Math.max(2, b.sharePct) + '%' }}
                      />
                    </div>
                    <p className="text-[10px] text-neutral-500 mt-0.5">{b.sharePct}% · {b.invoiceCount} invoice{b.invoiceCount !== 1 ? 's' : ''}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* By month */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Monthly trend (12mo)
            </h3>
            {!byMonth || byMonth.buckets.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-6">No trend data yet</p>
            ) : (() => {
              const max = Math.max(...byMonth.buckets.map((b: SpendBucket) => b.totalSpend), 1)
              return (
                <div className="flex items-end justify-between gap-1 h-40">
                  {byMonth.buckets.map((b: SpendBucket) => {
                    const pct = (b.totalSpend / max) * 100
                    return (
                      <div key={b.key} className="flex-1 flex flex-col items-center justify-end h-full">
                        <div
                          className="w-full rounded-t bg-gradient-to-t from-purple-500 to-fuchsia-500 transition-all min-h-[2px]"
                          style={{ height: Math.max(2, pct) + '%' }}
                          title={b.label + ': ' + spendLabel(b.totalSpend)}
                        />
                        <p className="text-[9px] text-neutral-500 mt-1 rotate-[-45deg] origin-top-left whitespace-nowrap">
                          {b.label.split(' ')[0]}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>

          {/* By status */}
          {byStatus && byStatus.buckets.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:col-span-2">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4" /> Spend by invoice status
              </h3>
              <div className="flex flex-wrap gap-3">
                {byStatus.buckets.map((b: SpendBucket) => (
                  <div key={b.key} className="px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
                    <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">{b.label}</p>
                    <p className="text-base font-bold">{spendLabel(b.totalSpend)}</p>
                    <p className="text-[10px] text-neutral-500">{b.invoiceCount} invoice{b.invoiceCount !== 1 ? 's' : ''} · {b.sharePct}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {/* Contracts expiring */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" /> Contracts expiring ≤60d
            </h3>
            {expiring.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-4">All good</p>
            ) : (
              <div className="space-y-2">
                {expiring.map((c: any) => (
                  <Link key={c.id} href={'/wavecore-erp/procurement/contracts/' + c.id} className="block p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition">
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{c.contractNumber}</p>
                    <p className="text-sm font-medium truncate">{c.title}</p>
                    <p className="text-[10px] text-amber-500 font-bold">in {c.daysToExpiry} day{c.daysToExpiry !== 1 ? 's' : ''}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* RFQs closing */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-500" /> RFQs closing ≤7d
            </h3>
            {closingRFQs.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-4">All good</p>
            ) : (
              <div className="space-y-2">
                {closingRFQs.map((r: any) => (
                  <Link key={r.id} href={'/wavecore-erp/procurement/rfqs/' + r.id} className="block p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition">
                    <p className="text-xs font-bold text-purple-600 dark:text-purple-400">{r.rfqNumber}</p>
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className="text-[10px] text-neutral-500">
                      closes {r.closingDate ? new Date(r.closingDate).toLocaleDateString('en-GB') : '—'}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Payment runs pending */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-500" /> Payment runs pending
            </h3>
            {pendingRuns.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-4">None waiting</p>
            ) : (
              <div className="space-y-2">
                {pendingRuns.map((r: any) => (
                  <Link key={r.id} href={'/wavecore-erp/procurement/payment-runs/' + r.id} className="block p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition">
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{r.runNumber}</p>
                    <p className="text-sm font-medium">{r.currency} {Number(r.totalAmount || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-neutral-500">{r.invoiceCount} invoice{r.invoiceCount !== 1 ? 's' : ''}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity footer */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 flex items-center gap-3 text-sm text-neutral-500">
          <Activity className="w-4 h-4 text-emerald-500" />
          <p>
            Every action writes a typed <strong>ProcurementEvent</strong> — full feed will land in a Phase 8 command.
          </p>
        </div>
      </main>
    </div>
  )
}

function Kpi({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
      <Icon className={'w-4 h-4 mb-2 ' + color} />
      <p className="text-xl font-bold text-neutral-900 dark:text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">{label}</p>
    </div>
  )
}