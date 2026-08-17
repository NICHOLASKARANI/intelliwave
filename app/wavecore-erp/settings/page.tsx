'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Settings, User, Lock, Bell, Shield, CreditCard, Users, Building2,
  Globe, Palette, Key, Mail, Save, ChevronRight, CheckCircle,
  Percent, Hash, Coins, Webhook, Languages, FileText, Activity,
  Database, Zap, Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)

  const settingsModules = [
    { label: 'General Settings', href: '/wavecore-erp/settings/general', icon: Settings, desc: 'Company info & preferences', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
    { label: 'User Management', href: '/wavecore-erp/settings/users', icon: Users, desc: 'Users, roles & access', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
    { label: 'Roles & Permissions', href: '/wavecore-erp/settings/roles', icon: Key, desc: 'Role-based access control', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
    { label: 'Security', href: '/wavecore-erp/settings/security', icon: Shield, desc: 'Password policies & 2FA', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950' },
    { label: 'Tax Settings', href: '/wavecore-erp/settings/taxes', icon: Percent, desc: 'Tax rates & configurations', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
    { label: 'Numbering', href: '/wavecore-erp/settings/numbering', icon: Hash, desc: 'Document numbering rules', color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950' },
    { label: 'Currency', href: '/wavecore-erp/settings/currency', icon: Coins, desc: 'Multi-currency support', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950' },
    { label: 'Email Templates', href: '/wavecore-erp/settings/email', icon: Mail, desc: 'Notification templates', color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-950' },
    { label: 'Integrations', href: '/wavecore-erp/settings/integrations', icon: Webhook, desc: 'API keys & connections', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950' },
    { label: 'Localization', href: '/wavecore-erp/settings/localization', icon: Languages, desc: 'Language, timezone, date', color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-950' },
    { label: 'Audit Logs', href: '/wavecore-erp/settings/audit', icon: FileText, desc: 'System activity tracking', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">System Settings</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-6 lg:p-8 mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Settings className="w-8 h-8" /> System Settings
          </h1>
          <p className="text-white/80 text-sm">Manage your organization, users, security, and preferences</p>
        </div>

        {/* Settings Modules Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {settingsModules.map(module => {
            const Icon = module.icon
            return (
              <Link key={module.label} href={module.href}
                className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:border-blue-300 hover:shadow-lg transition-all group">
                <div className={`w-12 h-12 rounded-xl ${module.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${module.color}`} />
                </div>
                <p className="font-bold text-sm">{module.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{module.desc}</p>
                <ChevronRight className="w-4 h-4 text-muted-foreground mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
            <Database className="w-6 h-6 text-blue-500 mb-3" />
            <h3 className="font-bold mb-2">Data Management</h3>
            <p className="text-xs text-muted-foreground mb-3">Export or backup your ERP data</p>
            <Button variant="outline" size="sm" className="gap-1"><Download className="w-3 h-3" /> Export Data</Button>
          </div>
          <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
            <Activity className="w-6 h-6 text-green-500 mb-3" />
            <h3 className="font-bold mb-2">System Health</h3>
            <p className="text-xs text-muted-foreground mb-3">All systems operational</p>
            <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle className="w-3 h-3" /> 99.9% Uptime</span>
          </div>
          <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
            <Zap className="w-6 h-6 text-amber-500 mb-3" />
            <h3 className="font-bold mb-2">Quick Setup</h3>
            <p className="text-xs text-muted-foreground mb-3">Complete your ERP configuration</p>
            <span className="text-xs text-amber-600">3 of 11 modules configured</span>
          </div>
        </div>
      </main>
    </div>
  )
}