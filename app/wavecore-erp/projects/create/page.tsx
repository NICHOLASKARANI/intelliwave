'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CreateProjectPage() {
  const [formData, setFormData] = useState({
    title: '', description: '', budget: '', startDate: '', endDate: '', status: 'PENDING',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const update = (field: string, value: string) => setFormData({ ...formData, [field]: value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!formData.title) { setError('Project title required'); setLoading(false); return }

    try {
      const res = await fetch('/api/wavecore/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, budget: parseFloat(formData.budget) || 0 }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setSuccess('Project created successfully!')
        setFormData({ title: '', description: '', budget: '', startDate: '', endDate: '', status: 'PENDING' })
        // Redirect to projects list (NOT to detail page)
        setTimeout(() => router.push('/wavecore-erp/projects'), 1000)
      } else {
        setError(data.error || 'Failed to create project')
      }
    } catch {
      setError('Network error')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <Link href="/wavecore-erp/projects" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Create Project</h1>

        {error && <div className="p-4 mb-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
        {success && <div className="p-4 mb-4 rounded-xl bg-green-50 text-green-600 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input type="text" value={formData.title} onChange={(e) => update('title', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border" placeholder="Project title" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea value={formData.description} onChange={(e) => update('description', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border" rows={3} placeholder="Description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-2">Budget (KSh)</label>
              <input type="number" value={formData.budget} onChange={(e) => update('budget', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" min="0" />
            </div>
            <div><label className="block text-sm font-medium mb-2">Status</label>
              <select value={formData.status} onChange={(e) => update('status', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border">
                <option value="PENDING">Pending</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option><option value="ON_HOLD">On Hold</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium mb-2">Start Date</label>
              <input type="date" value={formData.startDate} onChange={(e) => update('startDate', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" />
            </div>
            <div><label className="block text-sm font-medium mb-2">End Date</label>
              <input type="date" value={formData.endDate} onChange={(e) => update('endDate', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full gap-2 bg-teal-600 hover:bg-teal-700">
            <Save className="w-4 h-4" /> {loading ? 'Creating...' : 'Create Project'}
          </Button>
        </form>
      </main>
    </div>
  )
}