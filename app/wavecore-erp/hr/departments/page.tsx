'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Building2, Download, Users } from 'lucide-react'

export default function DepartmentsPage() {
  const [departments] = useState([
    { id: 1, name: 'Engineering', employees: 45, head: 'Mark Mwangi' },
    { id: 2, name: 'Sales & Marketing', employees: 28, head: 'Gefferson Mbeere' },
    { id: 3, name: 'Finance', employees: 12, head: 'Kelvin Muchui' },
    { id: 4, name: 'Operations', employees: 20, head: 'Nicholas Karani' },
  ])

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Departments', '='.repeat(50), `Total: ${departments.length}`, `Total Employees: ${departments.reduce((s, d) => s + d.employees, 0)}`, '', ...departments.map((d, i) => `${i+1}. ${d.name} - ${d.employees} employees (Head: ${d.head})`), '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'departments.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/hr" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Departments</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="w-6 h-6 text-indigo-500" /> Departments</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {departments.map(dept => (
            <div key={dept.id} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
              <Building2 className="w-8 h-8 text-indigo-500 mb-3" />
              <p className="font-bold text-lg">{dept.name}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1"><Users className="w-4 h-4" /> {dept.employees} employees</p>
              <p className="text-xs text-muted-foreground mt-1">Head: {dept.head}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}