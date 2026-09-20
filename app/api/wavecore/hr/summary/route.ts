export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // === RBAC GUARD ===
    const guard = await guardHR(request, 'HR_READ')
    if (guard.deny) return guard.response!
    // ==================
    const orgId = session.organizationId

    const safe = async (q: string, params: any[], fallback: any = { rows: [] }) => {
      try { return await pool.query(q, params) } catch { return fallback }
    }

    const [
      empRes, deptRes, posRes, attRes, leaveRes, leaveTypeRes,
      payrollPeriodRes, payrollItemRes, jobRes, applicantRes,
      perfRes, trainRes, benefitRes, onboardRes, docRes, balanceRes
    ] = await Promise.all([
      safe(`SELECT id, "firstName", "lastName", status, "employmentType", department, "jobTitle", salary, "hireDate", "terminationDate", "reportingManagerId" FROM "Employee" WHERE "organizationId" = $1 LIMIT 2000`, [orgId]),
      safe(`SELECT id, name, "budgetAmount", "headEmployeeId" FROM "Department" WHERE "organizationId" = $1 LIMIT 500`, [orgId]),
      safe(`SELECT id, title, "headcountBudget", "headcountFilled" FROM "Position" WHERE "organizationId" = $1 LIMIT 500`, [orgId]),
      safe(`SELECT id, status, date, "employeeId", "checkIn", "checkOut" FROM "Attendance" WHERE "organizationId" = $1 LIMIT 5000`, [orgId]),
      safe(`SELECT id, status, days, "startDate", "endDate", "employeeId" FROM "LeaveRequest" WHERE "organizationId" = $1 LIMIT 2000`, [orgId]),
      safe(`SELECT id, name FROM "LeaveType" WHERE "organizationId" = $1 LIMIT 100`, [orgId]),
      safe(`SELECT id, name, status, "startDate", "endDate" FROM "PayrollPeriod" WHERE "organizationId" = $1 LIMIT 100`, [orgId]),
      safe(`SELECT id, "grossPay", "netPay", "periodId", "employeeId" FROM "PayrollItem" WHERE "organizationId" = $1 LIMIT 5000`, [orgId]),
      safe(`SELECT id, title, status, "postedDate", "closingDate" FROM "JobPosting" WHERE "organizationId" = $1 LIMIT 500`, [orgId]),
      safe(`SELECT id, stage, "jobPostingId" FROM "Applicant" WHERE "organizationId" = $1 LIMIT 2000`, [orgId]),
      safe(`SELECT id, "employeeId", score, status FROM "PerformanceReview" WHERE "organizationId" = $1 LIMIT 2000`, [orgId]),
      safe(`SELECT id, title, status, "enrolledCount", "maxAttendees" FROM "TrainingProgram" WHERE "organizationId" = $1 LIMIT 500`, [orgId]),
      safe(`SELECT id, name, "enrolledCount", status FROM "BenefitProgram" WHERE "organizationId" = $1 LIMIT 500`, [orgId]),
      safe(`SELECT id, status, "currentStep", "totalSteps" FROM "OnboardingChecklist" WHERE "organizationId" = $1 LIMIT 500`, [orgId]),
      safe(`SELECT id, "employeeId" FROM "EmployeeDocument" WHERE "organizationId" = $1 LIMIT 5000`, [orgId]),
      safe(`SELECT id, "employeeId", "leaveTypeId", balance FROM "LeaveBalance" WHERE "organizationId" = $1 LIMIT 2000`, [orgId]),
    ])

    const employees = empRes.rows
    const departments = deptRes.rows
    const positions = posRes.rows
    const attendance = attRes.rows
    const leaves = leaveRes.rows
    const leaveTypes = leaveTypeRes.rows
    const payrollPeriods = payrollPeriodRes.rows
    const payrollItems = payrollItemRes.rows
    const jobs = jobRes.rows
    const applicants = applicantRes.rows
    const perfReviews = perfRes.rows
    const trainings = trainRes.rows
    const benefits = benefitRes.rows
    const onboardings = onboardRes.rows
    const documents = docRes.rows
    const leaveBalances = balanceRes.rows

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const yearStart = new Date(now.getFullYear(), 0, 1)

    // ============ KPI 1-3: HEADCOUNT ============
    const activeEmployees = employees.filter(e => e.status === 'ACTIVE')
    const totalEmployees = employees.length
    const newHiresThisMonth = employees.filter(e => e.hireDate && new Date(e.hireDate) >= monthStart).length
    const exitsThisMonth = employees.filter(e => e.terminationDate && new Date(e.terminationDate) >= monthStart).length

    // ============ KPI 4-6: RECRUITMENT ============
    const openJobs = jobs.filter(j => j.status === 'OPEN')
    const totalApplicants = applicants.length
    const inInterview = applicants.filter(a => a.stage === 'INTERVIEW' || a.stage === 'ASSESSMENT').length

    // ============ KPI 7-9: ATTENDANCE TODAY ============
    const todayAttendance = attendance.filter(a => a.date && new Date(a.date) >= todayStart)
    const presentToday = todayAttendance.filter(a => a.status === 'PRESENT').length
    const absentToday = todayAttendance.filter(a => a.status === 'ABSENT').length
    const lateToday = todayAttendance.filter(a => a.status === 'LATE').length
    const attendanceRate = activeEmployees.length > 0
      ? Math.round((presentToday / activeEmployees.length) * 100)
      : 0

    // ============ KPI 10-11: LEAVE ============
    const pendingLeaves = leaves.filter(l => l.status === 'PENDING')
    const approvedLeaves = leaves.filter(l => l.status === 'APPROVED')
    const totalLeaveDaysThisYear = approvedLeaves
      .filter(l => l.startDate && new Date(l.startDate) >= yearStart)
      .reduce((s, l) => s + Number(l.days || 0), 0)

    // ============ KPI 12-14: PAYROLL ============
    const currentMonthPayrollItems = payrollItems.filter(p => {
      const period = payrollPeriods.find(pp => pp.id === p.periodId)
      return period && period.startDate && new Date(period.startDate) >= monthStart
    })
    const totalPayrollThisMonth = currentMonthPayrollItems.reduce((s, p) => s + Number(p.netPay || 0), 0)
    const annualSalaryBill = activeEmployees.reduce((s, e) => s + Number(e.salary || 0), 0)
    const monthlyLaborCost = Math.round(annualSalaryBill / 12)
    const avgSalary = activeEmployees.length > 0 ? Math.round(annualSalaryBill / activeEmployees.length) : 0

    // ============ KPI 15-17: PERFORMANCE / TRAINING / ONBOARDING ============
    const completedReviews = perfReviews.filter(r => r.status === 'COMPLETED')
    const avgPerformanceScore = completedReviews.length > 0
      ? Math.round((completedReviews.reduce((s, r) => s + Number(r.score || 0), 0) / completedReviews.length) * 10) / 10
      : 0
    const reviewCompletionRate = employees.length > 0
      ? Math.round((completedReviews.length / employees.length) * 100)
      : 0

    const activeTrainings = trainings.filter(t => t.status === 'IN_PROGRESS' || t.status === 'PLANNED')
    const totalEnrolledInTraining = trainings.reduce((s, t) => s + Number(t.enrolledCount || 0), 0)

    const activeOnboardings = onboardings.filter(o => o.status === 'IN_PROGRESS')

    // ============ TURNOVER ============
    const ytdExits = employees.filter(e => e.terminationDate && new Date(e.terminationDate) >= yearStart).length
    const avgHeadcount = Math.max(1, Math.round((totalEmployees + ytdExits) / 2))
    const turnoverRate = Math.round((ytdExits / avgHeadcount) * 1000) / 10

    // ============ DEPARTMENT BREAKDOWN ============
    const deptMap: Record<string, { count: number; salary: number }> = {}
    for (const e of activeEmployees) {
      const d = e.department || 'Unassigned'
      if (!deptMap[d]) deptMap[d] = { count: 0, salary: 0 }
      deptMap[d].count += 1
      deptMap[d].salary += Number(e.salary || 0)
    }
    const byDepartment = Object.entries(deptMap)
      .map(([dept, v]) => ({ department: dept, count: v.count, monthlyCost: Math.round(v.salary / 12) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    // ============ STATUS BREAKDOWN ============
    const statusMap: Record<string, number> = {}
    for (const e of employees) {
      const s = e.status || 'UNKNOWN'
      statusMap[s] = (statusMap[s] || 0) + 1
    }
    const byStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }))

    // ============ LEAVE STATUS BREAKDOWN ============
    const leaveStatusMap: Record<string, number> = {}
    for (const l of leaves) {
      const s = l.status || 'UNKNOWN'
      leaveStatusMap[s] = (leaveStatusMap[s] || 0) + 1
    }
    const leavesByStatus = Object.entries(leaveStatusMap).map(([status, count]) => ({ status, count }))

    // ============ APPLICANT PIPELINE ============
    const stageMap: Record<string, number> = {}
    for (const a of applicants) {
      const s = a.stage || 'APPLIED'
      stageMap[s] = (stageMap[s] || 0) + 1
    }
    const applicantsByStage = Object.entries(stageMap).map(([stage, count]) => ({ stage, count }))

    // ============ ATTENDANCE TREND (last 14 days) ============
    const trend: { date: string; present: number; absent: number; late: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const next = new Date(d)
      next.setDate(next.getDate() + 1)
      const dayRecs = attendance.filter(a => a.date && new Date(a.date) >= d && new Date(a.date) < next)
      trend.push({
        date: d.toISOString().slice(0, 10),
        present: dayRecs.filter(a => a.status === 'PRESENT').length,
        absent: dayRecs.filter(a => a.status === 'ABSENT').length,
        late: dayRecs.filter(a => a.status === 'LATE').length,
      })
    }

    // ============ SUMMARY OBJECT ============
    const summary = {
      // Headcount
      totalEmployees,
      activeEmployees: activeEmployees.length,
      newHiresThisMonth,
      exitsThisMonth,
      turnoverRate,

      // Recruitment
      openJobs: openJobs.length,
      totalJobs: jobs.length,
      totalApplicants,
      inInterview,

      // Attendance
      presentToday,
      absentToday,
      lateToday,
      attendanceRate,

      // Leave
      pendingLeaves: pendingLeaves.length,
      approvedLeaves: approvedLeaves.length,
      totalLeaveDaysThisYear: Math.round(totalLeaveDaysThisYear),

      // Payroll
      totalPayrollThisMonth: Math.round(totalPayrollThisMonth),
      monthlyLaborCost,
      annualSalaryBill: Math.round(annualSalaryBill),
      avgSalary,

      // Performance
      avgPerformanceScore,
      reviewCompletionRate,
      totalReviews: perfReviews.length,

      // Training
      activeTrainings: activeTrainings.length,
      totalTrainings: trainings.length,
      totalEnrolledInTraining,

      // Onboarding
      activeOnboardings: activeOnboardings.length,
      totalOnboardings: onboardings.length,

      // Benefits / Documents
      activeBenefitPrograms: benefits.filter(b => b.status === 'ACTIVE').length,
      totalDocuments: documents.length,
      totalLeaveBalances: leaveBalances.length,

      // Org structure
      totalDepartments: departments.length,
      totalPositions: positions.length,
      totalLeaveTypes: leaveTypes.length,

      // Meta
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      summary,
      byDepartment,
      byStatus,
      leavesByStatus,
      applicantsByStage,
      attendanceTrend: trend,
    })
  } catch (error) {
    console.error('HR summary GET error:', error)
    return NextResponse.json({ summary: {}, error: (error as Error).message })
  }
}