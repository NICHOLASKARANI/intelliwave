'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Loader2, X, Users, Target, TrendingUp, FileText, Package, ArrowRight,
} from 'lucide-react'

interface Result {
  customers: any[]
  leads: any[]
  opportunities: any[]
  quotations: any[]
  orders: any[]
}

const EMPTY: Result = { customers: [], leads: [], opportunities: [], quotations: [], orders: [] }

export default function CrmGlobalSearch({ className = '' }: { className?: string }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Result>(EMPTY)
  const [total, setTotal] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced search
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults(EMPTY); setTotal(0); setLoading(false); return
    }
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/wavecore/crm/search?q=' + encodeURIComponent(q.trim()) + '&limit=5', { cache: 'no-store' })
        const data = await res.json()
        setResults(data.results || EMPTY)
        setTotal(data.totalCount || 0)
      } catch {
        setResults(EMPTY); setTotal(0)
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  // Click outside closes
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // Cmd/Ctrl + K focuses
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const go = (path: string) => {
    setOpen(false)
    setQ('')
    router.push(path)
  }

  const showResults = open && q.trim().length >= 2

  return (
    <div ref={wrapRef} className={'relative ' + className}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search customers, leads, deals, quotes…  ⌘K"
          className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-neutral-400" />}
        {!loading && q && (
          <button onClick={() => { setQ(''); setResults(EMPTY); setTotal(0) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showResults && (
        <div className="absolute z-50 mt-2 left-0 right-0 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl max-h-[70vh] overflow-y-auto">
          {total === 0 && !loading && (
            <div className="p-6 text-center text-sm text-neutral-500">No results for "{q}"</div>
          )}

          {results.customers.length > 0 && (
            <Section icon={Users} title="Customers" count={results.customers.length}>
              {results.customers.map(c => (
                <Row key={c.id} onClick={() => go('/wavecore-erp/crm/customers/' + c.id)}
                     title={c.name} sub={c.email || c.phone || c.company || ''} tag={c.status} />
              ))}
            </Section>
          )}

          {results.leads.length > 0 && (
            <Section icon={Target} title="Leads" count={results.leads.length}>
              {results.leads.map(l => (
                <Row key={l.id} onClick={() => go('/wavecore-erp/crm/leads/' + l.id)}
                     title={l.name} sub={l.email || l.phone || l.company || ''} tag={l.status} />
              ))}
            </Section>
          )}

          {results.opportunities.length > 0 && (
            <Section icon={TrendingUp} title="Opportunities" count={results.opportunities.length}>
              {results.opportunities.map(o => (
                <Row key={o.id} onClick={() => go('/wavecore-erp/crm/opportunities/' + o.id)}
                     title={o.name} sub={o.customerName || ''} tag={o.stage}
                     amount={o.amount} />
              ))}
            </Section>
          )}

          {results.quotations.length > 0 && (
            <Section icon={FileText} title="Quotations" count={results.quotations.length}>
              {results.quotations.map(qt => (
                <Row key={qt.id} onClick={() => go('/wavecore-erp/crm/quotations/' + qt.id)}
                     title={qt.number} sub={qt.customerName || ''} tag={qt.status}
                     amount={qt.total} />
              ))}
            </Section>
          )}

          {results.orders.length > 0 && (
            <Section icon={Package} title="Sales Orders" count={results.orders.length}>
              {results.orders.map(o => (
                <Row key={o.id} onClick={() => go('/wavecore-erp/crm/orders/' + o.id)}
                     title={o.number} sub={o.customerName || ''} tag={o.status}
                     amount={o.total} />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ icon: Icon, title, count, children }: any) {
  return (
    <div className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
      <div className="flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-wide font-bold text-neutral-500 bg-neutral-50 dark:bg-neutral-800/50">
        <Icon className="w-3 h-3" /> {title}
        <span className="ml-auto px-1.5 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-[9px]">{count}</span>
      </div>
      {children}
    </div>
  )
}

function Row({ title, sub, tag, amount, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 flex items-center gap-3 transition"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate">{title}</p>
        {sub && <p className="text-xs text-neutral-500 truncate">{sub}</p>}
      </div>
      {tag && (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
          {tag}
        </span>
      )}
      {amount != null && (
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
          KSh {Number(amount || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </span>
      )}
      <ArrowRight className="w-3.5 h-3.5 text-neutral-300 flex-shrink-0" />
    </button>
  )
}