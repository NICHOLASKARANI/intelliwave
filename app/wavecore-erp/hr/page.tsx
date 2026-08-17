'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Users, Briefcase, Calendar, DollarSign, Clock, TrendingUp,
  Plus, Loader2, GraduationCap, Activity, UserCheck, FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HRPage() {
  const [stats, setStats] = useState({
    totalEmployees: 0, activeEmployees: 0, departments: 0,
    monthlyPayroll: 0, pendingLeaves: 0, todayAttendance: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/wavecore/hr/summary')
        if (res.ok) {
          const data = await res.json()
          setStats(data.summary || {})
        }
      } catch {} finally { setLoading(false) }
    }
    fetchStats()
  }, [])

  const formatKES = (a: number) => 'KSh ' + (a || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

  const quickActions = [
    { label: 'Employees', href: '/wavecore-erp/hr/employees', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
    { label: 'Attendance', href: '/wavecore-erp/hr/attendance', icon: UserCheck, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
    { label: 'Payroll', href: '/wavecore-erp/hr/payroll', icon: DollarSign, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
    { label: 'Leave', href: '/wavecore-erp/hr/leaves', icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Human Resources</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 lg:p-8 mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3"><Users className="w-8 h-8" /> Human Resources</h1>
          <p className="text-white/80 text-sm">Employees • Payroll • Attendance • Leave</p>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <KPICard label="Employees" value={stats.totalEmployees} icon={Users} color="text-blue-500" />
              <KPICard label="Active" value={stats.activeEmployees} icon={UserCheck} color="text-green-500" />
              <KPICard label="Departments" value={stats.departments} icon={Briefcase} color="text-purple-500" />
              <KPICard label="Monthly Payroll" value={formatKES(stats.monthlyPayroll)} icon={DollarSign} color="text-emerald-500" />
              <KPICard label="Pending Leaves" value={stats.pendingLeaves} icon={Calendar} color="text-orange-500" />
              <KPICard label="Today Attendance" value={stats.todayAttendance} icon={Clock} color="text-teal-500" />
            </div>

            <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickActions.map(a => {
                const Icon = a.icon
                return (
                  <Link key={a.label} href={a.href} className="flex items-center gap-3 p-4 rounded-xl border bg-white dark:bg-neutral-900 hover:border-indigo-300 hover:shadow-md transition-all">
                    <div className={`w-10 h-10 rounded-lg ${a.bg} flex items-center justify-center`}><Icon className={`w-5 h-5 ${a.color}`} /></div>
                    <span className="text-sm font-medium">{a.label}</span>
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

function KPICard({ label, value, icon: Icon, color }: { label: string; value: any; icon: any; color: string }) {
  return (
    <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg transition-all">
      <Icon className={`w-5 h-5 ${color} mb-3`} />
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  )
}