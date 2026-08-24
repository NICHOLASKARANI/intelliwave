'use client'

import { useState } from 'react'
import { Shield, Activity, Users, Trash2, RefreshCw, Lock, LogOut } from 'lucide-react'

export default function SecurityAdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [events, setEvents] = useState([])
  const [users, setUsers] = useState([])

  const handleLogin = async (e) => {
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
    } catch (err) {
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

  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete this user?')) return
    try {
      await fetch('/api/wavecore/security/users?id=' + userId, { method: 'DELETE' })
      fetchSecurityData()
    } catch (error) {
      console.error('Failed to delete')
    }
  }

  if (!authenticated) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '32px', borderRadius: '24px', maxWidth: '400px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Shield style={{ width: '48px', height: '48px', color: '#ef4444', margin: '0 auto' }} />
            <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', marginTop: '12px' }}>Security Command Center</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Authorized personnel only</p>
          </div>
          
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter security password"
              style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', marginBottom: '12px' }}
            />
            
            {error && (
              <p style={{ color: '#fca5a5', fontSize: '14px', marginBottom: '12px' }}>{error}</p>
            )}
            
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#dc2626', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
              {loading ? 'Verifying...' : 'Access Security Center'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      <header style={{ background: '#1e293b', padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Shield style={{ width: '32px', height: '32px', color: '#ef4444' }} />
            <div>
              <h1 style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>Security Command Center</h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>IntelliWavve ERP</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={fetchSecurityData} style={{ padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
              <RefreshCw style={{ width: '16px', height: '16px', color: 'white' }} />
            </button>
            <button onClick={() => setAuthenticated(false)} style={{ padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
              <LogOut style={{ width: '16px', height: '16px', color: 'white' }} />
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Activity style={{ width: '24px', height: '24px', color: '#60a5fa', marginBottom: '8px' }} />
            <p style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>{events.length}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Total Events</p>
          </div>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Users style={{ width: '24px', height: '24px', color: '#a78bfa', marginBottom: '8px' }} />
            <p style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>{users.length}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Users</p>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px', overflow: 'hidden' }}>
          <h2 style={{ color: 'white', fontWeight: 'bold', padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Security Events</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Time</th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Severity</th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Category</th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>IP</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 20).map((event) => (
                <tr key={event.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>{new Date(event.createdAt).toLocaleString()}</td>
                  <td style={{ padding: '12px', color: '#f87171', fontSize: '14px' }}>{event.severity}</td>
                  <td style={{ padding: '12px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>{event.category}</td>
                  <td style={{ padding: '12px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>{event.ip || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          <h2 style={{ color: 'white', fontWeight: 'bold', padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>User Management</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>User</th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px', color: 'white', fontSize: '14px' }}>{user.name || 'N/A'}</td>
                  <td style={{ padding: '12px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>{user.email}</td>
                  <td style={{ padding: '12px' }}>
                    <button onClick={() => handleDeleteUser(user.id)} style={{ padding: '8px', background: 'rgba(239,68,68,0.2)', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                      <Trash2 style={{ width: '16px', height: '16px', color: '#f87171' }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}