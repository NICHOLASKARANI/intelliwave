'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Briefcase, Download, Plus, Search, Loader2, Users } from 'lucide-react'

export default function RecruitmentPage() {
  const [jobs] = useState([
    { id: 1, title: 'Senior AI Engineer', department: 'Engineering', applicants: 24, status: 'OPEN' },
    { id: 2, title: 'ERP Implementation Specialist', department: 'Professional Services', applicants: 12, status: 'OPEN' },
    { id: 3, title: 'Cloud Solutions Architect', department: 'Cloud & DevOps', applicants: 8, status: 'OPEN' },
  ])

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Recruitment', '='.repeat(50), `Open Positions: ${jobs.length}`, `Total Applicants: ${jobs.reduce((s, j) => s + j.applicants, 0)}`, '', ...jobs.map((j, i) => `${i+1}. ${j.title} - ${j.department} (${j.applicants} applicants)`), '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'recruitment.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/hr" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Recruitment</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Briefcase className="w-6 h-6 text-blue-500" /> Recruitment</h1>
          <div className="flex gap-2">
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm"><Plus className="w-4 h-4" /> Post Job</button>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
          {jobs.map(job => (
            <div key={job.id} className="flex justify-between p-5 border-b hover:bg-neutral-50">
              <div>
                <p className="font-bold">{job.title}</p>
                <p className="text-sm text-muted-foreground">{job.department}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-600">{job.applicants}</p>
                <p className="text-xs text-muted-foreground">Applicants</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}