'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Key, Plus, Trash2, Loader2, Shield, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Role {
  id: number
  name: string
  description: string
  permissions: string[]
  createdat: string
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({ name: '', description: '', permissions: [] as string[] })

  const permissionOptions = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT']

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/wavecore/roles')
      const data = await res.json()
      setRoles(data.roles || [])
    } catch (err) {
      setError('Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  const addRole = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setFormData({ name: '', description: '', permissions: [] })
        setShowForm(false)
        fetchRoles()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to add role')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const deleteRole = async (id: number) => {
    if (!confirm('Delete this role?')) return
    try {
      await fetch(`/api/wavecore/roles?id=${id}`, { method: 'DELETE' })
      fetchRoles()
    } catch (err) {
      setError('Failed to delete role')
    }
  }

  const togglePermission = (perm: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm]
    }))
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/settings" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Roles & Permissions</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Key className="w-6 h-6 text-purple-500" /> Roles ({roles.length})
          </h1>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2 bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4" /> New Role
          </Button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}

        {showForm && (
          <form onSubmit={addRole} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <div className="space-y-4">
              <input type="text" placeholder="Role Name" required value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border" />
              <input type="text" placeholder="Description" value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border" />
              <div>
                <p className="text-sm font-medium mb-2">Permissions</p>
                <div className="flex flex-wrap gap-2">
                  {permissionOptions.map(perm => (
                    <button key={perm} type="button" onClick={() => togglePermission(perm)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        formData.permissions.includes(perm) 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-neutral-100 dark:bg-neutral-800 text-muted-foreground'
                      }`}>
                      {perm}
                    </button>
                  ))}
                </div>
              </div>
              <Button type="submit" disabled={saving} className="w-full bg-purple-600">
                {saving ? 'Saving...' : 'Create Role'}
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : roles.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No roles defined</p>
          </div>
        ) : (
          <div className="space-y-3">
            {roles.map(role => (
              <div key={role.id} className="bg-white dark:bg-neutral-900 rounded-2xl border p-5 flex justify-between items-center">
                <div>
                  <p className="font-bold">{role.name}</p>
                  <p className="text-sm text-muted-foreground">{role.description || 'No description'}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {role.permissions?.map(perm => (
                      <span key={perm} className="px-2 py-0.5 text-xs rounded bg-purple-50 text-purple-600">{perm}</span>
                    ))}
                  </div>
                </div>
                <button onClick={() => deleteRole(role.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}