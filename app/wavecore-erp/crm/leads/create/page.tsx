'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, AlertCircle, AlertTriangle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DupMatch {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  status?: string
  match_type: string
}

export default function AddLeadPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [source, setSource] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dups, setDups] = useState<DupMatch[]>([])
  const [dismissed, setDismissed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (dismissed) return
    const t = setTimeout(async () => {
      const params = new URLSearchParams()
      if (email.trim()) params.set('email', email.trim())
      if (phone.trim()) params.set('phone', phone.trim())
      if (name.trim().length >= 3) params.set('name', name.trim())
      if ([...params.keys()].length === 0) { setDups([]); return }
      try {
        const res = await fetch('/api/wavecore/crm/leads/check-duplicate?' + params.toString(), { cache: 'no-store' })
        const data = await res.json()
        setDups(data.matches || [])
      } catch {
        setDups([])
      }
    }, 500)
    return () => clearTimeout(t)
  }, [email, phone, name, dismissed])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!name) { setError('Name is required'); setLoading(false); return }

    try {
      const res = await fetch('/api/wavecore/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '') },
        body: JSON.stringify({ name, email: email || null, phone: phone || null, company: company || null, source: source || null }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to add lead'); return }
      router.push('/wavecore-erp/crm/leads')
      router.refresh()
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
              <span className="font-bold">WaveCore</span>
            </Link>
            <span className="text-sm">Add Lead</span>
          </div>
          <Link href="/wavecore-erp/crm/leads" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Add Lead</h1>

        {error && <div className="p-4 mb-6 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}

        {dups.length > 0 && !dismissed && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800">
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                  Possible duplicate{dups.length > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  We found {dups.length} similar lead{dups.length > 1 ? 's' : ''} already in your CRM.
                </p>
              </div>
              <button type="button" onClick={() => setDismissed(true)} className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline">
                Ignore
              </button>
            </div>
            <div className="space-y-2">
              {dups.map(d => (
                <Link
                  key={d.id}
                  href={'/wavecore-erp/crm/leads/' + d.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-900 hover:border-amber-400 transition"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{d.name}{d.status ? ' · ' + d.status : ''}</p>
                    <p className="text-xs text-neutral-500 truncate">
                      {d.email || d.phone || d.company || 'no contact info'}
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-amber-600">match: {d.match_type}</span>
                    </p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <div>
            <label className="block text-sm font-medium mb-2">Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Company</label>
            <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Source</label>
            <select value={source} onChange={(e) => setSource(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border">
              <option value="">Select source...</option>
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Social Media">Social Media</option>
              <option value="Cold Call">Cold Call</option>
              <option value="Email">Email</option>
              <option value="Event">Event</option>
            </select>
          </div>
          <Button type="submit" disabled={loading} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Save className="w-4 h-4" /> {loading ? 'Adding...' : 'Add Lead'}
          </Button>
        </form>
      </main>
    </div>
  )
}