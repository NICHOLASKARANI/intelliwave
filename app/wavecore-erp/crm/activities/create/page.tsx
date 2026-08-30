'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Phone, Mail, MessageSquare, Users, Loader2, CheckCircle, Calendar, Clock, Plus, ArrowLeft } from 'lucide-react'

export default function CreateActivityPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    type: 'CALL',
    subject: '',
    description: '',
    customerId: '',
    dueDate: '',
    priority: 'MEDIUM'
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/wavecore/crm/customers')
      const data = await res.json()
      setCustomers(data.customers || [])
    } catch {}
  }

  const createActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.subject.trim()) {
      setError('Subject is required')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/wavecore/crm/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          window.location.href = '/wavecore-erp/crm/activities'
        }, 1500)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to create activity')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const activityTypes = [
    { value: 'CALL', label: 'Phone Call', icon: Phone, color: 'bg-blue-100 text-blue-700' },
    { value: 'EMAIL', label: 'Email', icon: Mail, color: 'bg-green-100 text-green-700' },
    { value: 'MEETING', label: 'Meeting', icon: Users, color: 'bg-purple-100 text-purple-700' },
    { value: 'NOTE', label: 'Note', icon: MessageSquare, color: 'bg-yellow-100 text-yellow-700' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp/crm/activities" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Record Activity</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-3 sm:p-4 lg:p-8">
        <Link href="/wavecore-erp/crm/activities" className="flex items-center gap-1 text-sm text-blue-600 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Activities
        </Link>

        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Plus className="w-6 h-6 text-blue-500" /> Record Activity
        </h1>

        {success ? (
          <div className="bg-green-50 rounded-2xl border border-green-200 p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-green-700">Activity Recorded!</h2>
            <p className="text-muted-foreground">Redirecting...</p>
          </div>
        ) : (
          <form onSubmit={createActivity} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 space-y-4">
            {/* Activity Type */}
            <div>
              <label className="text-sm font-medium mb-2 block">Activity Type</label>
              <div className="grid grid-cols-4 gap-2">
                {activityTypes.map(type => {
                  const Icon = type.icon
                  return (
                    <button key={type.value} type="button" onClick={() => setFormData({...formData, type: type.value})}
                      className={`p-3 rounded-xl border text-center transition-all ${formData.type === type.value ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-300'}`}>
                      <Icon className={`w-5 h-5 mx-auto mb-1 ${formData.type === type.value ? 'text-blue-600' : 'text-muted-foreground'}`} />
                      <span className="text-xs font-bold">{type.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="text-sm font-medium mb-2 block">Subject *</label>
              <input type="text" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})}
                placeholder="e.g. Follow up call with client"
                className="w-full px-4 py-2.5 rounded-xl border" required />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Details of the activity..."
                className="w-full px-4 py-2.5 rounded-xl border min-h-[100px]" />
            </div>

            {/* Customer */}
            <div>
              <label className="text-sm font-medium mb-2 block">Customer</label>
              <select value={formData.customerId} onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl border">
                <option value="">Select customer...</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
            </div>

            {/* Due Date + Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Due Date
                </label>
                <input type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                  <Clock className="w-4 h-4" /> Priority
                </label>
                <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>

            {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {loading ? 'Recording...' : 'Record Activity'}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}