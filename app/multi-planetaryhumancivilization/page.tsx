'use client'

import { useEffect, useState } from 'react'
import { Shield, Lock, Loader2, X, Crown, BarChart3, Zap, ShoppingCart, Store, AlertTriangle, Rocket } from 'lucide-react'

const TABS = [
  { id: 'executives', label: 'Executives',  icon: Crown,        url: '/executives/admin' },
  { id: 'analytics',  label: 'Analytics',   icon: BarChart3,    url: '/executives/admin/analytics' },
  { id: 'erp',        label: 'ERP',         icon: Zap,          url: '/wavecore-erp/admin/marketplace-moderation' },
  { id: 'shop',       label: 'Shop',        icon: Store,        url: '/shop/admin' },
  { id: 'security',   label: 'Security',    icon: AlertTriangle, url: '/security/admin' },
] as const

type TabId = typeof TABS[number]['id']

export default function NuclearCommandCenterPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('executives')
  const [masterPassword, setMasterPassword] = useState<string>('')

  // Restore session on mount — cookie exists, but we need the password in memory for iframes
  useEffect(() => {
    // We can't recover the password from the HttpOnly cookie.
    // If the cookie is valid but we lost the password (page refresh), re-ask.
    // The shell stores password in sessionStorage for convenience within the tab.
    const stored = sessionStorage.getItem('nuclear_pwd')
    if (stored) {
      setMasterPassword(stored)
      setAuthenticated(true)
    }
  }, [])

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/nuclear/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setMasterPassword(data.masterPassword)
        setAuthenticated(true)
        sessionStorage.setItem('nuclear_pwd', data.masterPassword)
      } else {
        setError(data.error || 'Access denied')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleLock = async () => {
    sessionStorage.removeItem('nuclear_pwd')
    document.cookie = 'nuclear_session=; path=/; max-age=0'
    setAuthenticated(false)
    setMasterPassword('')
    setPassword('')
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/40">
              <Rocket className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300 mb-2">
              Nuclear Command Center
            </h1>
            <p className="text-slate-400 text-sm">IntelliWavve Master Control</p>
            <p className="text-slate-500 text-xs mt-1">WaveCore ERP · WaveMarket · Wavve SI · Shop · Executives</p>
          </div>

          <form onSubmit={handleUnlock} className="p-8 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-2xl">
            <label className="text-xs uppercase tracking-wide text-slate-400 font-bold mb-2 block">Nuclear Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="Enter master password"
                autoFocus
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            {error && (
              <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full mt-4 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:shadow-2xl hover:shadow-indigo-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
              {loading ? 'Verifying...' : 'Unlock Command Center'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-600 mt-6">
            Authorized personnel only · All access is logged
          </p>
        </div>
      </div>
    )
  }

  const activeTabObj = TABS.find(t => t.id === activeTab)!
  const iframeUrl = masterPassword
    ? `${activeTabObj.url}?nuclear=${encodeURIComponent(masterPassword)}`
    : activeTabObj.url

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900/95 backdrop-blur border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Nuclear Command Center</p>
              <p className="text-[10px] text-slate-500">IntelliWavve Master Control</p>
            </div>
          </div>
          <button
            onClick={handleLock}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-900/50 text-slate-300 hover:text-red-300 text-xs font-bold transition"
          >
            <Lock className="w-3.5 h-3.5" /> Lock
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="bg-slate-900/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition ${
                  active
                    ? 'border-indigo-500 text-indigo-300 bg-slate-800/50'
                    : 'border-transparent text-slate-500 hover:text-white hover:bg-slate-800/30'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Content — iframe */}
      <main className="flex-1 bg-white">
        <iframe
          key={iframeUrl}
          src={iframeUrl}
          className="w-full h-full border-0"
          style={{ minHeight: 'calc(100vh - 106px)' }}
          title={activeTabObj.label}
        />
      </main>
    </div>
  )
}