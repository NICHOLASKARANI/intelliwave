'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowLeft, Users, AlertCircle } from 'lucide-react'

export default function NewCustomerPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '', city: '', country: 'Kenya', notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.name.trim()) {
      setError('Name is required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/wavve-si/restaurant/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          company: form.company.trim() || undefined,
          city: form.city.trim() || undefined,
          country: form.country.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create customer')
      }
      const data = await res.json()
      toast.success(`Customer "${data.customer.name}" created`)
      router.push('/wavve-si/modules/restaurant-hospitality/customers')
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
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
          <h2 className="text-xl font-bold text-white">Add Customer</h2>
          <p className="text-sm text-slate-400">Add a new customer to your restaurant</p>
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
          <label className="block text-sm font-bold text-white mb-2">Name <span className="text-red-400">*</span></label>
          <input type="text" required value={form.name} onChange={e => update('name', e.target.value)}
            placeholder="e.g. John Kamau"
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-white mb-2">Email</label>
            <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
              placeholder="john@example.com"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-bold text-white mb-2">Phone</label>
            <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
              placeholder="+254 700 000 000"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-white mb-2">Company</label>
          <input type="text" value={form.company} onChange={e => update('company', e.target.value)}
            placeholder="Optional"
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-white mb-2">City</label>
            <input type="text" value={form.city} onChange={e => update('city', e.target.value)}
              placeholder="Nairobi"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-bold text-white mb-2">Country</label>
            <input type="text" value={form.country} onChange={e => update('country', e.target.value)}
              placeholder="Kenya"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-white mb-2">Notes</label>
          <textarea value={form.notes} onChange={e => update('notes', e.target.value)}
            rows={3}
            placeholder="Preferences, allergies, special instructions"
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white font-bold rounded-lg transition-colors">
            {loading ? 'Creating...' : 'Create Customer'}
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