'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, Plus, Trash2, Timer, Play, Pause, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TimeTrackingPage() {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [timerRunning, setTimerRunning] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [projectName, setProjectName] = useState('')
  const [taskName, setTaskName] = useState('')
  const [hours, setHours] = useState('')

  useEffect(() => {
    setLoading(false)
    setEntries([
      { id: '1', project: 'Website Redesign', task: 'Homepage', hours: 4.5, date: new Date().toISOString().split('T')[0] },
      { id: '2', project: 'Mobile App', task: 'Login Screen', hours: 2, date: new Date().toISOString().split('T')[0] },
    ])
  }, [])

  useEffect(() => {
    let interval: any
    if (timerRunning) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [timerRunning])

  const formatTime = (s: number) => {
    const hrs = Math.floor(s / 3600)
    const mins = Math.floor((s % 3600) / 60)
    const secs = s % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleAdd = () => {
    if (!projectName || !hours) return
    setEntries([{ id: Date.now().toString(), project: projectName, task: taskName || 'General', hours: parseFloat(hours), date: new Date().toISOString().split('T')[0] }, ...entries])
    setShowAdd(false); setProjectName(''); setTaskName(''); setHours('')
  }

  const totalHours = entries.reduce((s, e) => s + e.hours, 0)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/projects" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Time Tracking</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Clock className="w-6 h-6 text-indigo-500" /> Time Tracking</h1>
          <div className="flex gap-2">
            <Button onClick={() => setTimerRunning(!timerRunning)} className={`gap-2 ${timerRunning ? 'bg-red-600' : 'bg-green-600'}`}>
              {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {timerRunning ? 'Stop' : 'Start'} Timer
            </Button>
            <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-indigo-600"><Plus className="w-4 h-4" /> Log Time</Button>
          </div>
        </div>

        {timerRunning && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6 text-center">
            <Timer className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
            <p className="text-4xl font-bold font-mono">{formatTime(seconds)}</p>
            <p className="text-sm text-muted-foreground mt-2">Timer running...</p>
          </div>
        )}

        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <h3 className="font-bold mb-4">Log Time</h3>
            <div className="grid grid-cols-3 gap-4">
              <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Project *" />
              <input type="text" value={taskName} onChange={(e) => setTaskName(e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Task" />
              <input type="number" value={hours} onChange={(e) => setHours(e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Hours *" step="0.5" />
            </div>
            <Button onClick={handleAdd} className="mt-4">Log Time</Button>
          </div>
        )}

        <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 mb-6">
          <p className="text-sm text-muted-foreground">Total Hours</p>
          <p className="text-3xl font-bold">{totalHours}h</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
          {entries.map(e => (
            <div key={e.id} className="flex justify-between p-4 border-b">
              <div><p className="font-medium">{e.project}</p><p className="text-xs text-muted-foreground">{e.task} • {e.date}</p></div>
              <span className="font-bold">{e.hours}h</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}