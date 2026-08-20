'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { GraduationCap, Download, Award } from 'lucide-react'

export default function TrainingPage() {
  const [courses] = useState([
    { id: 1, name: 'Enterprise AI Fundamentals', enrolled: 45, completion: '92%' },
    { id: 2, name: 'ERP Implementation Mastery', enrolled: 32, completion: '78%' },
    { id: 3, name: 'Cloud Architecture Essentials', enrolled: 28, completion: '85%' },
  ])

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Training', '='.repeat(50), `Courses: ${courses.length}`, `Total Enrolled: ${courses.reduce((s, c) => s + c.enrolled, 0)}`, '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'training.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/hr" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Training</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><GraduationCap className="w-6 h-6 text-purple-500" /> Training & Development</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {courses.map(course => (
            <div key={course.id} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
              <Award className="w-8 h-8 text-purple-500 mb-3" />
              <p className="font-bold">{course.name}</p>
              <p className="text-sm text-muted-foreground">{course.enrolled} enrolled</p>
              <p className="text-xs text-green-600 mt-1">{course.completion} completion</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}