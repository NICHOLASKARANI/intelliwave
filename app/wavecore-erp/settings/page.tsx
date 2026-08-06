'use client'

import { useState } from 'react'
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { 
  LayoutDashboard, ArrowLeft, User, Lock, Bell, Shield,
  CreditCard, Users, Building2, Globe, Palette, Smartphone,
  Key, Eye, EyeOff, Mail, Phone, Save, LogOut, ChevronRight,
  CheckCircle, AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)

  const tabs = [
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'security', icon: Lock, label: 'Security' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'billing', icon: CreditCard, label: 'Billing' },
    { id: 'organization', icon: Building2, label: 'Organization' },
    { id: 'appearance', icon: Palette, label: 'Appearance' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-800 shadow-lg">
                <Image src="/images/Wavecore.jpeg" alt="WaveCore ERP" width={40} height={40} className="object-cover" priority />
              </div>
              <span className="font-bold text-xl text-neutral-900 dark:text-white">WaveCore</span>
              <span className="ml-2 px-2 py-0.5 text-[10px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-medium">ERP</span>
            </Link>
            <span className="text-neutral-300">/</span>
            <span className="text-sm font-medium">Settings</span>
          </div>
          <Link href="/wavecore-erp" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </header>

      <div className="flex">
        {/* Settings Sidebar */}
        <aside className="w-64 bg-white dark:bg-neutral-900 border-r min-h-[calc(100vh-64px)] p-4 hidden lg:block">
          <Link href="/wavecore-erp" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <p className="px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Settings</p>
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all text-left ${
                    activeTab === tab.id 
                      ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold shadow-sm' 
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-muted'
                  }`}>
                  <Icon className="w-4 h-4" /> {tab.label}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Settings Content */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-3xl">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Profile Settings</h1>
                  <p className="text-muted-foreground mt-1">Manage your personal information</p>
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 space-y-6">
                  <div className="flex items-center gap-4 pb-6 border-b">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">IW</div>
                    <div>
                      <Button variant="outline" size="sm">Change Avatar</Button>
                      <p className="text-xs text-muted-foreground mt-2">JPG, PNG or GIF. Max 2MB.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Full Name</label>
                      <input type="text" className="w-full px-4 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Your name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input type="email" className="w-full px-4 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="your@email.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone</label>
                      <input type="tel" className="w-full px-4 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="+254 700 000 000" />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline">Cancel</Button>
                    <Button className="gap-2"><Save className="w-4 h-4" /> Save Changes</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Security</h1>
                  <p className="text-muted-foreground mt-1">Manage your password and security settings</p>
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 space-y-6">
                  <div>
                    <h3 className="font-bold mb-4">Change Password</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Current Password</label>
                        <div className="relative">
                          <input type={showPassword ? 'text' : 'password'} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="••••••••" />
                          <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                            {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">New Password</label>
                        <input type="password" className="w-full px-4 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="••••••••" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                        <input type="password" className="w-full px-4 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="••••••••" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-bold mb-4">Two-Factor Authentication</h3>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                      <div>
                        <p className="font-medium">Enable 2FA</p>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                      </div>
                      <Button variant="outline" size="sm">Enable</Button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline">Cancel</Button>
                    <Button className="gap-2"><Save className="w-4 h-4" /> Update Security</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Billing & Subscription</h1>
                  <p className="text-muted-foreground mt-1">Manage your plan and payments</p>
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
                  <div className="text-center py-8">
                    <CreditCard className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">30-Day Free Trial Active</h3>
                    <p className="text-muted-foreground mb-2">Your trial ends in 30 days</p>
                    <p className="text-3xl font-bold text-indigo-600 mb-4">KSh 500<span className="text-base text-muted-foreground">/month</span></p>
                    <p className="text-sm text-muted-foreground mb-6">After your trial, you'll be charged KSh 500 per month. Cancel anytime.</p>
                    <div className="flex gap-3 justify-center">
                      <Button className="bg-indigo-600 hover:bg-indigo-700">Subscribe Now</Button>
                      <Button variant="outline">Contact Sales</Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">Pay via M-Pesa Till: 4760783</p>
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs placeholder */}
            {!['profile', 'security', 'billing'].includes(activeTab) && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-12 text-center">
                <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="font-medium text-neutral-900 dark:text-white">
                  {activeTab === 'notifications' && 'Notification Settings'}
                  {activeTab === 'organization' && 'Organization Settings'}
                  {activeTab === 'appearance' && 'Appearance Settings'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Coming soon</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}