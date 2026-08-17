'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, GanttChart, Calendar, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GanttPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/projects').then(r => r.json()).then(d => setProjects(d.projects || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const projectWithDates = projects.filter(p => p.startDate || p.endDate)
  const today = new Date()
  const maxEnd = Math.max(...projectWithDates.map(p => new Date(p.endDate || p.startDate).getTime()), today.getTime())
  const minStart = Math.min(...projectWithDates.map(p => new Date(p.startDate || p.endDate).getTime()), today.getTime())
  const totalDays = Math.max(1, Math.ceil((maxEnd - minStart) / (1000 * 60 * 60 * 24)))

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/projects" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Gantt Chart</span>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><GanttChart className="w-6 h-6 text-teal-500" /> Project Timeline (Gantt)</h1>
          <Link href="/wavecore-erp/projects"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button></Link>
        </div>

        {loading ? <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-500" /></div> :
          projectWithDates.length > 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 overflow-x-auto">
              <div className="min-w-[600px]">
                {projectWithDates.map(p => {
                  const start = new Date(p.startDate || p.endDate)
                  const end = new Date(p.endDate || p.startDate)
                  const startOffset = Math.round((start.getTime() - minStart) / (1000 * 60 * 60 * 24))
                  const duration = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)
                  const widthPercent = (duration / totalDays) * 100
                  const leftPercent = (startOffset / totalDays) * 100

                  return (
                    <div key={p.id} className="flex items-center mb-3">
                      <div className="w-40 flex-shrink-0 pr-3">
                        <p className="text-sm font-medium truncate">{p.title}</p>
                      </div>
                      <div className="flex-1 relative h-8 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                        <div
                          className="absolute h-6 rounded-md bg-gradient-to-r from-teal-500 to-emerald-500 flex items-center px-2 text-white text-xs font-medium"
                          style={{ left: `${leftPercent}%`, width: `${Math.max(widthPercent, 3)}%` }}
                        >
                          {duration}d
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Set start and end dates on projects to see the timeline</p>
            </div>
          )
        }
      </main>
    </div>
  )
}