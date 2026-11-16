'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ShoppingCart, Plus, Minus, Trash2, Search, CreditCard, Banknote, Smartphone, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'

type Product = { id: string; name: string; sku?: string; price: number; stock: number; taxRate?: number }
type CartItem = Product & { quantity: number }
type Terminal = { id: string; name: string; location?: string }
type Session = { id: string; cashierName?: string; openingCash: number; status: string }

export default function POSPage() {
  const [orgId, setOrgId] = useState<string>('')
  const [terminals, setTerminals] = useState<Terminal[]>([])
  const [selectedTerminal, setSelectedTerminal] = useState<string>('')
  const [session, setSession] = useState<Session | null>(null)
  const [openingCash, setOpeningCash] = useState<string>('0')
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState<string>('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MPESA' | 'CARD'>('CASH')
  const [paymentReference, setPaymentReference] = useState<string>('')
  const [cashReceived, setCashReceived] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [lastReceipt, setLastReceipt] = useState<string | null>(null)

  useEffect(() => {
    const cookies = document.cookie.split(';').reduce((acc: any, c) => {
      const [k, v] = c.trim().split('=')
      acc[k] = decodeURIComponent(v || '')
      return acc
    }, {})
    const o = cookies['wavecore_organizationId'] || cookies['organizationId'] || ''
    setOrgId(o)
  }, [])

  useEffect(() => {
    if (!orgId) return
    fetch('/api/wavecore/pos/terminals?organizationId=' + orgId)
      .then(r => r.json())
      .then(d => {
        if (d.terminals) {
          setTerminals(d.terminals)
          if (d.terminals.length > 0) setSelectedTerminal(d.terminals[0].id)
        }
      })
      .catch(() => {})
    fetch('/api/wavecore/pos/products?organizationId=' + orgId)
      .then(r => r.json())
      .then(d => { if (d.products) setProducts(d.products) })
      .catch(() => {})
  }, [orgId])

  const filtered = useMemo(() => {
    if (!search) return products
    const s = search.toLowerCase()
    return products.filter(p => p.name.toLowerCase().includes(s) || (p.sku || '').toLowerCase().includes(s))
  }, [products, search])

  const subtotal = cart.reduce((s, i) => s + i.quantity * i.price, 0)
  const tax = cart.reduce((s, i) => s + i.quantity * i.price * ((i.taxRate || 0) / 100), 0)
  const total = subtotal + tax
  const change = paymentMethod === 'CASH' ? Math.max(0, parseFloat(cashReceived || '0') - total) : 0

  const addToCart = (p: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === p.id)
      if (existing) return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { ...p, quantity: 1 }]
    })
  }
  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))
  }
  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.id !== id))

  const openSession = async () => {
    if (!selectedTerminal || !orgId) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/wavecore/pos/sessions/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: orgId,
          terminalId: selectedTerminal,
          cashierId: 'cashier-' + Date.now(),
          cashierName: 'Cashier',
          openingCash: parseFloat(openingCash) || 0,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setSession(data.session)
        setMessage({ type: 'success', text: 'Session opened. Ready to sell.' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to open session' })
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message })
    }
    setLoading(false)
  }

  const closeSession = async () => {
    if (!session) return
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/pos/sessions/' + session.id + '/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closingCash: parseFloat(cashReceived) || 0 }),
      })
      if (res.ok) {
        setSession(null)
        setMessage({ type: 'success', text: 'Session closed. Cash variance recorded.' })
      }
    } catch {}
    setLoading(false)
  }

  const checkout = async () => {
    if (!session || cart.length === 0) return
    setLoading(true)
    setMessage(null)
    try {
      const items = cart.map(i => ({
        productId: i.id, productName: i.name, sku: i.sku,
        quantity: i.quantity, unitPrice: i.price, taxRate: i.taxRate || 0,
      }))
      const res = await fetch('/api/wavecore/pos/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: orgId,
          terminalId: selectedTerminal,
          sessionId: session.id,
          cashierId: 'cashier-' + Date.now(),
          paymentMethod,
          paymentReference: paymentMethod === 'MPESA' ? paymentReference : undefined,
          changeGiven: change,
          items,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setLastReceipt(data.sale.receiptNumber)
        setMessage({ type: 'success', text: 'Sale complete. Receipt: ' + data.sale.receiptNumber })
        setCart([])
        setCashReceived('')
        setPaymentReference('')
      } else {
        setMessage({ type: 'error', text: data.error || 'Sale failed' })
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Point of Sale</h1>
            <p className="text-slate-400">Ring up sales in seconds. Accept M-Pesa, cash, or card.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/wavecore-erp/pos/terminals" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm">Terminals</Link>
            <Link href="/wavecore-erp/pos/sessions" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm">Sessions</Link>
            <Link href="/wavecore-erp/pos/sales" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm">Sales</Link>
          </div>
        </div>

        {message && (
          <div className={'mb-4 p-3 rounded-xl text-sm ' + (message.type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-300' : 'bg-red-500/10 border border-red-500/30 text-red-300')}>
            {message.text}
          </div>
        )}

        {!session ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md">
            <h2 className="text-xl font-bold mb-4">Open Session</h2>
            <div className="mb-4">
              <label className="block text-sm text-slate-300 mb-2">Terminal</label>
              <select value={selectedTerminal} onChange={e => setSelectedTerminal(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white">
                <option value="">-- Select terminal --</option>
                {terminals.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-slate-300 mb-2">Opening Cash (KSh)</label>
              <input type="number" value={openingCash} onChange={e => setOpeningCash(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white" />
            </div>
            <button onClick={openSession} disabled={!selectedTerminal || loading} className="w-full py-3 bg-blue-500 hover:bg-blue-400 rounded-xl font-bold disabled:opacity-50">
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Open Session'}
            </button>
            {terminals.length === 0 && (
              <p className="mt-4 text-sm text-slate-400">
                No terminals yet. <Link href="/wavecore-erp/pos/terminals" className="text-blue-400 hover:underline">Create one first →</Link>
              </p>
            )}
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products or SKU..." className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {filtered.map(p => (
                    <button key={p.id} onClick={() => addToCart(p)} className="text-left p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl">
                      <div className="font-medium text-sm mb-1 line-clamp-2">{p.name}</div>
                      <div className="text-blue-400 font-bold text-sm">KSh {p.price.toLocaleString()}</div>
                      <div className="text-xs text-slate-500">Stock: {p.stock}</div>
                    </button>
                  ))}
                  {filtered.length === 0 && <p className="col-span-full text-slate-500 text-center py-8">No products found</p>}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col h-fit">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="w-5 h-5" />
                <h2 className="font-bold">Cart ({cart.length})</h2>
              </div>

              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{item.name}</div>
                      <div className="text-xs text-slate-400">KSh {item.price.toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 bg-slate-700 rounded flex items-center justify-center">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 bg-slate-700 rounded flex items-center justify-center">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {cart.length === 0 && <p className="text-slate-500 text-center py-4 text-sm">Cart empty — tap a product to add</p>}
              </div>

              <div className="border-t border-slate-700 pt-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Subtotal</span><span>KSh {subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Tax</span><span>KSh {tax.toLocaleString()}</span></div>
                <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-blue-400">KSh {total.toLocaleString()}</span></div>
              </div>

              <div className="mt-4">
                <label className="block text-xs text-slate-400 mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-1">
                  <button onClick={() => setPaymentMethod('CASH')} className={'py-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1 ' + (paymentMethod === 'CASH' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400')}>
                    <Banknote className="w-4 h-4" /> Cash
                  </button>
                  <button onClick={() => setPaymentMethod('MPESA')} className={'py-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1 ' + (paymentMethod === 'MPESA' ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-400')}>
                    <Smartphone className="w-4 h-4" /> M-Pesa
                  </button>
                  <button onClick={() => setPaymentMethod('CARD')} className={'py-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1 ' + (paymentMethod === 'CARD' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400')}>
                    <CreditCard className="w-4 h-4" /> Card
                  </button>
                </div>
              </div>

              {paymentMethod === 'CASH' && (
                <div className="mt-3">
                  <label className="block text-xs text-slate-400 mb-1">Cash Received</label>
                  <input type="number" value={cashReceived} onChange={e => setCashReceived(e.target.value)} placeholder="0" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm" />
                  {parseFloat(cashReceived) > total && (
                    <p className="text-xs text-green-400 mt-1">Change: KSh {change.toLocaleString()}</p>
                  )}
                </div>
              )}

              {paymentMethod === 'MPESA' && (
                <div className="mt-3">
                  <label className="block text-xs text-slate-400 mb-1">M-Pesa Reference</label>
                  <input value={paymentReference} onChange={e => setPaymentReference(e.target.value)} placeholder="e.g. SFH4XYZ" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm" />
                </div>
              )}

              <button onClick={checkout} disabled={cart.length === 0 || loading} className="w-full mt-4 py-3 bg-green-500 hover:bg-green-400 rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Complete Sale — KSh {total.toLocaleString()}
              </button>

              <button onClick={closeSession} className="w-full mt-2 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl text-sm">
                Close Session
              </button>

              {lastReceipt && (
                <p className="text-xs text-center text-green-400 mt-2">Last receipt: {lastReceipt}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}