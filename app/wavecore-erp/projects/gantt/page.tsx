'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Download } from 'lucide-react'

export default function GanttPage() {
  const [tasks] = useState([
    { id: 1, name: 'Requirements', start: 0, duration: 20, color: 'bg-blue-500' },
    { id: 2, name: 'Design', start: 15, duration: 25, color: 'bg-purple-500' },
    { id: 3, name: 'Development', start: 35, duration: 40, color: 'bg-green-500' },
    { id: 4, name: 'Testing', start: 70, duration: 20, color: 'bg-amber-500' },
    { id: 5, name: 'Deployment', start: 85, duration: 15, color: 'bg-red-500' },
  ])

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Gantt Timeline', '='.repeat(50), `Tasks: ${tasks.length}`, '', ...tasks.map(t => `${t.name}: Week ${t.start}-${t.start + t.duration}`), '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'gantt.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/projects" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Gantt</span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Calendar className="w-6 h-6 text-purple-500" /> Project Timeline</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 overflow-x-auto">
          <div className="min-w-[600px]">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 mb-3">
                <span className="w-32 text-sm font-medium flex-shrink-0">{task.name}</span>
                <div className="flex-1 relative h-8 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                  <div className={`absolute h-8 ${task.color} rounded-lg`} style={{ left: `${task.start}%`, width: `${task.duration}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}