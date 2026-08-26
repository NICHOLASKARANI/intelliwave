'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Users, Calendar, Wallet, Clock, Download, Loader2,
  TrendingUp, Briefcase, Heart, Award, Star, UserPlus,
  Building2, CheckCircle, AlertCircle, BarChart3, GraduationCap
} from 'lucide-react'

export default function HRPage() {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/hr/summary')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - Human Resources Dashboard',
      '='.repeat(50),
      'Generated: ' + new Date().toLocaleString(),
      'IntelliWavve - Enterprise HR',
      '='.repeat(50),
      '',
      'Employees: ' + (data.employees || 0),
      'Departments: ' + (data.departments || 0),
      'Monthly Payroll: KSh ' + (data.payroll || 0).toLocaleString(),
      'Pending Leaves: ' + (data.pendingLeaves || 0),
      'Attendance Today: ' + (data.attendance || 0),
      '',
      '© 2026 IntelliWavve - All Rights Reserved'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'hr-dashboard.pdf'; a.click()
  }

  const modules = [
    { name: 'Employees', href: '/wavecore-erp/hr/employees', icon: Users, color: 'from-blue-500 to-indigo-600', desc: 'Manage staff' },
    { name: 'Attendance', href: '/wavecore-erp/hr/attendance', icon: Clock, color: 'from-green-500 to-emerald-600', desc: 'Track time' },
    { name: 'Payroll', href: '/wavecore-erp/hr/payroll', icon: Wallet, color: 'from-purple-500 to-violet-600', desc: 'Salary processing' },
    { name: 'Leave', href: '/wavecore-erp/hr/leaves', icon: Calendar, color: 'from-amber-500 to-orange-600', desc: 'Leave management' },
    { name: 'Recruitment', href: '/wavecore-erp/hr/recruitment', icon: Briefcase, color: 'from-cyan-500 to-blue-600', desc: 'Job postings' },
    { name: 'Performance', href: '/wavecore-erp/hr/performance', icon: Star, color: 'from-yellow-500 to-amber-600', desc: 'Reviews & goals' },
    { name: 'Training', href: '/wavecore-erp/hr/training', icon: GraduationCap, color: 'from-violet-500 to-purple-600', desc: 'Development' },
    { name: 'Departments', href: '/wavecore-erp/hr/departments', icon: Building2, color: 'from-indigo-500 to-blue-600', desc: 'Org structure' },
    { name: 'Benefits', href: '/wavecore-erp/hr/benefits', icon: Heart, color: 'from-pink-500 to-rose-600', desc: 'Employee benefits' },
    { name: 'Onboarding', href: '/wavecore-erp/hr/onboarding', icon: UserPlus, color: 'from-emerald-500 to-green-600', desc: 'New hire workflow' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Human Resources</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-6 lg:p-8 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Users className="w-8 h-8" /> Human Resources
              </h1>
              <p className="text-white/80 text-sm">10 Modules • Recruitment • Performance • Training</p>
            </div>
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-medium hover:bg-white/30">
              <Download className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-500" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <Users className="w-8 h-8 text-blue-500 mb-3" />
                <p className="text-3xl font-extrabold">{data.employees || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Employees</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <Building2 className="w-8 h-8 text-indigo-500 mb-3" />
                <p className="text-3xl font-extrabold">{data.departments || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Departments</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <Wallet className="w-8 h-8 text-purple-500 mb-3" />
                <p className="text-3xl font-extrabold">KSh {(data.payroll || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Payroll</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <Calendar className="w-8 h-8 text-amber-500 mb-3" />
                <p className="text-3xl font-extrabold">{data.pendingLeaves || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Pending Leaves</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <Clock className="w-8 h-8 text-green-500 mb-3" />
                <p className="text-3xl font-extrabold">{data.attendance || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Attendance</p>
              </div>
            </div>

            <h2 className="text-xl font-bold mb-4">HR Modules (10)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {modules.map(module => {
                const Icon = module.icon
                return (
                  <Link key={module.name} href={module.href}
                    className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:border-blue-300 hover:shadow-2xl transition-all group">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-bold text-sm">{module.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{module.desc}</p>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}