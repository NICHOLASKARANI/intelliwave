'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Users, Plus, Trash2, Loader2, Search, Mail, Shield, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({ name: '', email: '', role: 'USER' })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/wavecore/users')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (err) {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setFormData({ name: '', email: '', role: 'USER' })
        setShowForm(false)
        fetchUsers()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to add user')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const deleteUser = async (id: string) => {
    if (!confirm('Delete this user?')) return
    try {
      await fetch(`/api/wavecore/users?id=${id}`, { method: 'DELETE' })
      fetchUsers()
    } catch (err) {
      setError('Failed to delete user')
    }
  }

  const filtered = users.filter(u => 
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/settings" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">User Management</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-green-500" /> Users ({users.length})
          </h1>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2 bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4" /> Add User
          </Button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}

        {showForm && (
          <form onSubmit={addUser} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Full Name" required value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="px-4 py-2 rounded-xl border" />
              <input type="email" placeholder="Email" required value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="px-4 py-2 rounded-xl border" />
              <select value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="px-4 py-2 rounded-xl border">
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="ACCOUNTANT">Accountant</option>
              </select>
              <Button type="submit" disabled={saving} className="bg-green-600">
                {saving ? 'Saving...' : 'Save User'}
              </Button>
            </div>
          </form>
        )}

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search users..." />
        </div>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No users found</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  <th className="text-left p-4 text-sm">Name</th>
                  <th className="text-left p-4 text-sm">Email</th>
                  <th className="text-left p-4 text-sm">Role</th>
                  <th className="text-left p-4 text-sm">Status</th>
                  <th className="text-left p-4 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user.id} className="border-t">
                    <td className="p-4 font-medium">{user.name}</td>
                    <td className="p-4 flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" />{user.email}</td>
                    <td className="p-4"><span className="px-2 py-1 text-xs rounded-full bg-purple-50 text-purple-600">{user.role}</span></td>
                    <td className="p-4"><span className={`inline-flex items-center gap-1 text-xs ${user.isActive ? 'text-green-600' : 'text-red-600'}`}><CheckCircle className="w-3 h-3" />{user.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="p-4"><button onClick={() => deleteUser(user.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}