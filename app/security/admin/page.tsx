'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Shield, Activity, AlertTriangle, XCircle, CheckCircle,
  Users, Trash2, Key, LogOut, RefreshCw, Search,
  Globe, Lock, Eye, EyeOff, Loader2, Download,
  Filter, Clock, Server, Database, Zap
} from 'lucide-react'

const ADMIN_PASSWORD = 'Sultan12@#%(*nmdsafkjl&&*(GGVVDSKarani'

export default function SecurityAdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalEvents: 0,
    criticalEvents: 0,
    blockedRequests: 0,
    activeSessions: 0,
    suspiciousUsers: 0
  })

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        setAuthenticated(true)
        fetchSecurityData()
      } else {
        setError('Access denied. Invalid credentials.')
      }
      setLoading(false)
    }, 500)
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
      
      const criticalCount = (eventsData.events || []).filter((e: any) => e.severity === 'CRITICAL').length
      setStats({
        totalEvents: (eventsData.events || []).length,
        criticalEvents: criticalCount,
        blockedRequests: (eventsData.events || []).filter((e: any) => e.action === 'BLOCKED' || e.action === 'RATE_LIMIT_EXCEEDED').length,
        activeSessions: 0,
        suspiciousUsers: (usersData.users || []).filter((u: any) => u.riskScore > 50).length
      })
    } catch (error) {
      console.error('Failed to fetch security data')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Delete this user? This action cannot be undone.')) return
    try {
      await fetch(`/api/wavecore/security/users?id=${userId}`, { method: 'DELETE' })
      fetchSecurityData()
    } catch (error) {
      console.error('Failed to delete user')
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

  const handleRevokeSession = async (userId: string) => {
    if (!confirm('Revoke all sessions for this user?')) return
    try {
      await fetch(`/api/wavecore/security/sessions?userId=${userId}`, { method: 'DELETE' })
      alert('Sessions revoked')
    } catch (error) {
      alert('Failed to revoke sessions')
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 w-full max-w-md border border-white/20">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Security Command Center</h1>
            <p className="text-white/60 text-sm mt-2">Authorized personnel only</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter security password"
                className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {error && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4" /> {error}
              </div>
            )}
            
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
              Access Security Center
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-red-500" />
            <div>
              <h1 className="font-bold text-white text-lg">Security Command Center</h1>
              <p className="text-xs text-white/50">IntelliWavve + WaveCore ERP</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchSecurityData} className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => setAuthenticated(false)} className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <Activity className="w-6 h-6 text-blue-400 mb-2" />
            <p className="text-2xl font-bold text-white">{stats.totalEvents}</p>
            <p className="text-xs text-white/50">Total Events</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <AlertTriangle className="w-6 h-6 text-red-500 mb-2" />
            <p className="text-2xl font-bold text-red-400">{stats.criticalEvents}</p>
            <p className="text-xs text-white/50">Critical Alerts</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <XCircle className="w-6 h-6 text-orange-500 mb-2" />
            <p className="text-2xl font-bold text-orange-400">{stats.blockedRequests}</p>
            <p className="text-xs text-white/50">Blocked Requests</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <Users className="w-6 h-6 text-purple-400 mb-2" />
            <p className="text-2xl font-bold text-purple-400">{stats.suspiciousUsers}</p>
            <p className="text-xs text-white/50">Suspicious Users</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <Server className="w-6 h-6 text-green-400 mb-2" />
            <p className="text-2xl font-bold text-green-400">{stats.activeSessions}</p>
            <p className="text-xs text-white/50">Active Sessions</p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" /> Live Security Events
          </h2>
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left p-4 text-xs text-white/50">Time</th>
                  <th className="text-left p-4 text-xs text-white/50">Severity</th>
                  <th className="text-left p-4 text-xs text-white/50">Category</th>
                  <th className="text-left p-4 text-xs text-white/50">Action</th>
                  <th className="text-left p-4 text-xs text-white/50">IP</th>
                  <th className="text-left p-4 text-xs text-white/50">Risk</th>
                </tr>
              </thead>
              <tbody>
                {(events || []).slice(0, 50).map((event: any) => (
                  <tr key={event.id} className="border-t border-white/5">
                    <td className="p-4 text-sm text-white/70">{new Date(event.createdAt).toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        event.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                        event.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                        event.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>{event.severity}</span>
                    </td>
                    <td className="p-4 text-sm text-white/70">{event.category}</td>
                    <td className="p-4 text-sm text-white/70">{event.action}</td>
                    <td className="p-4 text-sm text-white/70">{event.ip || 'N/A'}</td>
                    <td className="p-4 text-sm text-white/70">{event.riskScore || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" /> User Management
          </h2>
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left p-4 text-xs text-white/50">User</th>
                  <th className="text-left p-4 text-xs text-white/50">Email</th>
                  <th className="text-left p-4 text-xs text-white/50">Risk</th>
                  <th className="text-left p-4 text-xs text-white/50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(users || []).map((user: any) => (
                  <tr key={user.id} className="border-t border-white/5">
                    <td className="p-4 text-sm text-white">{user.name || 'N/A'}</td>
                    <td className="p-4 text-sm text-white/70">{user.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-lg text-xs ${
                        (user.riskScore || 0) > 50 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                      }}>{user.riskScore || 0}</span>
                    </td>
                    <td className="p-4 flex gap-2">
                      <button onClick={() => handleResetPassword(user.id)} className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">
                        <Key className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleRevokeSession(user.id)} className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteUser(user.id)} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}