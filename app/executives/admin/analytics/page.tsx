'use client'
import { useState, useEffect } from 'react'
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react'

export default function AnalyticsDashboard() {
  const [password, setPassword] = useState('')
  const [auth, setAuth] = useState(false)
  const [data, setData] = useState<any>(null)

  const loadData = async () => {
    const res = await fetch('/api/executives/admin/analytics', {
      headers: { 'x-ceo-password': password }
    })
    if (res.ok) {
      setData(await res.json())
      setAuth(true)
    } else {
      alert('Invalid password')
    }
  }

  if (!auth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 w-full max-w-sm">
          <h1 className="text-white font-bold mb-4">Analytics Access</h1>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 bg-slate-800 text-white rounded-xl mb-4" placeholder="CEO Password" />
          <button onClick={loadData} className="w-full py-2 bg-amber-500 text-slate-900 font-bold rounded-xl">Access</button>
        </div>
      </div>
    )
  }

  const { metrics, levels } = data

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Executive Growth Analytics</h1>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <Users className="w-8 h-8 text-blue-400 mb-4" />
          <p className="text-3xl font-bold">{metrics.activeCustomers}</p>
          <p className="text-sm text-slate-400">Active Paying Users</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <DollarSign className="w-8 h-8 text-green-400 mb-4" />
          <p className="text-3xl font-bold">KSh {metrics.mrr.toLocaleString()}</p>
          <p className="text-sm text-slate-400">Estimated MRR</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <Activity className="w-8 h-8 text-pink-400 mb-4" />
          <p className="text-3xl font-bold">KSh {metrics.totalRewards.toLocaleString()}</p>
          <p className="text-sm text-slate-400">Current Rewards Owed (Monthly)</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <TrendingUp className="w-8 h-8 text-amber-400 mb-4" />
          <p className="text-3xl font-bold">{metrics.roi}x</p>
          <p className="text-sm text-slate-400">Revenue to Reward ROI</p>
        </div>
      </div>

      {/* Leader Levels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl border-t-4 border-t-amber-500">
          <h3 className="text-lg font-bold mb-2">Level 1 Leaders</h3>
          <p className="text-4xl font-extrabold">{levels.l1_count}</p>
          <p className="text-xs text-slate-500 mt-2">30+ users (KSh 3k reward)</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl border-t-4 border-t-amber-600">
          <h3 className="text-lg font-bold mb-2">Level 2 Leaders</h3>
          <p className="text-4xl font-extrabold">{levels.l2_count}</p>
          <p className="text-xs text-slate-500 mt-2">60+ users (KSh 8k reward)</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl border-t-4 border-t-amber-700">
          <h3 className="text-lg font-bold mb-1">Level 3 Leaders</h3>
          <p className="text-4xl font-extrabold">{levels.l3_count}</p>
          <p className="text-xs text-slate-500 mt-2">100+ users (KSh 20k reward)</p>
        </div>
      </div>
    </div>
  )
}