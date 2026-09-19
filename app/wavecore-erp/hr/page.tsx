'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Users, Calendar, Wallet, Clock, Download, Loader2,
  TrendingUp, Briefcase, Heart, Award, Star, UserPlus,
  Building2, CheckCircle, AlertTriangle, BarChart3, GraduationCap,
  RefreshCw, DollarSign, Activity, Target, FileText, UserCheck,
  ThumbsUp, Zap,
} from 'lucide-react'

export default function HRPage() {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  const fetchAll = () => {
    setLoading(true)
    fetch('/api/wavecore/hr/summary')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(() => { fetchAll() }, [])

  const s = data.summary || {}
  const byDepartment = data.byDepartment || []
  const byStatus = data.byStatus || []
  const leavesByStatus = data.leavesByStatus || []
  const applicantsByStage = data.applicantsByStage || []

  const handleDownloadPDF = () => {
    const lines = [
      'WaveCore ERP - Human Resources Dashboard',
      '='.repeat(60),
      'Generated: ' + new Date().toLocaleString(),
      '='.repeat(60),
      '',
      'HEADCOUNT',
      '  Total Employees:      ' + (s.totalEmployees || 0),
      '  Active Employees:     ' + (s.activeEmployees || 0),
      '  New Hires This Month: ' + (s.newHiresThisMonth || 0),
      '  Exits This Month:     ' + (s.exitsThisMonth || 0),
      '  Turnover Rate:        ' + (s.turnoverRate || 0) + '%',
      '',
      'RECRUITMENT',
      '  Total Jobs:           ' + (s.totalJobs || 0),
      '  Open Jobs:            ' + (s.openJobs || 0),
      '  Total Applicants:     ' + (s.totalApplicants || 0),
      '  In Interview:         ' + (s.inInterview || 0),
      '',
      'ATTENDANCE TODAY',
      '  Present:              ' + (s.presentToday || 0),
      '  Absent:               ' + (s.absentToday || 0),
      '  Late:                 ' + (s.lateToday || 0),
      '  Attendance Rate:      ' + (s.attendanceRate || 0) + '%',
      '',
      'LEAVE',
      '  Pending Requests:     ' + (s.pendingLeaves || 0),
      '  Approved YTD:         ' + (s.approvedLeaves || 0),
      '  Total Days YTD:       ' + (s.totalLeaveDaysThisYear || 0),
      '',
      'PAYROLL',
      '  Payroll This Month:   ' + (s.totalPayrollThisMonth || 0).toLocaleString(),
      '  Monthly Labour Cost:  ' + (s.monthlyLaborCost || 0).toLocaleString(),
      '  Annual Salary Bill:   ' + (s.annualSalaryBill || 0).toLocaleString(),
      '  Average Salary:       ' + (s.avgSalary || 0).toLocaleString(),
      '',
      'PERFORMANCE',
      '  Total Reviews:        ' + (s.totalReviews || 0),
      '  Avg Score:            ' + (s.avgPerformanceScore || 0) + '/5',
      '  Completion Rate:      ' + (s.reviewCompletionRate || 0) + '%',
      '',
      'TRAINING',
      '  Total Programs:       ' + (s.totalTrainings || 0),
      '  Active:               ' + (s.activeTrainings || 0),
      '  Total Enrolled:       ' + (s.totalEnrolledInTraining || 0),
      '',
      'BENEFITS / DOCUMENTS',
      '  Active Benefit Programs: ' + (s.activeBenefitPrograms || 0),
      '  Total Documents:         ' + (s.totalDocuments || 0),
      '',
      'ONBOARDING',
      '  Active Onboardings:   ' + (s.activeOnboardings || 0),
      '',
      'ORG STRUCTURE',
      '  Departments:          ' + (s.totalDepartments || 0),
      '  Positions:            ' + (s.totalPositions || 0),
      '  Leave Types:          ' + (s.totalLeaveTypes || 0),
      '',
      '='.repeat(60),
      '© ' + new Date().getFullYear() + ' IntelliWavve - All Rights Reserved',
    ].join('\n')
    const blob = new Blob([lines], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'hr-dashboard.txt'; a.click()
  }

  const modules = [
    { name: 'Employees', href: '/wavecore-erp/hr/employees', icon: Users, color: 'from-blue-500 to-indigo-600', stat: s.totalEmployees || 0, sub: (s.activeEmployees || 0) + ' active' },
    { name: 'Departments', href: '/wavecore-erp/hr/departments', icon: Building2, color: 'from-indigo-500 to-blue-600', stat: s.totalDepartments || 0, sub: 'units' },
    { name: 'Attendance', href: '/wavecore-erp/hr/attendance', icon: Clock, color: 'from-green-500 to-emerald-600', stat: s.presentToday || 0, sub: (s.attendanceRate || 0) + '% today' },
    { name: 'Leave', href: '/wavecore-erp/hr/leaves', icon: Calendar, color: 'from-amber-500 to-orange-600', stat: s.pendingLeaves || 0, sub: 'pending' },
    { name: 'Payroll', href: '/wavecore-erp/hr/payroll', icon: Wallet, color: 'from-purple-500 to-violet-600', stat: s.monthlyLaborCost || 0, sub: 'KSh/mo' },
    { name: 'Recruitment', href: '/wavecore-erp/hr/recruitment', icon: Briefcase, color: 'from-cyan-500 to-blue-600', stat: s.openJobs || 0, sub: (s.totalApplicants || 0) + ' applicants' },
    { name: 'Performance', href: '/wavecore-erp/hr/performance', icon: Award, color: 'from-yellow-500 to-amber-600', stat: s.avgPerformanceScore || 0, sub: (s.reviewCompletionRate || 0) + '% done' },
    { name: 'Training', href: '/wavecore-erp/hr/training', icon: GraduationCap, color: 'from-violet-500 to-purple-600', stat: s.activeTrainings || 0, sub: (s.totalEnrolledInTraining || 0) + ' enrolled' },
    { name: 'Benefits', href: '/wavecore-erp/hr/benefits', icon: Heart, color: 'from-pink-500 to-rose-600', stat: s.activeBenefitPrograms || 0, sub: 'programs' },
    { name: 'Onboarding', href: '/wavecore-erp/hr/onboarding', icon: UserPlus, color: 'from-emerald-500 to-green-600', stat: s.activeOnboardings || 0, sub: 'in progress' },
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
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Users className="w-8 h-8" /> Human Resources Command Center
              </h1>
              <p className="text-white/80 text-sm">11 modules · Live workforce data · Enterprise HCM</p>
            </div>
            <div className="flex gap-3">
              <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-medium hover:bg-white/30">
                <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
              </button>
              <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-medium hover:bg-white/30">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" /></div>
        ) : (
          <>
            {/* ROW 1 — HEADCOUNT + RECRUITMENT */}
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Workforce</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
                <Users className="w-6 h-6 text-blue-500 mb-2" />
                <p className="text-3xl font-extrabold">{s.totalEmployees || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Employees</p>
                <p className="text-xs text-green-500 mt-1">{s.activeEmployees || 0} active</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
                <UserPlus className="w-6 h-6 text-emerald-500 mb-2" />
                <p className="text-3xl font-extrabold">{s.newHiresThisMonth || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">New Hires</p>
                <p className="text-xs text-emerald-500 mt-1">this month</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
                <TrendingUp className="w-6 h-6 text-red-500 mb-2" />
                <p className="text-3xl font-extrabold">{s.turnoverRate || 0}%</p>
                <p className="text-xs text-muted-foreground mt-1">Turnover Rate</p>
                <p className="text-xs text-red-500 mt-1">{s.exitsThisMonth || 0} exits this mo</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
                <Briefcase className="w-6 h-6 text-cyan-500 mb-2" />
                <p className="text-3xl font-extrabold">{s.openJobs || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Open Positions</p>
                <p className="text-xs text-cyan-500 mt-1">of {s.totalJobs || 0} total</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
                <Users className="w-6 h-6 text-indigo-500 mb-2" />
                <p className="text-3xl font-extrabold">{s.totalApplicants || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Applicants</p>
                <p className="text-xs text-indigo-500 mt-1">{s.inInterview || 0} in interview</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
                <Building2 className="w-6 h-6 text-purple-500 mb-2" />
                <p className="text-3xl font-extrabold">{s.totalDepartments || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Departments</p>
                <p className="text-xs text-purple-500 mt-1">{s.totalPositions || 0} positions</p>
              </div>
            </div>

            {/* ROW 2 — TIME & ATTENDANCE */}
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Time & Leave</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
                <UserCheck className="w-6 h-6 text-green-500 mb-2" />
                <p className="text-3xl font-extrabold">{s.presentToday || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Present Today</p>
                <p className="text-xs text-green-500 mt-1">{s.attendanceRate || 0}% rate</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
                <AlertTriangle className="w-6 h-6 text-yellow-500 mb-2" />
                <p className="text-3xl font-extrabold">{s.lateToday || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Late Today</p>
                <p className="text-xs text-yellow-500 mt-1">monitor closely</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
                <Calendar className="w-6 h-6 text-amber-500 mb-2" />
                <p className="text-3xl font-extrabold">{s.pendingLeaves || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Pending Leave</p>
                <p className="text-xs text-amber-500 mt-1">{s.approvedLeaves || 0} approved</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
                <Calendar className="w-6 h-6 text-orange-500 mb-2" />
                <p className="text-3xl font-extrabold">{s.totalLeaveDaysThisYear || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Leave Days YTD</p>
                <p className="text-xs text-orange-500 mt-1">this year</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
                <Clock className="w-6 h-6 text-cyan-500 mb-2" />
                <p className="text-3xl font-extrabold">{s.absentToday || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Absent Today</p>
                <p className="text-xs text-red-500 mt-1">follow up</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
                <Activity className="w-6 h-6 text-blue-500 mb-2" />
                <p className="text-3xl font-extrabold">{s.activeOnboardings || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Onboarding</p>
                <p className="text-xs text-blue-500 mt-1">in progress</p>
              </div>
            </div>

            {/* ROW 3 — FINANCE & DEVELOPMENT */}
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Finance & Development</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
                <Wallet className="w-6 h-6 text-purple-500 mb-2" />
                <p className="text-3xl font-extrabold">{(s.monthlyLaborCost || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Monthly Labour Cost</p>
                <p className="text-xs text-purple-500 mt-1">KSh</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
                <DollarSign className="w-6 h-6 text-indigo-500 mb-2" />
                <p className="text-3xl font-extrabold">{(s.avgSalary || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Avg Salary</p>
                <p className="text-xs text-indigo-500 mt-1">per employee</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
                <Star className="w-6 h-6 text-yellow-500 mb-2" />
                <p className="text-3xl font-extrabold">{s.avgPerformanceScore || 0}<span className="text-sm text-muted-foreground">/5</span></p>
                <p className="text-xs text-muted-foreground mt-1">Avg Performance</p>
                <p className="text-xs text-yellow-500 mt-1">{s.reviewCompletionRate || 0}% completed</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
                <GraduationCap className="w-6 h-6 text-violet-500 mb-2" />
                <p className="text-3xl font-extrabold">{s.activeTrainings || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Active Training</p>
                <p className="text-xs text-violet-500 mt-1">{s.totalEnrolledInTraining || 0} enrolled</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
                <Heart className="w-6 h-6 text-pink-500 mb-2" />
                <p className="text-3xl font-extrabold">{s.activeBenefitPrograms || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Benefit Programs</p>
                <p className="text-xs text-pink-500 mt-1">active</p>
              </div>
            </div>

            {/* DEPARTMENT BREAKDOWN + PIPELINE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {byDepartment.length > 0 && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-5">
                  <h3 className="text-sm font-bold uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-500" /> Headcount by Department
                  </h3>
                  <div className="space-y-3">
                    {byDepartment.slice(0, 8).map((d: any) => {
                      const max = Math.max(...byDepartment.map((x: any) => x.count), 1)
                      const pct = Math.round((d.count / max) * 100)
                      return (
                        <div key={d.department}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium">{d.department}</span>
                            <span className="text-muted-foreground">{d.count} · KSh {(d.monthlyCost || 0).toLocaleString()}/mo</span>
                          </div>
                          <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2">
                            <div className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2 rounded-full" style={{ width: pct + '%' }}></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {applicantsByStage.length > 0 && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-5">
                  <h3 className="text-sm font-bold uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-cyan-500" /> Applicant Pipeline
                  </h3>
                  <div className="space-y-3">
                    {applicantsByStage.map((p: any) => {
                      const max = Math.max(...applicantsByStage.map((x: any) => x.count), 1)
                      const pct = Math.round((p.count / max) * 100)
                      return (
                        <div key={p.stage}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium uppercase">{p.stage}</span>
                            <span className="text-muted-foreground">{p.count}</span>
                          </div>
                          <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2">
                            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full" style={{ width: pct + '%' }}></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* MODULES GRID */}
            <h2 className="text-xl font-bold mb-4">HR Modules (10)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {modules.map(module => {
                const Icon = module.icon
                return (
                  <Link key={module.name} href={module.href}
                    className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:border-indigo-300 hover:shadow-2xl transition-all group">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-bold text-sm">{module.name}</p>
                    <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                      <span className="text-lg font-extrabold">{module.stat}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{module.sub}</span>
                    </div>
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