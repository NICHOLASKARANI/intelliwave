'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, Users, DollarSign, Activity, X, ArrowLeft } from 'lucide-react'

export default function AnalyticsDashboard() {
  const [password, setPassword] = useState('')
  const [auth, setAuth] = useState(false)
  const [data, setData] = useState<any>(null)
  const [leaders, setLeaders] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [payouts, setPayouts] = useState<any[]>([])
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  const loadData = async () => {
    const res = await fetch('/api/executives/admin/analytics', {
      headers: { 'x-ceo-password': password }
    })
    if (res.ok) {
      setData(await res.json())
      setAuth(true)
      const detailRes = await fetch('/api/executives/admin', {
        headers: { 'x-ceo-password': password }
      })
      if (detailRes.ok) {
        const detail = await detailRes.json()
        setLeaders(detail.leaders || [])
        setCustomers(detail.customers || [])
        setPayouts(detail.payouts || [])
      }
    } else {
      alert('Invalid password')
    }
  }

  if (!auth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 w-full max-w-sm">
          <h1 className="text-white font-bold mb-4">Analytics Access</h1>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadData()} className="w-full px-4 py-2 bg-slate-800 text-white rounded-xl mb-4" placeholder="CEO Password" />
          <button onClick={loadData} className="w-full py-2 bg-amber-500 text-slate-900 font-bold rounded-xl">Access</button>
        </div>
      </div>
    )
  }

  const { metrics, levels } = data

  const toggleFilter = (filter: string) => {
    setActiveFilter(activeFilter === filter ? null : filter)
  }

  const filteredLeaders = () => {
    if (activeFilter === 'LEVEL_1') return leaders.filter((l: any) => l.level === 1)
    if (activeFilter === 'LEVEL_2') return leaders.filter((l: any) => l.level === 2)
    if (activeFilter === 'LEVEL_3') return leaders.filter((l: any) => l.level === 3)
    return []
  }

  const filteredCustomers = () => {
    if (activeFilter === 'ACTIVE_PAYING' || activeFilter === 'MRR' || activeFilter === 'REWARDS_OWED') {
      return customers.filter((c: any) => c.is_paying === true)
    }
    return []
  }

  const filteredPayouts = () => {
    if (activeFilter === 'REWARDS_OWED') return payouts.filter((p: any) => p.status === 'PENDING')
    return []
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <Link href="/executives/admin" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-2">
              <ArrowLeft className="w-4 h-4" /> Back to Admin
            </Link>
            <h1 className="text-3xl font-bold">Executive Growth Analytics</h1>
            <p className="text-sm text-slate-400 mt-1">Click any KPI card to see the underlying data</p>
          </div>
          <button onClick={loadData} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold">
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <button onClick={() => toggleFilter('ACTIVE_PAYING')} className={`text-left bg-slate-900 border-2 p-6 rounded-2xl transition-all hover:scale-[1.02] ${activeFilter === 'ACTIVE_PAYING' ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-800 hover:border-blue-500/50'}`}>
            <Users className="w-8 h-8 text-blue-400 mb-4" />
            <p className="text-3xl font-bold">{metrics.activeCustomers}</p>
            <p className="text-sm text-slate-400">Active Paying Users</p>
            <p className="text-xs text-blue-400 mt-2">Click to view list</p>
          </button>

          <button onClick={() => toggleFilter('MRR')} className={`text-left bg-slate-900 border-2 p-6 rounded-2xl transition-all hover:scale-[1.02] ${activeFilter === 'MRR' ? 'border-green-500 ring-2 ring-green-500/30' : 'border-slate-800 hover:border-green-500/50'}`}>
            <DollarSign className="w-8 h-8 text-green-400 mb-4" />
            <p className="text-3xl font-bold">KSh {metrics.mrr.toLocaleString()}</p>
            <p className="text-sm text-slate-400">Estimated MRR</p>
            <p className="text-xs text-green-400 mt-2">Click for breakdown</p>
          </button>

          <button onClick={() => toggleFilter('REWARDS_OWED')} className={`text-left bg-slate-900 border-2 p-6 rounded-2xl transition-all hover:scale-[1.02] ${activeFilter === 'REWARDS_OWED' ? 'border-pink-500 ring-2 ring-pink-500/30' : 'border-slate-800 hover:border-pink-500/50'}`}>
            <Activity className="w-8 h-8 text-pink-400 mb-4" />
            <p className="text-3xl font-bold">KSh {metrics.totalRewards.toLocaleString()}</p>
            <p className="text-sm text-slate-400">Current Rewards Owed</p>
            <p className="text-xs text-pink-400 mt-2">Click for payouts</p>
          </button>

          <button onClick={() => toggleFilter('ROI')} className={`text-left bg-slate-900 border-2 p-6 rounded-2xl transition-all hover:scale-[1.02] ${activeFilter === 'ROI' ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-slate-800 hover:border-amber-500/50'}`}>
            <TrendingUp className="w-8 h-8 text-amber-400 mb-4" />
            <p className="text-3xl font-bold">{metrics.roi}x</p>
            <p className="text-sm text-slate-400">Revenue to Reward ROI</p>
            <p className="text-xs text-amber-400 mt-2">Click for details</p>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button onClick={() => toggleFilter('LEVEL_1')} className={`text-left bg-slate-900 border-2 p-6 rounded-2xl transition-all hover:scale-[1.02] ${activeFilter === 'LEVEL_1' ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-slate-800 border-t-4 border-t-amber-500 hover:border-amber-500/50'}`}>
            <h3 className="text-lg font-bold mb-2">Level 1 Leaders</h3>
            <p className="text-4xl font-extrabold">{levels.l1_count}</p>
            <p className="text-xs text-slate-500 mt-2">30+ users (KSh 3,000/month)</p>
            <p className="text-xs text-amber-400 mt-2">Click to view leaders</p>
          </button>
          <button onClick={() => toggleFilter('LEVEL_2')} className={`text-left bg-slate-900 border-2 p-6 rounded-2xl transition-all hover:scale-[1.02] ${activeFilter === 'LEVEL_2' ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-slate-800 border-t-4 border-t-amber-600 hover:border-amber-500/50'}`}>
            <h3 className="text-lg font-bold mb-2">Level 2 Leaders</h3>
            <p className="text-4xl font-extrabold">{levels.l2_count}</p>
            <p className="text-xs text-slate-500 mt-2">60+ users (KSh 8,000/month)</p>
            <p className="text-xs text-amber-400 mt-2">Click to view leaders</p>
          </button>
          <button onClick={() => toggleFilter('LEVEL_3')} className={`text-left bg-slate-900 border-2 p-6 rounded-2xl transition-all hover:scale-[1.02] ${activeFilter === 'LEVEL_3' ? 'border-amber-600 ring-2 ring-amber-600/30' : 'border-slate-800 border-t-4 border-t-amber-700 hover:border-amber-600/50'}`}>
            <h3 className="text-lg font-bold mb-1">Level 3 Leaders</h3>
            <p className="text-4xl font-extrabold">{levels.l3_count}</p>
            <p className="text-xs text-slate-500 mt-2">100+ users (KSh 20,000/month)</p>
            <p className="text-xs text-amber-400 mt-2">Click to view leaders</p>
          </button>
        </div>

        {activeFilter && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {activeFilter === 'ACTIVE_PAYING' && 'Active Paying Users'}
                {activeFilter === 'MRR' && 'MRR Breakdown'}
                {activeFilter === 'REWARDS_OWED' && 'Pending Rewards & Payouts'}
                {activeFilter === 'ROI' && 'ROI Analysis'}
                {activeFilter === 'LEVEL_1' && 'Level 1 Leaders (30-59 users)'}
                {activeFilter === 'LEVEL_2' && 'Level 2 Leaders (60-99 users)'}
                {activeFilter === 'LEVEL_3' && 'Level 3 Leaders (100+ users)'}
              </h2>
              <button onClick={() => setActiveFilter(null)} className="p-2 hover:bg-slate-800 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {(activeFilter === 'LEVEL_1' || activeFilter === 'LEVEL_2' || activeFilter === 'LEVEL_3') && (
              <div className="overflow-x-auto">
                {filteredLeaders().length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No leaders at this level yet</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800/50 text-xs text-slate-400 uppercase">
                      <tr>
                        <th className="text-left px-4 py-3">Leader</th>
                        <th className="text-left px-4 py-3">Contact</th>
                        <th className="text-right px-4 py-3">Active Users</th>
                        <th className="text-right px-4 py-3">Monthly Reward</th>
                        <th className="text-center px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeaders().map((l: any) => (
                        <tr key={l.id} className="border-t border-slate-800/50">
                          <td className="px-4 py-3">
                            <p className="font-bold">{l.full_name}</p>
                            <p className="text-xs text-slate-500 font-mono">{l.referral_code}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">
                            <p>{l.email}</p>
                            <p>{l.phone}</p>
                          </td>
                          <td className="px-4 py-3 text-right font-bold">{l.total_active_users}</td>
                          <td className="px-4 py-3 text-right font-bold text-green-400">
                            KSh {activeFilter === 'LEVEL_1' ? '3,000' : activeFilter === 'LEVEL_2' ? '8,000' : '20,000'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/50 text-green-400">{l.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {(activeFilter === 'ACTIVE_PAYING' || activeFilter === 'MRR') && (
              <div className="overflow-x-auto">
                {filteredCustomers().length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No paying customers yet</p>
                ) : (
                  <>
                    {activeFilter === 'MRR' && (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
                        <p className="text-sm text-green-300">
                          Total MRR from {filteredCustomers().length} paying customer{filteredCustomers().length === 1 ? '' : 's'}:{' '}
                          <span className="font-bold">KSh {filteredCustomers().reduce((sum: number, c: any) => sum + Number(c.subscription_amount || 0), 0).toLocaleString()}</span>
                        </p>
                      </div>
                    )}
                    <table className="w-full text-sm">
                      <thead className="bg-slate-800/50 text-xs text-slate-400 uppercase">
                        <tr>
                          <th className="text-left px-4 py-3">Customer</th>
                          <th className="text-left px-4 py-3">Product</th>
                          <th className="text-left px-4 py-3">Referred By</th>
                          <th className="text-right px-4 py-3">Subscription</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCustomers().map((c: any) => {
                          const leader = leaders.find((l: any) => l.id === c.leader_id)
                          return (
                            <tr key={c.id} className="border-t border-slate-800/50">
                              <td className="px-4 py-3">
                                <p className="font-bold">{c.customer_name}</p>
                                <p className="text-xs text-slate-500">{c.customer_email}</p>
                              </td>
                              <td className="px-4 py-3">{c.product}</td>
                              <td className="px-4 py-3 text-xs text-slate-400">{leader?.full_name || 'Unknown'}</td>
                              <td className="px-4 py-3 text-right font-bold text-green-400">KSh {Number(c.subscription_amount || 0).toLocaleString()}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            )}

            {activeFilter === 'REWARDS_OWED' && (
              <div>
                <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-4 mb-4">
                  <p className="text-sm text-pink-300">
                    Total owed this month: <span className="font-bold">KSh {metrics.totalRewards.toLocaleString()}</span>
                  </p>
                </div>
                <h3 className="text-sm font-bold text-slate-400 uppercase mb-2">Pending Payouts</h3>
                <div className="overflow-x-auto mb-6">
                  {filteredPayouts().length === 0 ? (
                    <p className="text-slate-500 text-center py-4 text-sm">No pending payouts</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-slate-800/50 text-xs text-slate-400 uppercase">
                        <tr>
                          <th className="text-left px-4 py-3">Leader</th>
                          <th className="text-left px-4 py-3">Level</th>
                          <th className="text-right px-4 py-3">Amount</th>
                          <th className="text-left px-4 py-3">Payment Details</th>
                          <th className="text-center px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPayouts().map((p: any) => {
                          const leader = leaders.find((l: any) => l.id === p.leader_id)
                          return (
                            <tr key={p.id} className="border-t border-slate-800/50">
                              <td className="px-4 py-3 font-bold">{leader?.full_name || 'Unknown'}</td>
                              <td className="px-4 py-3 text-xs">Level {p.level_at_payout}</td>
                              <td className="px-4 py-3 text-right font-bold text-pink-400">KSh {p.amount.toLocaleString()}</td>
                              <td className="px-4 py-3 text-xs text-slate-400">{p.payment_details || '—'}</td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/50 text-amber-400">{p.status}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {activeFilter === 'ROI' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <p className="text-xs text-green-400 uppercase font-bold mb-1">Total MRR</p>
                    <p className="text-2xl font-bold text-green-300">KSh {metrics.mrr.toLocaleString()}</p>
                  </div>
                  <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-4">
                    <p className="text-xs text-pink-400 uppercase font-bold mb-1">Rewards Owed</p>
                    <p className="text-2xl font-bold text-pink-300">KSh {metrics.totalRewards.toLocaleString()}</p>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                    <p className="text-xs text-amber-400 uppercase font-bold mb-1">Net Profit</p>
                    <p className="text-2xl font-bold text-amber-300">KSh {(metrics.mrr - metrics.totalRewards).toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-sm text-slate-300">
                    <strong className="text-white">ROI Calculation:</strong> For every KSh 1 in rewards paid out, you earn KSh {metrics.roi} in MRR.
                    {Number(metrics.roi) > 1 ? ' Healthy ROI.' : ' Warning: ROI below 1x — review leader levels.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}