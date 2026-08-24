'use client'

import { useState } from 'react'
import { Shield, Activity, AlertTriangle, Users, Trash2, Key, RefreshCw, Lock, LogOut, Server, Globe, Zap } from 'lucide-react'

export default function SecurityAdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [events, setEvents] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])

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
        fetchSecurityData()
      } else {
        setError('Access denied')
      }
    } catch {
      setError('Failed to verify')
    } finally {
      setLoading(false)
    }
  }

  const fetchSecurityData = async () => {
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
      console.error('Failed to fetch')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Delete this user?')) return
    try {
      await fetch('/api/wavecore/security/users?id=' + userId, { method: 'DELETE' })
      fetchSecurityData()
    } catch (error) {
      console.error('Failed to delete')
    }
  }

  const handleResetPassword = async (userId: string) => {
    const newPassword = prompt('Enter new password:')
    if (!newPassword) return
    try {
      await fetch('/api/wavecore/security/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword })
      })
      alert('Password reset successful')
    } catch (error) {
      alert('Failed to reset password')
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
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter security password"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              />
            </div>
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-bold hover:shadow-lg hover:shadow-red-500/20 transition-all disabled:opacity-50">
              {loading ? 'Verifying...' : 'Access Security Center'}
            </button>
          </form>
        </div>
      </div>
    )
  }

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
            <button onClick={fetchSecurityData} className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => setAuthenticated(false)} className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-700/50 backdrop-blur-sm">
            <Activity className="w-6 h-6 text-blue-400 mb-3" />
            <p className="text-3xl font-bold text-white">{events.length}</p>
            <p className="text-xs text-slate-400 mt-1">Total Events</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-700/50 backdrop-blur-sm">
            <AlertTriangle className="w-6 h-6 text-red-500 mb-3" />
            <p className="text-3xl font-bold text-red-400">{events.filter((e: any) => e.severity === 'CRITICAL').length}</p>
            <p className="text-xs text-slate-400 mt-1">Critical Alerts</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-700/50 backdrop-blur-sm">
            <Server className="w-6 h-6 text-green-400 mb-3" />
            <p className="text-3xl font-bold text-green-400">0</p>
            <p className="text-xs text-slate-400 mt-1">Active Sessions</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-700/50 backdrop-blur-sm">
            <Users className="w-6 h-6 text-purple-400 mb-3" />
            <p className="text-3xl font-bold text-purple-400">{users.length}</p>
            <p className="text-xs text-slate-400 mt-1">Users</p>
          </div>
        </div>

        {/* Security Events */}
        <div className="rounded-2xl bg-slate-900/50 border border-slate-700/50 backdrop-blur-sm overflow-hidden">
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" /> Live Security Events
            </h2>
            <button onClick={fetchSecurityData} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Refresh
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
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No security events recorded
                    </td>
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

        {/* User Management */}
        <div className="rounded-2xl bg-slate-900/50 border border-slate-700/50 backdrop-blur-sm overflow-hidden">
          <div className="p-4 border-b border-slate-700/50">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" /> User Management
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800/50">
                  <th className="text-left p-4 text-xs text-slate-400 font-medium">User</th>
                  <th className="text-left p-4 text-xs text-slate-400 font-medium">Email</th>
                  <th className="text-left p-4 text-xs text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user: any) => (
                    <tr key={user.id} className="border-t border-slate-700/30 hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 text-sm text-white">{user.name || 'N/A'}</td>
                      <td className="p-4 text-sm text-slate-300">{user.email}</td>
                      <td className="p-4 flex gap-2">
                        <button onClick={() => handleResetPassword(user.id)} className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors" title="Reset Password">
                          <Key className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteUser(user.id)} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors" title="Delete User">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}