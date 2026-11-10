'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Users, TrendingUp, Loader2, AlertCircle, RefreshCw, Lock, Mail } from 'lucide-react'

interface Follower {
  id: string
  userId: string
  userName: string
  userImage: string | null
  userEmail: string | null
  followedAt: string
}

interface GrowthPoint {
  day: string
  count: number
}

type Period = 'all' | 'week' | 'month'

export default function SellerFollowersPage() {
  const router = useRouter()
  const [followers, setFollowers] = useState<Follower[]>([])
  const [total, setTotal] = useState(0)
  const [growth, setGrowth] = useState<GrowthPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState<Period>('all')

  const loadFollowers = async (p: Period = period) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/marketplace/seller/followers?limit=200&period=' + p, { cache: 'no-store' })
      if (res.status === 401) {
        router.push('/wavecore-erp/auth/login?returnTo=/wavecore-erp/marketplace/seller/followers')
        return
      }
      if (!res.ok) throw new Error('Failed to load')
      const d = await res.json()
      setFollowers(d.followers || [])
      setTotal(d.total || 0)
      setGrowth(d.growth || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load followers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFollowers(period)
  }, [period])

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return mins + 'm ago'
    const hours = Math.floor(mins / 60)
    if (hours < 24) return hours + 'h ago'
    const days = Math.floor(hours / 24)
    if (days < 30) return days + 'd ago'
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const maxGrowth = Math.max(...growth.map(g => g.count), 1)

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Link href="/wavecore-erp/marketplace/seller" className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Seller Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Your Followers</h1>
              <p className="text-sm text-neutral-400">
                {total} follower{total === 1 ? '' : 's'} {period !== 'all' ? '· ' + (period === 'week' ? 'this week' : 'this month') : '· all time'}
              </p>
            </div>
          </div>
          <button
            onClick={() => loadFollowers()}
            disabled={loading}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2 text-red-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* KPI + Growth */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
            <Users className="w-6 h-6 text-cyan-400 mb-2" />
            <p className="text-3xl font-bold">{total}</p>
            <p className="text-xs text-neutral-400 uppercase font-bold">Total Followers</p>
          </div>
          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <p className="text-xs text-neutral-400 uppercase font-bold">Last 7 Days</p>
            </div>
            <div className="flex items-end gap-1 h-16">
              {growth.length === 0 ? (
                <p className="text-sm text-neutral-500">No new followers this week</p>
              ) : (
                growth.map((g, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t"
                      style={{ height: Math.max(4, (g.count / maxGrowth) * 100) + '%' }}
                      title={g.day + ': ' + g.count + ' followers'}
                    />
                    <span className="text-xs text-neutral-500">{g.day}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Privacy note */}
        <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-blue-300">Only you see this list</p>
            <p className="text-blue-200/70 mt-1">
              Follower identities are visible only to you. Buyers see the total follower count on your listings — they cannot see who is following you.
            </p>
          </div>
        </div>

        {/* Period filter */}
        <div className="flex gap-2 mb-4">
          {(['all', 'week', 'month'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={'px-4 py-2 rounded-lg text-sm font-bold transition-colors ' + (period === p ? 'bg-cyan-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700')}
            >
              {p === 'all' ? 'All Time' : p === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>

        {/* Followers list */}
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-800">
            <h2 className="font-bold">Follower List ({followers.length})</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
            </div>
          ) : followers.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 mx-auto mb-3 text-neutral-700" />
              <p className="text-neutral-400">
                {period === 'all' ? 'No followers yet. Share your listings to attract your first follower!' : 'No followers in this period.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800">
              {followers.map(f => (
                <div key={f.id} className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {f.userImage ? (
                      <Image src={f.userImage} alt={f.userName} width={40} height={40} className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-white font-bold">{f.userName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{f.userName}</p>
                    {f.userEmail && (
                      <p className="text-xs text-neutral-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {f.userEmail}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-neutral-500 flex-shrink-0">Followed {formatDate(f.followedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}