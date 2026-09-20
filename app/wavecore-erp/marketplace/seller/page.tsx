'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Store, Loader2, Package, Tag, TrendingUp, DollarSign, Star, Users,
  ArrowUpRight, Wallet, BarChart3, ShoppingBag, Plus, Eye, RefreshCw,
  AlertTriangle, CheckCircle2, Award, Zap,
} from 'lucide-react'

export default function SellerDashboardPage() {
  const [profile, setProfile] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [listings, setListings] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [orderSummary, setOrderSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [profileRes, walletRes, listingsRes, ordersRes] = await Promise.all([
        fetch('/api/marketplace/seller'),
        fetch('/api/marketplace/wallet'),
        fetch('/api/marketplace/listings?sellerId=self'),
        fetch('/api/marketplace/orders?view=seller'),
      ])
      const profileData = await profileRes.json()
      const walletData = await walletRes.json()
      const listingsData = await listingsRes.json()
      const ordersData = await ordersRes.json()

      setProfile(profileData.profile)
      setWallet(walletData.summary || walletData.wallet || {})
      setListings(listingsData.listings || [])
      setOrders(ordersData.orders || [])
      setOrderSummary(ordersData.summary || {})
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  if (loading) return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
    </div>
  )

  const totalRevenue = wallet?.lifetimeEarnings || 0
  const availableBalance = wallet?.availableBalance || 0
  const pendingBalance = wallet?.pendingBalance || 0
  const lifetimeCommission = wallet?.lifetimeCommission || 0

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/marketplace" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveMarket Seller</span>
          </Link>
          <div className="flex gap-2">
            <Link href="/wavecore-erp/marketplace/seller/wallet" className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold flex items-center gap-1">
              <Wallet className="w-3 h-3" /> Wallet
            </Link>
            <Link href="/wavecore-erp/marketplace/seller/commission" className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold flex items-center gap-1">
              <BarChart3 className="w-3 h-3" /> Earnings
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 lg:p-8">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <p className="text-white/80 text-xs uppercase tracking-widest font-bold mb-1">Seller Dashboard</p>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Store className="w-8 h-8" /> {profile?.storeName || 'My Store'}
              </h1>
              <div className="flex flex-wrap gap-3 mt-3 text-white/80 text-xs">
                {profile?.verification && <span className="px-2 py-1 rounded-full bg-white/20 font-bold">{profile.verification}</span>}
                {profile?.trustScore !== undefined && <span className="flex items-center gap-1"><Award className="w-3 h-3" /> Trust: {profile.trustScore}</span>}
                {profile?.averageRating > 0 && <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {profile.averageRating} ({profile.totalReviews} reviews)</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/wavecore-erp/marketplace/sell" className="px-4 py-3 rounded-xl bg-white text-emerald-700 font-bold flex items-center gap-2 shadow-lg">
                <Plus className="w-4 h-4" /> New Listing
              </Link>
            </div>
          </div>
        </div>

        {error && <div className="p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-lg">
            <DollarSign className="w-6 h-6 mb-2" />
            <p className="text-3xl font-bold">KES {Number(totalRevenue).toLocaleString()}</p>
            <p className="text-xs opacity-90">Lifetime Earnings</p>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg">
            <Wallet className="w-6 h-6 mb-2" />
            <p className="text-3xl font-bold">KES {Number(availableBalance).toLocaleString()}</p>
            <p className="text-xs opacity-90">Available</p>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg">
            <TrendingUp className="w-6 h-6 mb-2" />
            <p className="text-3xl font-bold">KES {Number(pendingBalance).toLocaleString()}</p>
            <p className="text-xs opacity-90">Pending</p>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-600 to-red-800 text-white shadow-lg">
            <BarChart3 className="w-6 h-6 mb-2" />
            <p className="text-3xl font-bold">KES {Number(lifetimeCommission).toLocaleString()}</p>
            <p className="text-xs opacity-90">Commission Paid</p>
          </div>
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
            <Package className="w-5 h-5 text-indigo-500 mb-2" />
            <p className="text-2xl font-bold text-white">{listings.length}</p>
            <p className="text-xs text-neutral-400">Active Listings</p>
          </div>
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
            <ShoppingBag className="w-5 h-5 text-purple-500 mb-2" />
            <p className="text-2xl font-bold text-white">{orderSummary.total || 0}</p>
            <p className="text-xs text-neutral-400">Total Orders</p>
          </div>
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
            <CheckCircle2 className="w-5 h-5 text-green-500 mb-2" />
            <p className="text-2xl font-bold text-white">{orderSummary.delivered || 0}</p>
            <p className="text-xs text-neutral-400">Delivered</p>
          </div>
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mb-2" />
            <p className="text-2xl font-bold text-white">{orderSummary.pending || 0}</p>
            <p className="text-xs text-neutral-400">Pending Orders</p>
          </div>
        </div>

        {/* Two columns: recent orders + recent listings */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="p-5 border-b border-neutral-800 flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wide text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-purple-400" /> Recent Orders
              </h3>
              <Link href="/wavecore-erp/marketplace/orders" className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1">
                View All <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30 text-neutral-500" />
                <p className="text-sm text-neutral-500">No orders yet</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-800">
                {orders.slice(0, 5).map(o => (
                  <Link key={o.id} href={'/wavecore-erp/marketplace/orders/' + o.id} className="p-4 flex justify-between items-center hover:bg-neutral-800/50">
                    <div>
                      <p className="font-mono text-sm text-white font-bold">{o.orderNumber}</p>
                      <p className="text-xs text-neutral-500">{new Date(o.createdAt).toLocaleDateString('en-GB')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-400">KES {Number(o.total).toLocaleString()}</p>
                      <p className="text-[10px] text-neutral-500">{o.status}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="p-5 border-b border-neutral-800 flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wide text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-400" /> My Listings
              </h3>
              <Link href="/wavecore-erp/marketplace/sell" className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1">
                Manage <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            {listings.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-30 text-neutral-500" />
                <p className="text-sm text-neutral-500 mb-3">No listings yet</p>
                <Link href="/wavecore-erp/marketplace/sell" className="inline-block px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold">
                  Create First Listing
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-neutral-800">
                {listings.slice(0, 5).map(l => (
                  <Link key={l.id} href={'/wavecore-erp/marketplace/listing/' + l.id} className="p-4 flex gap-3 hover:bg-neutral-800/50">
                    <div className="w-12 h-12 rounded-lg bg-neutral-800 overflow-hidden flex-shrink-0">
                      {l.images?.[0] ? (
                        <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-neutral-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{l.title}</p>
                      <div className="flex gap-3 text-[10px] text-neutral-500 mt-1">
                        <span>KES {Number(l.price).toLocaleString()}</span>
                        <span>Stock: {l.stock}</span>
                        <span>Views: {l.views || 0}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/wavecore-erp/marketplace/seller/wallet" className="p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 hover:from-emerald-700 hover:to-teal-900 text-white">
            <Wallet className="w-8 h-8 mb-3" />
            <p className="text-lg font-bold">Wallet & Payouts</p>
            <p className="text-xs opacity-90 mt-1">Request payouts to your M-Pesa or bank</p>
          </Link>
          <Link href="/wavecore-erp/marketplace/seller/commission" className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-800 hover:from-indigo-700 hover:to-blue-900 text-white">
            <BarChart3 className="w-8 h-8 mb-3" />
            <p className="text-lg font-bold">Commission Statements</p>
            <p className="text-xs opacity-90 mt-1">See monthly earnings and fees breakdown</p>
          </Link>
          <Link href="/wavecore-erp/marketplace/sell" className="p-5 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-800 hover:from-amber-700 hover:to-orange-900 text-white">
            <Plus className="w-8 h-8 mb-3" />
            <p className="text-lg font-bold">List New Product</p>
            <p className="text-xs opacity-90 mt-1">Reach millions of buyers on WaveMarket</p>
          </Link>
        </div>
      </main>
    </div>
  )
}