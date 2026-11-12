'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Loader2, Save, CheckCircle, Wallet, Smartphone, Store } from 'lucide-react'

type Method = 'PAYBILL' | 'TILL' | 'PERSONAL' | ''

export default function PaymentSettingsPage() {
  const [method, setMethod] = useState<Method>('')
  const [paybill, setPaybill] = useState('')
  const [paybillAccount, setPaybillAccount] = useState('')
  const [till, setTill] = useState('')
  const [personal, setPersonal] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/marketplace/seller/payment-settings')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.settings) {
          setMethod((d.settings.preferredPaymentMethod || '') as Method)
          setPaybill(d.settings.paymentPaybill || '')
          setPaybillAccount(d.settings.paymentPaybillAccount || '')
          setTill(d.settings.paymentTill || '')
          setPersonal(d.settings.paymentPersonal || '')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setError('')
    setMessage('')
    if (!method) { setError('Choose a payment method'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/marketplace/seller/payment-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredPaymentMethod: method,
          paymentPaybill: paybill,
          paymentPaybillAccount: paybillAccount,
          paymentTill: till,
          paymentPersonal: personal,
        }),
      })
      if (res.ok) {
        setMessage('Payment settings saved')
        setTimeout(() => setMessage(''), 3000)
      } else {
        const d = await res.json()
        setError(d.error || 'Failed to save')
      }
    } finally { setSaving(false) }
  }

  if (loading) {
    return <div className="min-h-screen bg-neutral-950 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-cyan-500" /></div>
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur border-b border-neutral-800">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/marketplace/seller/orders" className="flex items-center gap-2 font-bold">
            <ChevronLeft className="w-5 h-5" /> Back
          </Link>
          <span className="font-bold text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5 text-cyan-400" /> Payment Settings
          </span>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 lg:p-6 space-y-4">
        <div className="p-5 rounded-2xl bg-cyan-950/30 border border-cyan-800">
          <p className="text-sm text-cyan-300">
            <b>How buyers pay you:</b> When you accept an order, the buyer sees the payment method you choose here.
            They'll send money directly to your M-Pesa account. <b>WaveMarket doesn't hold funds.</b>
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div>
            <label className="text-xs uppercase font-bold text-neutral-500 mb-2 block">Preferred payment method</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setMethod('PAYBILL')}
                className={`p-3 rounded-xl border-2 text-center ${method === 'PAYBILL' ? 'border-cyan-500 bg-cyan-500/10' : 'border-neutral-700'}`}
              >
                <Store className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs font-bold">Paybill</span>
              </button>
              <button
                onClick={() => setMethod('TILL')}
                className={`p-3 rounded-xl border-2 text-center ${method === 'TILL' ? 'border-cyan-500 bg-cyan-500/10' : 'border-neutral-700'}`}
              >
                <Store className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs font-bold">Till</span>
              </button>
              <button
                onClick={() => setMethod('PERSONAL')}
                className={`p-3 rounded-xl border-2 text-center ${method === 'PERSONAL' ? 'border-cyan-500 bg-cyan-500/10' : 'border-neutral-700'}`}
              >
                <Smartphone className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs font-bold">Personal</span>
              </button>
            </div>
          </div>

          {method === 'PAYBILL' && (
            <>
              <div>
                <label className="text-xs uppercase font-bold text-neutral-500 mb-1 block">Paybill Number</label>
                <input value={paybill} onChange={e => setPaybill(e.target.value)} placeholder="e.g. 247247" className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase font-bold text-neutral-500 mb-1 block">Account (optional)</label>
                <input value={paybillAccount} onChange={e => setPaybillAccount(e.target.value)} placeholder="e.g. order number" className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white" />
              </div>
            </>
          )}

          {method === 'TILL' && (
            <div>
              <label className="text-xs uppercase font-bold text-neutral-500 mb-1 block">Till Number</label>
              <input value={till} onChange={e => setTill(e.target.value)} placeholder="e.g. 5123456" className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white" />
            </div>
          )}

          {method === 'PERSONAL' && (
            <div>
              <label className="text-xs uppercase font-bold text-neutral-500 mb-1 block">Your M-Pesa Phone</label>
              <input value={personal} onChange={e => setPersonal(e.target.value)} placeholder="e.g. 0712345678" className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white" />
            </div>
          )}

          {error && <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-sm">{error}</div>}
          {message && <div className="p-3 rounded-lg bg-green-950/50 border border-green-800 text-green-300 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {message}</div>}

          <button
            onClick={save}
            disabled={saving || !method}
            className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Payment Settings'}
          </button>
        </div>
      </main>
    </div>
  )
}