'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Key, Shield, Plus, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function RolesPage() {
  const [roles] = useState([
    { name: 'Administrator', permissions: ['All Access'], users: 1 },
    { name: 'Manager', permissions: ['Finance', 'Reports', 'Users'], users: 2 },
    { name: 'Sales', permissions: ['CRM', 'Invoices'], users: 1 },
    { name: 'Viewer', permissions: ['Reports Only'], users: 0 },
  ])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/settings" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Roles & Permissions</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Key className="w-6 h-6 text-purple-500" /> Roles & Permissions</h1>
          <Button className="gap-2 bg-purple-600"><Plus className="w-4 h-4" /> New Role</Button>
        </div>

        <div className="space-y-4">
          {roles.map(role => (
            <div key={role.name} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-purple-500" />
                  <div>
                    <p className="font-bold">{role.name}</p>
                    <p className="text-xs text-muted-foreground">{role.users} users</p>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex flex-wrap gap-2">
                {role.permissions.map(p => (
                  <span key={p} className="px-2 py-1 text-xs bg-purple-50 text-purple-600 rounded-full">{p}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}