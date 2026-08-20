'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, Download, Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/hr/attendance')
      .then(r => r.json())
      .then(d => setAttendance(d.attendance || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const present = attendance.filter((a: any) => a.status === 'PRESENT').length
  const absent = attendance.filter((a: any) => a.status === 'ABSENT').length

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Attendance', '='.repeat(50), `Present: ${present}`, `Absent: ${absent}`, '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'attendance.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/hr" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Attendance</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Clock className="w-6 h-6 text-green-500" /> Attendance</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
        </div>
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-green-50 dark:bg-green-950 text-center">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <p className="text-4xl font-extrabold text-green-600">{present}</p>
              <p className="text-sm">Present</p>
            </div>
            <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950 text-center">
              <XCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <p className="text-4xl font-extrabold text-red-600">{absent}</p>
              <p className="text-sm">Absent</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}