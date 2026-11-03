'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Settings, Building2, Mail, Phone, MapPin, Globe, Shield, Lock, LogOut, AlertCircle } from 'lucide-react'

interface SessionData {
  authenticated: boolean
  user?: { id: string; name: string; email: string; role: string }
  organization?: { id: string; name: string; email?: string; phone?: string; address?: string; currency?: string; timezone?: string }
  subscriptionStatus?: string | null
  subscribed?: boolean
  subscriptionEndDate?: string | null
  daysLeft?: number | null
}

export default function SettingsPage() {
  const [data, setData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/wavecore/auth/session', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) {
          window.location.href = 'https://www.intelliwavve.com/wavecore-erp/auth/login?returnTo=/wavve-si/dashboard/settings'
          return
        }
        setData(d)
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  if (error || !data?.user) {
    return <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-300"><AlertCircle className="w-6 h-6 mb-2" /><p>{error || 'Failed to load settings'}</p></div>
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-slate-500/10 flex items-center justify-center">
          <Settings className="w-6 h-6 text-slate-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-slate-400">Manage your account and organization</p>
        </div>
      </div>

      {/* User Profile */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-4">Your Profile</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
              {data.user.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="text-white font-medium">{data.user.name}</p>
              <p className="text-xs text-slate-400">{data.user.role}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold">Email</label>
              <p className="text-sm text-white flex items-center gap-2 mt-1"><Mail className="w-4 h-4 text-slate-500" /> {data.user.email}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold">User ID</label>
              <p className="text-sm text-white font-mono mt-1">{data.user.id.slice(0, 12)}...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Organization */}
      {data.organization && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">Organization</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold">Name</label>
              <p className="text-sm text-white flex items-center gap-2 mt-1"><Building2 className="w-4 h-4 text-slate-500" /> {data.organization.name}</p>
            </div>
            {data.organization.email && (
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">Contact Email</label>
                <p className="text-sm text-white flex items-center gap-2 mt-1"><Mail className="w-4 h-4 text-slate-500" /> {data.organization.email}</p>
              </div>
            )}
            {data.organization.phone && (
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">Phone</label>
                <p className="text-sm text-white flex items-center gap-2 mt-1"><Phone className="w-4 h-4 text-slate-500" /> {data.organization.phone}</p>
              </div>
            )}
            {data.organization.address && (
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">Address</label>
                <p className="text-sm text-white flex items-center gap-2 mt-1"><MapPin className="w-4 h-4 text-slate-500" /> {data.organization.address}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">Currency</label>
                <p className="text-sm text-white mt-1">{data.organization.currency || 'KES'}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">Timezone</label>
                <p className="text-sm text-white mt-1">{data.organization.timezone || 'Africa/Nairobi'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-400" /> Subscription
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Status</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-lg ${data.subscribed ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {data.subscribed ? 'ACTIVE' : data.subscriptionStatus || 'INACTIVE'}
            </span>
          </div>
          {data.subscriptionEndDate && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Renews</span>
              <span className="text-sm text-white">{new Date(data.subscriptionEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            </div>
          )}
          {data.daysLeft !== null && data.daysLeft !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Days Remaining</span>
              <span className="text-sm font-bold text-white">{data.daysLeft} days</span>
            </div>
          )}
          <Link href="/wavve-si/dashboard/billing" className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm transition-colors">
            Manage Subscription
          </Link>
        </div>
      </div>

      {/* Security & Account */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-amber-400" /> Security & Account
        </h2>
        <div className="space-y-2">
          <a href="https://www.intelliwavve.com/wavecore-erp/auth/forgot-password" className="flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
            <span className="text-sm text-white">Change Password</span>
            <span className="text-xs text-slate-400">Secure link →</span>
          </a>
          <a href="https://www.intelliwavve.com/wavecore-erp/settings/security" className="flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
            <span className="text-sm text-white">Security Settings</span>
            <span className="text-xs text-slate-400">Manage sessions →</span>
          </a>
          <a href="https://www.intelliwavve.com/wavecore-erp/settings" className="flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
            <span className="text-sm text-white">Advanced Settings</span>
            <span className="text-xs text-slate-400">WaveCore ERP →</span>
          </a>
        </div>
      </div>

      {/* Sign Out */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <LogOut className="w-5 h-5 text-red-400" /> Sign Out
        </h2>
        <p className="text-sm text-slate-400 mb-3">Sign out of your Wavve SI account on this device.</p>
        <a href="https://www.intelliwavve.com/api/wavecore/auth/logout" className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-sm transition-colors">
          <LogOut className="w-4 h-4" /> Sign Out
        </a>
      </div>
    </div>
  )
}