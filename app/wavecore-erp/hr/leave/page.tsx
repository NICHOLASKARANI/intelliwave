'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Loader2, Plus } from 'lucide-react'

interface LeaveRequest {
  id: string
  employeeName: string
  type: string
  startDate: string
  endDate: string
  status: string
}

export default function LeavePage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeave()
  }, [])

  const fetchLeave = async () => {
    try {
      const res = await fetch('/api/wavecore/hr/leave')
      const data = await res.json()
      setRequests(data.requests || [])
    } catch (error) {
      console.error('Failed to fetch leave requests')
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
          <span className="text-sm">Leave Management</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-500" /> Leave Requests ({requests.length})
        </h1>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No leave requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => (
              <div key={req.id} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
                <div>
                  <p className="font-bold">{req.employeeName}</p>
                  <p className="text-sm text-muted-foreground">{req.type} Leave</p>
                  <p className="text-xs text-muted-foreground">{req.startDate} to {req.endDate}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  req.status === 'APPROVED' ? 'bg-green-50 text-green-600' :
                  req.status === 'PENDING' ? 'bg-yellow-50 text-yellow-600' :
                  'bg-red-50 text-red-600'
                }`}>{req.status}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}