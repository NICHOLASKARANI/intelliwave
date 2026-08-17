'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Users, Plus, Search, Trash2, Edit3, Shield, Mail, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UsersPage() {
  const [users, setUsers] = useState([
    { id: '1', name: 'Admin User', email: 'admin@wavecore.com', role: 'Administrator', status: 'Active' },
    { id: '2', name: 'Finance Manager', email: 'finance@wavecore.com', role: 'Manager', status: 'Active' },
    { id: '3', name: 'Sales Rep', email: 'sales@wavecore.com', role: 'Sales', status: 'Inactive' },
  ])
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'User' })

  const handleAdd = () => {
    if (!newUser.name || !newUser.email) return
    setUsers([...users, { id: Date.now().toString(), ...newUser, status: 'Active' }])
    setShowAdd(false)
    setNewUser({ name: '', email: '', role: 'User' })
  }

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()))

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
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-green-500" /> User Management</h1>
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-green-600"><Plus className="w-4 h-4" /> Add User</Button>
        </div>

        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-6 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <input type="text" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} className="px-4 py-2.5 rounded-xl border" placeholder="Name" />
              <input type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="px-4 py-2.5 rounded-xl border" placeholder="Email" />
              <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})} className="px-4 py-2.5 rounded-xl border">
                <option>Administrator</option>
                <option>Manager</option>
                <option>Sales</option>
                <option>User</option>
              </select>
            </div>
            <Button onClick={handleAdd}>Add User</Button>
          </div>
        )}

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl border text-sm w-full" placeholder="Search users..." />
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
          {filtered.map(u => (
            <div key={u.id} className="flex items-center justify-between p-4 border-b hover:bg-neutral-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-full">{u.role}</span>
                {u.status === 'Active' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                <button className="text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}