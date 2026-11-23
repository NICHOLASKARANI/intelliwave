'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

import { authedFetch } from '@/lib/wavecore/csrf-client'
export default function CreateTicketPage() {
  const [subject, setSubject] = useState('')
  const csrf = () => (typeof document === 'undefined') ? '' : (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [customerId, setCustomerId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [billableHours, setBillableHours] = useState('0')
  const [hourlyRate, setHourlyRate] = useState('0')
  const [customers, setCustomers] = useState<{id:string,name:string}[]>([])
  const [projects, setProjects] = useState<{id:string,title:string,clientId:string|null}[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  React.useEffect(() => {
    (async () => {
      try {
        const [cr, pr] = await Promise.all([
          authedFetch('/api/wavecore/crm/customers'),
          authedFetch('/api/wavecore/projects'),
        ])
        const cd = await cr.json()
        const pd = await pr.json()
        setCustomers(cd.customers || [])
        setProjects(pd.projects || [])
      } catch {}
    })()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!subject || !description) { setError('Subject and description required'); setLoading(false); return }

    try {
      const res = await authedFetch('/api/wavecore/helpdesk/tickets', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({ subject, description, priority, customerId: customerId || null, projectId: projectId || null, billableHours: Number(billableHours) || 0, hourlyRate: Number(hourlyRate) || 0, billableAmount: (Number(billableHours) || 0) * (Number(hourlyRate) || 0) }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess('Ticket created!')
        setSubject(''); setDescription(''); setPriority('MEDIUM'); setCustomerId(''); setProjectId(''); setBillableHours('0'); setHourlyRate('0')
        setTimeout(() => router.push('/wavecore-erp/helpdesk'), 1000)
      } else { setError(data.error || 'Failed') }
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/helpdesk" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <Link href="/wavecore-erp/helpdesk" className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="w-4 h-4" /> Back</Link>
        </div>
      </header>
      <main className="max-w-2xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Create Support Ticket</h1>
        {error && <div className="p-4 mb-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
        {success && <div className="p-4 mb-4 rounded-xl bg-green-50 text-green-600 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {success}</div>}
        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <div><label className="block text-sm font-medium mb-2">Subject *</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" placeholder="Brief summary of issue" required />
          </div>
          <div><label className="block text-sm font-medium mb-2">Description *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" rows={5} placeholder="Describe your issue in detail" required />
          </div>
          <div><label className="block text-sm font-medium mb-2">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border">
              <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-2">Customer (optional)</label>
            <select value={customerId} onChange={(e) => { setCustomerId(e.target.value); setProjectId('') }} className="w-full px-4 py-2.5 rounded-xl border">
              <option value="">— None —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-2">Project (optional)</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border">
              <option value="">— None —</option>
              {projects.filter(p => !customerId || p.clientId === customerId).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium mb-2">Billable Hours</label>
              <input type="number" min="0" step="0.5" value={billableHours} onChange={(e) => setBillableHours(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" />
            </div>
            <div><label className="block text-sm font-medium mb-2">Hourly Rate (KES)</label>
              <input type="number" min="0" step="100" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" />
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Billable Amount: <span className="font-bold text-foreground">KES {((Number(billableHours) || 0) * (Number(hourlyRate) || 0)).toLocaleString()}</span>
          </div>
          <Button type="submit" disabled={loading} className="w-full gap-2 bg-pink-600 hover:bg-pink-700">
            <Save className="w-4 h-4" /> {loading ? 'Creating...' : 'Submit Ticket'}
          </Button>
        </form>
      </main>
    </div>
  )
}