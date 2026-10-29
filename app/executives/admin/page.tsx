'use client'
import { useState, useEffect } from 'react'
import { Crown, Users, Lightbulb, DollarSign, Gift, CheckCircle, XCircle } from 'lucide-react'

export default function CEOAdmin() {
  const [password, setPassword] = useState('')
  const [auth, setAuth] = useState(false)
  const [data, setData] = useState<any>(null)
  const [tab, setTab] = useState<'leaders' | 'ideas' | 'customers' | 'payouts'>('leaders')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const loadData = async () => {
    setLoading(true)
    const res = await fetch('/api/executives/admin', {
      headers: { 'x-ceo-password': password },
    })
    if (res.ok) {
      const d = await res.json()
      setData(d)
      setAuth(true)
    } else {
      alert('Invalid CEO password')
      setAuth(false)
    }
    setLoading(false)
  }

  const login = (e: React.FormEvent) => {
    e.preventDefault()
    loadData()
  }

  const doAction = async (action: string, target_id: string, notes?: string) => {
    setMessage('')
    const res = await fetch('/api/executives/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-ceo-password': password },
      body: JSON.stringify({ action, target_id, notes }),
    })
    const d = await res.json()
    if (res.ok) {
      setMessage(d.message || `${action} completed`)
      loadData()
    } else {
      setMessage(d.error || 'Failed')
    }
  }

  if (!auth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <form onSubmit={login} className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 p-8">
          <Crown className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white text-center mb-6">CEO Admin Access</h1>
          <input type="password" placeholder="Enter CEO Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white mb-4" />
          <button type="submit" disabled={loading} className="w-full py-3 bg-amber-500 text-slate-900 rounded-xl font-bold">
            {loading ? 'Verifying...' : 'Access Dashboard'}
          </button>
        </form>
      </div>
    )
  }

  const { leaders = [], ideas = [], customers = [], payouts = [] } = data || {}

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Crown className="w-6 h-6 text-amber-400" />
          <span className="font-bold">CEO Admin — IntelliWavve Executive Leaders</span>
        </div>
        <button onClick={() => { setAuth(false); setPassword('') }} className="text-sm text-slate-400 hover:text-white">Lock</button>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
            <Users className="w-6 h-6 text-blue-400 mb-2" />
            <p className="text-2xl font-bold">{leaders.length}</p>
            <p className="text-xs text-slate-400">Total Leaders</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
            <Lightbulb className="w-6 h-6 text-amber-400 mb-2" />
            <p className="text-2xl font-bold">{ideas.length}</p>
            <p className="text-xs text-slate-400">Ideas Submitted</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
            <CheckCircle className="w-6 h-6 text-green-400 mb-2" />
            <p className="text-2xl font-bold">{customers.filter((c: any) => c.is_paying).length}/{customers.length}</p>
            <p className="text-xs text-slate-400">Paying Customers</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
            <DollarSign className="w-6 h-6 text-pink-400 mb-2" />
            <p className="text-2xl font-bold">{payouts.filter((p: any) => p.status === 'PENDING').length}</p>
            <p className="text-xs text-slate-400">Pending Payouts</p>
          </div>
        </div>

        {message && <div className="bg-green-900/30 text-green-400 p-3 rounded-xl border border-green-800 mb-4 text-sm">{message}</div>}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-800 overflow-x-auto">
          {[
            { id: 'leaders', label: 'Leaders', count: leaders.length },
            { id: 'ideas', label: 'Ideas', count: ideas.length },
            { id: 'customers', label: 'Customers', count: customers.length },
            { id: 'payouts', label: 'Payouts', count: payouts.length },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap ${tab === t.id ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400'}`}>
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* Leaders Tab */}
        {tab === 'leaders' && (
          <div className="space-y-3">
            {leaders.map((l: any) => (
              <div key={l.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold">{l.full_name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${l.status === 'APPROVED' ? 'bg-green-900/50 text-green-400' : l.status === 'PENDING' ? 'bg-amber-900/50 text-amber-400' : 'bg-red-900/50 text-red-400'}`}>{l.status}</span>
                    <span className="text-xs text-amber-400">Level {l.level}</span>
                  </div>
                  <p className="text-sm text-slate-400">{l.email} · {l.phone} · {l.location}</p>
                  <p className="text-xs text-slate-500 mt-1">Referral: <code className="text-amber-400">{l.referral_code}</code> · Active users: {l.total_active_users}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {l.status === 'PENDING' && (
                    <>
                      <button onClick={() => doAction('approve_leader', l.id)} className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-500 rounded-lg font-bold">Approve</button>
                      <button onClick={() => doAction('reject_leader', l.id)} className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-500 rounded-lg font-bold">Reject</button>
                    </>
                  )}
                  {!l.gift_sent && l.status === 'APPROVED' && (
                    <button onClick={() => doAction('send_gift', l.id)} className="px-3 py-1.5 text-xs bg-pink-600 hover:bg-pink-500 rounded-lg font-bold flex items-center gap-1">
                      <Gift className="w-3 h-3" /> Send KSh 200 Gift
                    </button>
                  )}
                  {l.gift_sent && <span className="text-xs text-green-400">✓ Gift sent</span>}
                </div>
              </div>
            ))}
            {leaders.length === 0 && <p className="text-slate-500 text-center py-8">No leaders yet.</p>}
          </div>
        )}

        {/* Ideas Tab */}
        {tab === 'ideas' && (
          <div className="space-y-3">
            {ideas.map((i: any) => {
              const leader = leaders.find((l: any) => l.id === i.leader_id)
              return (
                <div key={i.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold">{i.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${i.status === 'APPROVED' ? 'bg-green-900/50 text-green-400' : 'bg-amber-900/50 text-amber-400'}`}>{i.status}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">By {leader?.full_name || 'Unknown'} · Target: {i.target_audience}</p>
                  <p className="text-sm text-slate-300">{i.implementation_plan}</p>
                  {i.expected_customers > 0 && <p className="text-xs text-amber-400 mt-2">Expected customers: {i.expected_customers}</p>}
                </div>
              )
            })}
            {ideas.length === 0 && <p className="text-slate-500 text-center py-8">No ideas yet.</p>}
          </div>
        )}

        {/* Customers Tab */}
        {tab === 'customers' && (
          <div className="space-y-3">
            {customers.map((c: any) => {
              const leader = leaders.find((l: any) => l.id === c.leader_id)
              return (
                <div key={c.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1">
                    <p className="font-bold">{c.customer_name}</p>
                    <p className="text-sm text-slate-400">{c.customer_email} · {c.customer_phone || 'no phone'}</p>
                    <p className="text-xs text-slate-500 mt-1">Product: {c.product} · Amount: KSh {c.subscription_amount} · By {leader?.full_name || 'Unknown'}</p>
                  </div>
                  <div className="flex gap-2">
                    {c.is_paying ? (
                      <span className="px-3 py-1.5 text-xs bg-green-900/50 text-green-400 rounded-lg font-bold">✓ PAYING</span>
                    ) : (
                      <button onClick={() => doAction('verify_customer', c.id)} className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 rounded-lg font-bold">Verify as Paying</button>
                    )}
                  </div>
                </div>
              )
            })}
            {customers.length === 0 && <p className="text-slate-500 text-center py-8">No customers yet.</p>}
          </div>
        )}

        {/* Payouts Tab */}
        {tab === 'payouts' && (
          <div className="space-y-3">
            {payouts.map((p: any) => {
              const leader = leaders.find((l: any) => l.id === p.leader_id)
              return (
                <div key={p.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1">
                    <p className="font-bold">KSh {p.amount.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">To: {leader?.full_name} ({p.payment_method})</p>
                    <p className="text-xs text-slate-500 mt-1">Details: {p.payment_details} · Level {p.level_at_payout}</p>
                  </div>
                  <div className="flex gap-2">
                    {p.status === 'PENDING' && (
                      <>
                        <button onClick={() => doAction('approve_payout', p.id)} className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-500 rounded-lg font-bold">Approve</button>
                        <button onClick={() => doAction('reject_payout', p.id)} className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-500 rounded-lg font-bold">Reject</button>
                      </>
                    )}
                    {p.status !== 'PENDING' && (
                      <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'APPROVED' ? 'bg-blue-900/50 text-blue-400' : 'bg-red-900/50 text-red-400'}`}>{p.status}</span>
                    )}
                  </div>
                </div>
              )
            })}
            {payouts.length === 0 && <p className="text-slate-500 text-center py-8">No payouts yet.</p>}
          </div>
        )}
      </div>
    </div>
  )
}