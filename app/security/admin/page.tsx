'use client'

import { useState, useEffect, useCallback } from 'react'
import { Shield, Activity, AlertTriangle, Users, Trash2, Key, RefreshCw, Lock, LogOut, Server, Loader2, XCircle, Eye, EyeOff } from 'lucide-react'

export default function SecurityAdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [events, setEvents] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [actionMessage, setActionMessage] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [resettingId, setResettingId] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('users')

  const fetchSecurityData = useCallback(async () => {
    setRefreshing(true)
    try {
      const [eventsRes, usersRes] = await Promise.all([
        fetch('/api/wavecore/security/events'),
        fetch('/api/wavecore/security/users')
      ])
      const eventsData = await eventsRes.json()
      const usersData = await usersRes.json()
      setEvents(eventsData.events || [])
      setUsers(usersData.users || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setActionMessage('❌ Failed to refresh data')
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (authenticated) {
      fetchSecurityData()
    }
  }, [authenticated, fetchSecurityData])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/security/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      if (res.ok) {
        setAuthenticated(true)
      } else {
        setError('Access denied. Invalid credentials.')
      }
    } catch {
      setError('Failed to verify')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Delete user "${userName || userId}"? This will remove ALL their data permanently.`)) return
    
    setDeletingId(userId)
    setActionMessage('')
    
    try {
      const res = await fetch('/api/wavecore/security/users?id=' + userId, { method: 'DELETE' })
      const data = await res.json()
      
      if (data.success) {
        setActionMessage(`✅ User "${data.deletedUser?.email || userId}" deleted successfully`)
        fetchSecurityData()
      } else {
        setActionMessage(`❌ ${data.error || 'Failed to delete user'}`)
      }
    } catch (error) {
      setActionMessage('❌ Network error - failed to delete user')
    } finally {
      setDeletingId('')
    }
  }

  const handleResetPassword = async (userId: string, userName: string) => {
    const newPassword = prompt(`Enter new password for "${userName || 'user'}" (min 8 characters):`)
    if (!newPassword) return
    
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters')
      return
    }
    
    setResettingId(userId)
    setActionMessage('')
    
    try {
      const res = await fetch('/api/wavecore/security/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword })
      })
      const data = await res.json()
      
      if (data.success) {
        setActionMessage(`✅ Password reset for "${data.user?.email || userId}"`)
      } else {
        setActionMessage(`❌ ${data.error || 'Failed to reset password'}`)
      }
    } catch (error) {
      setActionMessage('❌ Network error - failed to reset password')
    } finally {
      setResettingId('')
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 w-full max-w-md border border-slate-700/50 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/20">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Security Command Center</h1>
            <p className="text-slate-400 text-sm mt-2">Authorized personnel only</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter security password"
                className="w-full pl-10 pr-12 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4" /> {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-bold hover:shadow-lg hover:shadow-red-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
              {loading ? 'Verifying...' : 'Access Security Center'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  const criticalCount = events.filter((e: any) => e.severity === 'CRITICAL').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="flex items-center justify-between px-4 lg:px-8 h-16 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-lg shadow-red-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg">Security Command Center</h1>
              <p className="text-xs text-slate-400">IntelliWavve + WaveCore ERP</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchSecurityData} disabled={refreshing}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50">
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </button>
            <button onClick={() => setAuthenticated(false)} className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Action Message */}
        {actionMessage && (
          <div className={`p-4 rounded-xl ${actionMessage.startsWith('✅') ? 'bg-green-500/10 border border-green-500/30 text-green-300' : 'bg-red-500/10 border border-red-500/30 text-red-300'}`}>
            {actionMessage}
          </div>
        )}

        {/* Clickable Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button onClick={() => setActiveTab('events')}
            className={`p-6 rounded-2xl border text-left transition-all ${activeTab === 'events' ? 'bg-slate-800/80 border-blue-500/50' : 'bg-slate-900/50 border-slate-700/50 hover:border-blue-500/30'}`}>
            <Activity className="w-6 h-6 text-blue-400 mb-3" />
            <p className="text-3xl font-bold text-white">{events.length}</p>
            <p className="text-xs text-slate-400 mt-1">Total Events</p>
          </button>
          <button onClick={() => setActiveTab('events')}
            className={`p-6 rounded-2xl border text-left transition-all ${activeTab === 'events' ? 'bg-slate-800/80 border-red-500/50' : 'bg-slate-900/50 border-slate-700/50 hover:border-red-500/30'}`}>
            <AlertTriangle className="w-6 h-6 text-red-500 mb-3" />
            <p className="text-3xl font-bold text-red-400">{criticalCount}</p>
            <p className="text-xs text-slate-400 mt-1">Critical Alerts</p>
          </button>
          <button onClick={() => setActiveTab('users')}
            className={`p-6 rounded-2xl border text-left transition-all ${activeTab === 'users' ? 'bg-slate-800/80 border-purple-500/50' : 'bg-slate-900/50 border-slate-700/50 hover:border-purple-500/30'}`}>
            <Users className="w-6 h-6 text-purple-400 mb-3" />
            <p className="text-3xl font-bold text-purple-400">{users.length}</p>
            <p className="text-xs text-slate-400 mt-1">Users</p>
          </button>
          <button onClick={() => setActiveTab('users')}
            className={`p-6 rounded-2xl border text-left transition-all ${activeTab === 'users' ? 'bg-slate-800/80 border-green-500/50' : 'bg-slate-900/50 border-slate-700/50 hover:border-green-500/30'}`}>
            <Server className="w-6 h-6 text-green-400 mb-3" />
            <p className="text-3xl font-bold text-green-400">0</p>
            <p className="text-xs text-slate-400 mt-1">Active Sessions</p>
          </button>
        </div>

        {/* User Management - shown when users tab active */}
        {activeTab === 'users' && (
          <div className="rounded-2xl bg-slate-900/50 border border-slate-700/50 overflow-hidden">
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
              <h2 className="font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" /> User Management ({users.length})
              </h2>
              <button onClick={fetchSecurityData} disabled={refreshing}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                {refreshing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/50">
                    <th className="text-left p-4 text-xs text-slate-400 font-medium">User</th>
                    <th className="text-left p-4 text-xs text-slate-400 font-medium">Email</th>
                    <th className="text-left p-4 text-xs text-slate-400 font-medium">Created</th>
                    <th className="text-left p-4 text-xs text-slate-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">No users found</td>
                    </tr>
                  ) : (
                    users.map((user: any) => (
                      <tr key={user.id} className="border-t border-slate-700/30 hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 text-sm text-white font-medium">{user.name || 'N/A'}</td>
                        <td className="p-4 text-sm text-slate-300">{user.email}</td>
                        <td className="p-4 text-sm text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleResetPassword(user.id, user.name)}
                              disabled={resettingId === user.id}
                              className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors flex items-center gap-1 text-xs disabled:opacity-50">
                              {resettingId === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Key className="w-3 h-3" />}
                              Reset Password
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              disabled={deletingId === user.id}
                              className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-1 text-xs disabled:opacity-50">
                              {deletingId === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Security Events - shown when events tab active */}
        {activeTab === 'events' && (
          <div className="rounded-2xl bg-slate-900/50 border border-slate-700/50 overflow-hidden">
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
              <h2 className="font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" /> Live Security Events ({events.length})
              </h2>
              <button onClick={fetchSecurityData} disabled={refreshing}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                {refreshing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/50">
                    <th className="text-left p-4 text-xs text-slate-400 font-medium">Time</th>
                    <th className="text-left p-4 text-xs text-slate-400 font-medium">Severity</th>
                    <th className="text-left p-4 text-xs text-slate-400 font-medium">Category</th>
                    <th className="text-left p-4 text-xs text-slate-400 font-medium">IP</th>
                    <th className="text-left p-4 text-xs text-slate-400 font-medium">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">No security events recorded</td>
                    </tr>
                  ) : (
                    events.slice(0, 50).map((event: any) => (
                      <tr key={event.id} className="border-t border-slate-700/30 hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 text-sm text-slate-300">{new Date(event.createdAt).toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            event.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                            event.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                            event.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>{event.severity}</span>
                        </td>
                        <td className="p-4 text-sm text-slate-300">{event.category}</td>
                        <td className="p-4 text-sm text-slate-400">{event.ip || 'N/A'}</td>
                        <td className="p-4 text-sm text-slate-400">{event.riskScore || 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}