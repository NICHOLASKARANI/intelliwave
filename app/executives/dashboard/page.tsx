'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Crown, Users, DollarSign, Lightbulb, Plus, LogOut, Send } from 'lucide-react'

export default function ExecutiveDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'section1' | 'section2' | 'section3'>('section1')
  const [message, setMessage] = useState('')
  const router = useRouter()

  // Section 1 form
  const [ideaForm, setIdeaForm] = useState({ title: '', target_audience: '', implementation_plan: '', expected_customers: '', evidence_url: '' })

  // Section 2 form
  const [customerForm, setCustomerForm] = useState({ customer_name: '', customer_email: '', customer_phone: '', product: 'wavecore', subscription_amount: '500' })

  // Section 3 form
  const [payoutForm, setPayoutForm] = useState({ payment_method: 'MPESA', payment_details: '' })

  const loadSession = async () => {
    const res = await fetch('/api/executives/session')
    const d = await res.json()
    if (!d.authenticated) {
      router.push('/executives/login')
      return
    }
    setData(d)
    setLoading(false)
  }

  useEffect(() => { loadSession() }, [])

  const logout = async () => {
    await fetch('/api/executives/logout', { method: 'POST' })
    router.push('/executives/login')
  }

  const submitIdea = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    const res = await fetch('/api/executives/submit-idea', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ideaForm),
    })
    const d = await res.json()
    if (res.ok) { setMessage('Idea submitted successfully!'); setIdeaForm({ title: '', target_audience: '', implementation_plan: '', expected_customers: '', evidence_url: '' }); loadSession() }
    else setMessage(d.error || 'Failed')
  }

  const registerCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    const res = await fetch('/api/executives/register-customer', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerForm),
    })
    const d = await res.json()
    if (res.ok) { setMessage(`Customer registered! Active users: ${d.active_users}. Level: ${d.level}`); setCustomerForm({ customer_name: '', customer_email: '', customer_phone: '', product: 'wavecore', subscription_amount: '500' }); loadSession() }
    else setMessage(d.error || 'Failed')
  }

  const requestPayout = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    const res = await fetch('/api/executives/earnings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payoutForm),
    })
    const d = await res.json()
    if (res.ok) { setMessage(`Payout of KSh ${d.amount} requested! Admin will approve.`); setPayoutForm({ payment_method: 'MPESA', payment_details: '' }); loadSession() }
    else setMessage(d.error || 'Failed')
  }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>
  if (!data) return null

  const { leader, ideas, customers, payouts } = data
  const levelRewards = { 0: 'Not yet Level 1', 1: 'KSh 3,000', 2: 'KSh 8,000', 3: 'KSh 20,000' }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Crown className="w-6 h-6 text-amber-400" />
          <span className="font-bold">{leader.name}</span>
          <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full">Level {leader.level}</span>
        </div>
        <button onClick={logout} className="text-sm text-slate-400 hover:text-white flex items-center gap-1">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
            <Users className="w-6 h-6 text-blue-400 mb-2" />
            <p className="text-3xl font-bold">{leader.total_active_users}</p>
            <p className="text-xs text-slate-400">Active Paying Users</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
            <Crown className="w-6 h-6 text-amber-400 mb-2" />
            <p className="text-3xl font-bold">L{leader.level}</p>
            <p className="text-xs text-slate-400">Current Level</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
            <DollarSign className="w-6 h-6 text-green-400 mb-2" />
            <p className="text-2xl font-bold">{levelRewards[leader.level as 0|1|2|3]}</p>
            <p className="text-xs text-slate-400">Monthly Reward</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
            <Send className="w-6 h-6 text-pink-400 mb-2" />
            <p className="text-lg font-bold truncate">{leader.referral_code}</p>
            <p className="text-xs text-slate-400">Your Referral Code</p>
          </div>
        </div>

        {message && <div className="bg-green-900/30 text-green-400 p-4 rounded-xl border border-green-800 mb-6">{message}</div>}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-800">
          {[
            { id: 'section1', label: 'Section 1: Ideas', icon: Lightbulb },
            { id: 'section2', label: 'Section 2: Customers', icon: Users },
            { id: 'section3', label: 'Section 3: Earnings', icon: DollarSign },
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setMessage('') }}
                className={`px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === tab.id ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400'}`}>
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            )
          })}
        </div>

        {/* Section 1 — Ideas */}
        {activeTab === 'section1' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
              <h2 className="text-xl font-bold mb-4">Submit a Marketing Idea</h2>
              <form onSubmit={submitIdea} className="space-y-3">
                <input required placeholder="Idea Title" value={ideaForm.title} onChange={e => setIdeaForm({ ...ideaForm, title: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                <input required placeholder="Target Audience" value={ideaForm.target_audience} onChange={e => setIdeaForm({ ...ideaForm, target_audience: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                <textarea required placeholder="Implementation Plan" value={ideaForm.implementation_plan} onChange={e => setIdeaForm({ ...ideaForm, implementation_plan: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white h-24" />
                <input type="number" placeholder="Expected Customers" value={ideaForm.expected_customers} onChange={e => setIdeaForm({ ...ideaForm, expected_customers: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                <input placeholder="Evidence URL (optional)" value={ideaForm.evidence_url} onChange={e => setIdeaForm({ ...ideaForm, evidence_url: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                <button type="submit" className="w-full py-2 bg-amber-500 text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Submit Idea</button>
              </form>
            </div>
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
              <h2 className="text-xl font-bold mb-4">Your Ideas ({ideas.length})</h2>
              <div className="space-y-3">
                {ideas.map((i: any) => (
                  <div key={i.id} className="bg-slate-800 p-4 rounded-xl">
                    <div className="flex justify-between">
                      <p className="font-bold">{i.title}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${i.status === 'APPROVED' ? 'bg-green-900/50 text-green-400' : 'bg-amber-900/50 text-amber-400'}`}>{i.status}</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-2">{i.target_audience}</p>
                  </div>
                ))}
                {ideas.length === 0 && <p className="text-slate-500 text-sm">No ideas submitted yet.</p>}
              </div>
            </div>
          </div>
        )}

        {/* Section 2 — Customers */}
        {activeTab === 'section2' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
              <h2 className="text-xl font-bold mb-4">Register New Customer</h2>
              <form onSubmit={registerCustomer} className="space-y-3">
                <input required placeholder="Customer Name" value={customerForm.customer_name} onChange={e => setCustomerForm({ ...customerForm, customer_name: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                <input required type="email" placeholder="Customer Email" value={customerForm.customer_email} onChange={e => setCustomerForm({ ...customerForm, customer_email: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                <input placeholder="Customer Phone" value={customerForm.customer_phone} onChange={e => setCustomerForm({ ...customerForm, customer_phone: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                <select value={customerForm.product} onChange={e => setCustomerForm({ ...customerForm, product: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white">
                  <option value="wavecore">WaveCore ERP</option>
                  <option value="wavvemarket">WavveMarket</option>
                  <option value="both">Both Products</option>
                </select>
                <input type="number" placeholder="Monthly Subscription (KSh)" value={customerForm.subscription_amount} onChange={e => setCustomerForm({ ...customerForm, subscription_amount: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                <button type="submit" className="w-full py-2 bg-amber-500 text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Register Customer</button>
              </form>
            </div>
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
              <h2 className="text-xl font-bold mb-4">Your Customers ({customers.length})</h2>
              <div className="space-y-3">
                {customers.map((c: any) => (
                  <div key={c.id} className="bg-slate-800 p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-bold">{c.customer_name}</p>
                      <p className="text-xs text-slate-400">{c.customer_email} · {c.product}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${c.is_paying ? 'bg-green-900/50 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                      {c.is_paying ? 'PAYING' : 'PENDING'}
                    </span>
                  </div>
                ))}
                {customers.length === 0 && <p className="text-slate-500 text-sm">No customers registered yet.</p>}
              </div>
            </div>
          </div>
        )}

        {/* Section 3 — Earnings */}
        {activeTab === 'section3' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
              <h2 className="text-xl font-bold mb-4">Request Payout</h2>
              {leader.level === 0 ? (
                <div className="bg-amber-900/20 border border-amber-800 p-4 rounded-xl">
                  <p className="text-amber-300 text-sm">You must reach Level 1 (30+ paying users) to request a payout. You currently have {leader.total_active_users} paying users.</p>
                </div>
              ) : (
                <>
                  <div className="bg-green-900/20 border border-green-800 p-4 rounded-xl mb-4">
                    <p className="text-sm text-slate-300">Your monthly reward:</p>
                    <p className="text-2xl font-bold text-green-400">{levelRewards[leader.level as 0|1|2|3]}</p>
                  </div>
                  <form onSubmit={requestPayout} className="space-y-3">
                    <select value={payoutForm.payment_method} onChange={e => setPayoutForm({ ...payoutForm, payment_method: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white">
                      <option value="MPESA">M-Pesa</option>
                      <option value="BANK">Bank Transfer</option>
                    </select>
                    <input required placeholder={payoutForm.payment_method === 'MPESA' ? 'Phone (0712345678)' : 'Bank Account + Name'} value={payoutForm.payment_details} onChange={e => setPayoutForm({ ...payoutForm, payment_details: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                    <button type="submit" className="w-full py-2 bg-green-500 text-slate-900 rounded-xl font-bold">Request Payout</button>
                  </form>
                </>
              )}
            </div>
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
              <h2 className="text-xl font-bold mb-4">Payout History</h2>
              <div className="space-y-3">
                {payouts.map((p: any) => (
                  <div key={p.id} className="bg-slate-800 p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-bold">KSh {p.amount.toLocaleString()}</p>
                      <p className="text-xs text-slate-400">{p.payment_method} · L{p.level_at_payout}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'PAID' ? 'bg-green-900/50 text-green-400' : p.status === 'APPROVED' ? 'bg-blue-900/50 text-blue-400' : 'bg-amber-900/50 text-amber-400'}`}>
                      {p.status}
                    </span>
                  </div>
                ))}
                {payouts.length === 0 && <p className="text-slate-500 text-sm">No payout requests yet.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}