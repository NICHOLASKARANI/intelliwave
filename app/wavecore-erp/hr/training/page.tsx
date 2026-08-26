'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { GraduationCap, Loader2 } from 'lucide-react'

interface Training {
  id: string
  title: string
  trainer: string
  date: string
  status: string
}

export default function TrainingPage() {
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrainings()
  }, [])

  const fetchTrainings = async () => {
    try {
      const res = await fetch('/api/wavecore/hr/training')
      const data = await res.json()
      setTrainings(data.trainings || [])
    } catch (error) {
      console.error('Failed to fetch trainings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/hr" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Training</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-indigo-500" /> Training ({trainings.length})
        </h1>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : trainings.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No training sessions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trainings.map(training => (
              <div key={training.id} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900">
                <p className="font-bold">{training.title}</p>
                <p className="text-sm text-muted-foreground">{training.trainer} - {training.date}</p>
                <span className={`px-2 py-1 rounded-full text-xs mt-2 inline-block ${
                  training.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                }`}>{training.status}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}