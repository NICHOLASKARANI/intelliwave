'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Activity, Search, Trash2, Loader2, Printer, Phone, Mail, Users, MessageSquare } from 'lucide-react'

interface Activity {
  id: string
  type: string
  subject: string
  description: string
  priority: string
  createdAt: string
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState('')

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/crm/activities')
      const data = await res.json()
      setActivities(data.activities || [])
    } catch (err) {
      setError('Failed to load activities')
    } finally {
      setLoading(false)
    }
  }

  const deleteActivity = async (id: string) => {
    if (!confirm('Delete this activity?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/wavecore/crm/activities?id=${id}`, { method: 'DELETE' })
      if (res.ok) fetchActivities()
    } catch (err) {
      setError('Delete failed')
    } finally {
      setDeleting('')
    }
  }

  const downloadPdf = (id: string) => {
    window.open(`/api/wavecore/crm/activities/${id}/pdf`, '_blank')
  }

  const filtered = activities.filter(a => 
    (a.subject || '').toLowerCase().includes(search.toLowerCase())
  )

  const typeIcon = (type: string) => {
    switch (type) {
      case 'CALL': return Phone
      case 'EMAIL': return Mail
      case 'MEETING': return Users
      default: return MessageSquare
    }
  }

  const typeColor = (type: string) => {
    switch (type) {
      case 'CALL': return 'bg-blue-100 text-blue-700'
      case 'EMAIL': return 'bg-green-100 text-green-700'
      case 'MEETING': return 'bg-purple-100 text-purple-700'
      default: return 'bg-yellow-100 text-yellow-700'
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp/crm" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Activities</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-500" /> Activities ({activities.length})
          </h1>
          <Link href="/wavecore-erp/crm/activities/create"
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> Record Activity
          </Link>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600">{error}</div>}

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search activities..." />
        </div>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No activities yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(activity => {
              const Icon = typeIcon(activity.type)
              return (
                <div key={activity.id} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${typeColor(activity.type)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold">{activity.subject}</p>
                      <p className="text-sm text-muted-foreground">{activity.type} | {activity.priority} | {new Date(activity.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => downloadPdf(activity.id)} title="Download PDF"
                      className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                      <Printer className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteActivity(activity.id)} title="Delete"
                      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                      {deleting === activity.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}