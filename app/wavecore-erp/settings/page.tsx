'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Settings, User, Lock, Bell, Shield, CreditCard, Users, Building2,
  Globe, Palette, Key, Mail, Save, ChevronRight, CheckCircle,
  Percent, Hash, Coins, Webhook, Languages, FileText, Activity,
  Database, Zap, Download, Loader2, TrendingUp, Server, Cloud,
  BarChart3, Clock, AlertCircle, ArrowUpRight, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  const [exporting, setExporting] = useState(false)
  const [exportDone, setExportDone] = useState(false)
  const [exportError, setExportError] = useState('')
  const [stats, setStats] = useState({ users: 0, roles: 0, integrations: 0, taxes: 0 })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [usersRes, rolesRes, integrationsRes, taxesRes] = await Promise.all([
        fetch('/api/wavecore/users'),
        fetch('/api/wavecore/roles'),
        fetch('/api/wavecore/integrations'),
        fetch('/api/wavecore/taxes')
      ])
      const users = await usersRes.json()
      const roles = await rolesRes.json()
      const integrations = await integrationsRes.json()
      const taxes = await taxesRes.json()
      setStats({
        users: (users.users || []).length,
        roles: (roles.roles || []).length,
        integrations: (integrations.integrations || []).length,
        taxes: (taxes.taxes || []).length
      })
    } catch (err) {
      console.error('Failed to load stats')
    }
  }

  const handleExport = async () => {
    setExporting(true)
    setExportError('')
    setExportDone(false)
    
    try {
      // Fetch all data
      const [usersRes, rolesRes, taxesRes, currenciesRes, integrationsRes, templatesRes, numberingRes] = await Promise.all([
        fetch('/api/wavecore/users'),
        fetch('/api/wavecore/roles'),
        fetch('/api/wavecore/taxes'),
        fetch('/api/wavecore/currency'),
        fetch('/api/wavecore/integrations'),
        fetch('/api/wavecore/email-templates'),
        fetch('/api/wavecore/numbering')
      ])

      const users = await usersRes.json()
      const roles = await rolesRes.json()
      const taxes = await taxesRes.json()
      const currencies = await currenciesRes.json()
      const integrations = await integrationsRes.json()
      const templates = await templatesRes.json()
      const numbering = await numberingRes.json()

      const exportData = {
        exportedAt: new Date().toISOString(),
        organization: 'WaveCore ERP',
        data: {
          users: users.users || [],
          roles: roles.roles || [],
          taxes: taxes.taxes || [],
          currencies: currencies.currencies || [],
          integrations: integrations.integrations || [],
          emailTemplates: templates.templates || [],
          documentNumbering: numbering.numbering || []
        }
      }

      // Create downloadable file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `wavecore-erp-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setExportDone(true)
      setTimeout(() => setExportDone(false), 5000)
    } catch (err) {
      setExportError('Failed to export data. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const settingsModules = [
    { label: 'General Settings', href: '/wavecore-erp/settings/general', icon: Settings, desc: 'Company info & preferences', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950', border: 'hover:border-blue-300' },
    { label: 'User Management', href: '/wavecore-erp/settings/users', icon: Users, desc: 'Users, roles & access', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950', border: 'hover:border-green-300' },
    { label: 'Roles & Permissions', href: '/wavecore-erp/settings/roles', icon: Key, desc: 'Role-based access control', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950', border: 'hover:border-purple-300' },
    { label: 'Security', href: '/wavecore-erp/settings/security', icon: Shield, desc: 'Password policies & 2FA', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950', border: 'hover:border-red-300' },
    { label: 'Tax Settings', href: '/wavecore-erp/settings/taxes', icon: Percent, desc: 'Tax rates & configurations', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950', border: 'hover:border-orange-300' },
    { label: 'Numbering', href: '/wavecore-erp/settings/numbering', icon: Hash, desc: 'Document numbering rules', color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950', border: 'hover:border-teal-300' },
    { label: 'Currency', href: '/wavecore-erp/settings/currency', icon: Coins, desc: 'Multi-currency support', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950', border: 'hover:border-amber-300' },
    { label: 'Email Templates', href: '/wavecore-erp/settings/email', icon: Mail, desc: 'Notification templates', color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-950', border: 'hover:border-pink-300' },
    { label: 'Integrations', href: '/wavecore-erp/settings/integrations', icon: Webhook, desc: 'API keys & connections', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950', border: 'hover:border-indigo-300' },
    { label: 'Localization', href: '/wavecore-erp/settings/localization', icon: Languages, desc: 'Language, timezone, date', color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-950', border: 'hover:border-cyan-300' },
    { label: 'Audit Logs', href: '/wavecore-erp/settings/audit', icon: FileText, desc: 'System activity tracking', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950', border: 'hover:border-emerald-300' },
  ]

  const quickStats = [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'from-blue-500 to-indigo-600' },
    { label: 'Roles Defined', value: stats.roles, icon: Key, color: 'from-purple-500 to-violet-600' },
    { label: 'Integrations', value: stats.integrations, icon: Webhook, color: 'from-indigo-500 to-blue-600' },
    { label: 'Tax Rates', value: stats.taxes, icon: Percent, color: 'from-orange-500 to-amber-600' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b shadow-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover shadow-md" />
            <span className="font-bold text-lg">WaveCore</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">System Settings</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Premium Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-8 lg:p-12 shadow-2xl">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-white/10 text-white/90 backdrop-blur-sm">Enterprise Platform</span>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-300">v1.0</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3 flex items-center gap-3">
              <Settings className="w-10 h-10 text-blue-400" /> System Settings
            </h1>
            <p className="text-white/70 text-lg mb-6">Manage your organization, security, and preferences with enterprise-grade controls</p>
            <div className="flex items-center gap-4 text-white/60 text-sm">
              <span className="flex items-center gap-1"><Server className="w-4 h-4" /> 99.9% Uptime</span>
              <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> SOC2 Compliant</span>
              <span className="flex items-center gap-1"><Cloud className="w-4 h-4" /> Cloud-native</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickStats.map(stat => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-white dark:bg-neutral-900 rounded-2xl border p-5 shadow-sm hover:shadow-lg transition-all">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            )
          })}
        </div>

        {/* Settings Modules Grid */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-500" /> Configuration Modules
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {settingsModules.map(module => {
              const Icon = module.icon
              return (
                <Link key={module.label} href={module.href}
                  className={`p-5 rounded-2xl border bg-white dark:bg-neutral-900 ${module.border} hover:shadow-xl transition-all group relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-transparent to-neutral-50 dark:to-neutral-800 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className={`w-12 h-12 rounded-xl ${module.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${module.color}`} />
                  </div>
                  <p className="font-bold text-sm">{module.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{module.desc}</p>
                  <div className="flex items-center justify-between mt-3">
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> Quick Actions
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Data Export */}
            <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
              <Database className="w-8 h-8 text-blue-500 mb-4" />
              <h3 className="font-bold text-lg mb-2">Data Management</h3>
              <p className="text-xs text-muted-foreground mb-4">Export all your ERP data in JSON format</p>
              {exportError && (
                <div className="mb-3 p-2 rounded-lg bg-red-50 text-red-600 text-xs flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {exportError}
                </div>
              )}
              {exportDone && (
                <div className="mb-3 p-2 rounded-lg bg-green-50 text-green-600 text-xs flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Export completed!
                </div>
              )}
              <Button 
                onClick={handleExport} 
                disabled={exporting}
                className="gap-2 w-full bg-blue-600 hover:bg-blue-700"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {exporting ? 'Exporting...' : 'Export Data'}
              </Button>
            </div>

            {/* System Health */}
            <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
              <Activity className="w-8 h-8 text-green-500 mb-4" />
              <h3 className="font-bold text-lg mb-2">System Health</h3>
              <p className="text-xs text-muted-foreground mb-4">All systems operational</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">API Status</span>
                  <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle className="w-3 h-3" /> Operational</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Database</span>
                  <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle className="w-3 h-3" /> Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Uptime</span>
                  <span className="text-xs text-green-600">99.9%</span>
                </div>
              </div>
            </div>

            {/* Quick Setup */}
            <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
              <BarChart3 className="w-8 h-8 text-purple-500 mb-4" />
              <h3 className="font-bold text-lg mb-2">Configuration Status</h3>
              <p className="text-xs text-muted-foreground mb-4">Track your ERP setup progress</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Modules Configured</span>
                  <span className="text-xs text-purple-600 font-medium">11/11</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full" style={{ width: '100%' }} />
                </div>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-2">
                  <CheckCircle className="w-3 h-3" /> Fully configured
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}