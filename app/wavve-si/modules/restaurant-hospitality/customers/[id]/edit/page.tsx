'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowLeft, Users, AlertCircle } from 'lucide-react'

export default function EditCustomerPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params?.id as string

  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', city: '', country: '', notes: '' })
  const [original, setOriginal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!customerId) return
    fetch(`/api/wavve-si/restaurant/customers/${customerId}`, { cache: 'no-store' })
      .then(async r => {
        if (r.status === 404) { setError('Customer not found'); setLoading(false); return }
        if (!r.ok) throw new Error('Failed to load')
        return r.json()
      })
      .then(data => {
        if (data?.customer) {
          const c = data.customer
          setOriginal(c)
          setForm({
            name: c.name || '',
            email: c.email || '',
            phone: c.phone || '',
            company: c.company || '',
            city: c.city || '',
            country: c.country || '',
            notes: c.notes || '',
          })
        }
        setLoading(false)
      })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [customerId])

  function update(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.name.trim()) { setError('Name is required'); return }

    setSaving(true)
    try {
      const res = await fetch(`/api/wavve-si/restaurant/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          company: form.company.trim() || null,
          city: form.city.trim() || null,
          country: form.country.trim() || null,
          notes: form.notes.trim() || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update')
      }
      toast.success('Customer updated')
      router.push('/wavve-si/modules/restaurant-hospitality/customers')
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  if (error && !original) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-lg text-white mb-1">{error}</p>
        <Link href="/wavve-si/modules/restaurant-hospitality/customers" className="text-sm text-blue-400 hover:underline">Back to Customers</Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <Link href="/wavve-si/modules/restaurant-hospitality/customers" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Customers
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Edit Customer</h2>
          <p className="text-sm text-slate-400">{original?.status || 'Customer'}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 text-red-300 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-bold text-white mb-2">Name</label>
          <input type="text" required value={form.name} onChange={e => update('name', e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-white mb-2">Email</label>
            <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-bold text-white mb-2">Phone</label>
            <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-white mb-2">Company</label>
          <input type="text" value={form.company} onChange={e => update('company', e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-white mb-2">City</label>
            <input type="text" value={form.city} onChange={e => update('city', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-bold text-white mb-2">Country</label>
            <input type="text" value={form.country} onChange={e => update('country', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-white mb-2">Notes</label>
          <textarea value={form.notes} onChange={e => update('notes', e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white font-bold rounded-lg transition-colors">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href="/wavve-si/modules/restaurant-hospitality/customers"
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}