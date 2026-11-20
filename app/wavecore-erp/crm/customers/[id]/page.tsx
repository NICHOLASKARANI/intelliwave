'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Loader2, AlertTriangle, Users, Printer, Trash2,
  User, Mail, Phone, Building2, Calendar, DollarSign, Save, X, Edit3,
  FileText, Package, TrendingUp, Activity as ActivityIcon, Target,
  Receipt, CheckCircle2, CreditCard, Tag, Plus, X as XIcon, MessageCircle, PhoneCall,
} from 'lucide-react'
import { buildWhatsAppLink, buildMessage } from '@/lib/wavecore/crm/whatsapp'

type Tab =
  | 'overview'
  | 'contacts'
  | 'opportunities'
  | 'quotations'
  | 'orders'
  | 'invoices'
  | 'payments'
  | 'activities'
  | 'communications'

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  address?: string
  city?: string
  country?: string
  taxId?: string
  website?: string
  notes?: string
  type?: string
  status?: string
  source?: string
  tags?: string[]
  createdAt: string
}

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB') : '—'
const fmtMoney = (n: any) => 'KSh ' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params.id || '')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [data, setData] = useState<any>({})
  const [working, setWorking] = useState(false)
  const [editing, setEditing] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')
  const [form, setForm] = useState<any>({})
  const [tagInput, setTagInput] = useState('')
  const [tagsSaving, setTagsSaving] = useState(false)
  const [showAddContact, setShowAddContact] = useState(false)
  const [contactSaving, setContactSaving] = useState(false)
  const [contactForm, setContactForm] = useState({ firstName: '', lastName: '', email: '', phone: '', whatsappNumber: '', position: '', department: '', isPrimary: false, isDecisionMaker: false, consentEmail: true, consentSms: true, consentWhatsapp: true, notes: '' })

  // Phase 2B — Communication log state
  const [showLogComm, setShowLogComm] = useState(false)
  const [commLogs, setCommLogs] = useState<any[]>([])
  const [commLoading, setCommLoading] = useState(false)
  const [commSaving, setCommSaving] = useState(false)
  const [commForm, setCommForm] = useState({ channel: 'CALL', subject: '', body: '', contactName: '' })

  const csrf = () => (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '')
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3500) }

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/crm/customers/' + id, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to load'); return }
      setCustomer(json.customer)
      setData(json)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (id) load() /* eslint-disable-next-line */ }, [id])

  useEffect(() => {
    if (tab === 'communications' && commLogs.length === 0) loadComms()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  // Phase 1 — Contacts handlers
  const openAddContact = () => {
    setContactForm({ firstName: '', lastName: '', email: '', phone: '', whatsappNumber: '', position: '', department: '', isPrimary: false, isDecisionMaker: false, consentEmail: true, consentSms: true, consentWhatsapp: true, notes: '' })
    setShowAddContact(true)
  }
  const saveContact = async () => {
    if (!contactForm.firstName.trim() || !contactForm.lastName.trim()) { setError('First name and last name are required'); return }
    setContactSaving(true); setError(''); setSuccess('')
    try {
      const res = await fetch('/api/wavecore/crm/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() }, body: JSON.stringify({ ...contactForm, customerId: id }) })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to save contact'); return }
      setShowAddContact(false); setSuccess('Contact added'); await load()
    } catch { setError('Network error') } finally { setContactSaving(false) }
  }

  // Phase 2B — Communication log helpers
  const logComm = (c: any, channel: string, subject?: string, body?: string) => {
    // Fire-and-forget logging. The actual WhatsApp/Call/Email still opens in the user's app.
    fetch('/api/wavecore/crm/communications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
      body: JSON.stringify({
        customerId: id,
        contactId: c?.id || null,
        channel,
        direction: 'OUTBOUND',
        subject: subject || null,
        body: body || null,
        contactName: c ? [c.firstName, c.lastName].filter(Boolean).join(' ') : null,
      }),
    }).then(r => r.ok ? loadComms() : null).catch(() => {})
  }

  const loadComms = async () => {
    setCommLoading(true)
    try {
      const res = await fetch('/api/wavecore/crm/communications?customerId=' + id, { cache: 'no-store' })
      const json = await res.json()
      if (res.ok) setCommLogs(json.communications || [])
    } catch {} finally {
      setCommLoading(false)
    }
  }

  const saveCommLog = async () => {
    setCommSaving(true)
    try {
      const res = await fetch('/api/wavecore/crm/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({
          customerId: id,
          channel: commForm.channel,
          direction: 'OUTBOUND',
          subject: commForm.subject || null,
          body: commForm.body || null,
          contactName: commForm.contactName || null,
        }),
      })
      if (res.ok) {
        setShowLogComm(false)
        await loadComms()
      }
    } catch {} finally {
      setCommSaving(false)
    }
  }
  const sendWhatsApp = (c: any) => {
    const phone = c.whatsappNumber || c.phone
    if (!phone) { setError('No WhatsApp or phone number'); return }
    const msg = buildMessage({ contactName: c.firstName, customerName: customer?.name, context: 'reaching out from our team.' })
    const link = buildWhatsAppLink(phone, msg)
    if (link) window.open(link, '_blank', 'noopener,noreferrer')
    else setError('Could not normalize phone: ' + phone)
  }
  const startEdit = () => {
    if (!customer) return
    setForm({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      company: customer.company || '',
      address: customer.address || '',
      city: customer.city || '',
      country: customer.country || '',
      taxId: customer.taxId || '',
      website: customer.website || '',
      notes: customer.notes || '',
      type: customer.type || 'INDIVIDUAL',
      status: customer.status || 'ACTIVE',
      source: customer.source || '',
    })
    setEditing(true)
  }

  const saveEdit = async () => {
    setWorking(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/crm/customers/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Save failed'); return }
      setCustomer(json.customer)
      setEditing(false)
      flash('Customer updated')
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    } finally {
      setWorking(false)
    }
  }

  const saveTags = async (next: string[]) => {
    if (!customer) return
    setTagsSaving(true)
    try {
      const res = await fetch('/api/wavecore/crm/customers/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({ tags: next }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Tag update failed'); return }
      setCustomer({ ...customer, tags: next })
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    } finally {
      setTagsSaving(false)
    }
  }

  const addTag = async () => {
    const t = tagInput.trim()
    if (!t || !customer) return
    const current = customer.tags || []
    if (current.includes(t)) { setTagInput(''); return }
    await saveTags([...current, t])
    setTagInput('')
  }

  const removeTag = async (t: string) => {
    if (!customer) return
    const next = (customer.tags || []).filter(x => x !== t)
    await saveTags(next)
  }

  const deleteCustomer = async () => {
    if (!customer) return
    if (!confirm('Delete customer "' + customer.name + '"? This cascades contacts, deals, quotations, orders, invoices, payments, and activities. Cannot be undone.')) return
    setWorking(true)
    try {
      const res = await fetch('/api/wavecore/crm/customers/' + id, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrf() },
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error || 'Delete failed')
        return
      }
      router.push('/wavecore-erp/crm/customers')
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    } finally {
      setWorking(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error && !customer) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
          <div className="flex items-center gap-3 px-4 h-16">
            <Link href="/wavecore-erp/crm/customers" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-bold">Customer</span>
          </div>
        </header>
        <main className="max-w-3xl mx-auto p-8">
          <div className="p-6 rounded-2xl bg-red-900/20 border border-red-800 text-red-300 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}
          </div>
        </main>
      </div>
    )
  }

  if (!customer) return null

  const stats = data.stats || { counts: {} }
  const counts = stats.counts || {}

  const TABS: { key: Tab; label: string; icon: any; count: number }[] = [
    { key: 'overview',      label: 'Overview',      icon: Users,       count: 0 },
    { key: 'contacts',      label: 'Contacts',      icon: User,        count: counts.contacts || 0 },
    { key: 'opportunities', label: 'Deals',         icon: TrendingUp,  count: counts.opportunities || 0 },
    { key: 'quotations',    label: 'Quotations',    icon: FileText,    count: counts.quotations || 0 },
    { key: 'orders',        label: 'Orders',        icon: Package,     count: counts.orders || 0 },
    { key: 'invoices',      label: 'Invoices',      icon: Receipt,     count: counts.invoices || 0 },
    { key: 'payments',      label: 'Payments',      icon: CreditCard,  count: counts.payments || 0 },
    { key: 'activities',    label: 'Activities',    icon: ActivityIcon,count: counts.activities || 0 },
    { key: 'communications', label: 'Communication', icon: MessageCircle, count: commLogs.length || 0 },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <Link href="/wavecore-erp/crm/customers" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={32} height={32} className="rounded-lg object-cover" />
            <div>
              <p className="text-xs text-neutral-500">Customer</p>
              <p className="font-bold">{customer.name}</p>
            </div>
            <span className={'ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ' + (customer.status === 'ACTIVE' ? 'bg-emerald-900/50 text-emerald-300' : 'bg-neutral-800 text-neutral-400')}>
              {customer.status || 'ACTIVE'}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={'/api/wavecore/crm/customers/' + id + '/pdf'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Print / PDF
            </a>
            {!editing ? (
              <button
                onClick={startEdit}
                className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" /> Edit
              </button>
            ) : (
              <>
                <button
                  onClick={() => setEditing(false)}
                  disabled={working}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2 disabled:opacity-40"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={working}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40"
                >
                  {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </>
            )}
            <button
              onClick={deleteCustomer}
              disabled={working}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">

        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-6 lg:p-8 mb-6 text-white">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-1 flex items-center gap-3">
                <Users className="w-8 h-8" /> {customer.name}
              </h1>
              <p className="text-white/80 text-sm">
                {customer.company || 'No company'} · {customer.city || 'No city'} · Customer since {fmtDate(customer.createdAt)}
              </p>
              {(customer.tags && customer.tags.length > 0) && (
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {customer.tags.map(t => (
                    <span key={t} className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/20 text-white backdrop-blur">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right text-sm">
              <p>Balance: <strong>{fmtMoney(stats.balance)}</strong></p>
              <p>Lifetime invoiced: {fmtMoney(stats.totalInvoiced)}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-900/30 text-emerald-300 border border-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> {success}
          </div>
        )}

        {/* Stat tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatTile label="Open deals" value={fmtMoney(stats.openOppsValue)} sub={(counts.opportunities || 0) + ' deals'} color="text-emerald-500" />
          <StatTile label="Quoted" value={fmtMoney(stats.totalQuoted)} sub={(counts.quotations || 0) + ' quotes'} color="text-amber-500" />
          <StatTile label="Ordered" value={fmtMoney(stats.totalOrdered)} sub={(counts.orders || 0) + ' orders'} color="text-rose-500" />
          <StatTile label="Invoiced / Paid" value={fmtMoney(stats.totalInvoiced) + ' / ' + fmtMoney(stats.totalPaid)} sub={'balance ' + fmtMoney(stats.balance)} color="text-indigo-500" />
        </div>

        {editing ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 mb-6">
            <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Edit customer</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                ['name','Name','text'],
                ['email','Email','email'],
                ['phone','Phone','text'],
                ['company','Company','text'],
                ['taxId','Tax ID','text'],
                ['website','Website','text'],
                ['address','Address','text'],
                ['city','City','text'],
                ['country','Country','text'],
                ['source','Source','text'],
              ].map(([k, label, type]) => (
                <div key={k as string}>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">{label}</label>
                  <input
                    type={type as string}
                    value={form[k as string] || ''}
                    onChange={(e) => setForm({ ...form, [k as string]: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="COMPANY">Company</option>
                  <option value="GOVERNMENT">Government</option>
                  <option value="NGO">NGO</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-neutral-500 mb-1">Notes</label>
                <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {TABS.map(t => {
                const Icon = t.icon
                const active = tab === t.key
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={
                      'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition ' +
                      (active
                        ? 'bg-white dark:bg-neutral-900 border-2 border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:border-neutral-400')
                    }
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                    {t.count > 0 && (
                      <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (active ? 'bg-blue-500 text-white' : 'bg-neutral-200 dark:bg-neutral-800')}>
                        {t.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Tab content */}
            {tab === 'overview' && (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
                  <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> Company details
                  </h3>
                  <div className="space-y-3 text-sm">
                    <Row label="Company" value={customer.company} />
                    <Row label="Type" value={customer.type} />
                    <Row label="Tax ID" value={customer.taxId} />
                    <Row label="Website" value={customer.website} link={customer.website} />
                    <Row label="Source" value={customer.source} />
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
                  <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Contact details
                  </h3>
                  <div className="space-y-3 text-sm">
                    <Row label="Email" value={customer.email} />
                    <Row label="Phone" value={customer.phone} />
                    <Row label="Address" value={customer.address} />
                    <Row label="City" value={customer.city} />
                    <Row label="Country" value={customer.country} />
                  </div>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
                  <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2">
                    <Tag className="w-4 h-4" /> Tags
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    {(customer.tags || []).length === 0 && (
                      <p className="text-sm text-neutral-500 italic">No tags yet</p>
                    )}
                    {(customer.tags || []).map(t => (
                      <span key={t} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                        {t}
                        <button
                          type="button"
                          onClick={() => removeTag(t)}
                          disabled={tagsSaving}
                          className="hover:text-red-500 disabled:opacity-40"
                          title="Remove tag"
                        >
                          <XIcon className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                      placeholder="Add a tag (VIP, partner, reseller…)"
                      className="flex-1 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      disabled={tagsSaving || !tagInput.trim()}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center gap-1 disabled:opacity-40"
                    >
                      {tagsSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Add
                    </button>
                  </div>
                </div>

                {customer.notes && (
                  <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
                    <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Notes
                    </h3>
                    <p className="text-sm whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">{customer.notes}</p>
                  </div>
                )}
              </div>
            )}

            {tab === 'contacts' && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
                  <div>
                    <h3 className="font-bold">Contacts</h3>
                    <p className="text-xs text-neutral-500">{(data.contacts || []).length} contact(s) — B2B multi-contact record</p>
                  </div>
                  <button onClick={openAddContact}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Contact
                  </button>
                </div>
                {(data.contacts || []).length === 0 ? (
                  <Empty msg="No contacts recorded for this customer. Click Add Contact to add the first one." />
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                      <tr className="text-left text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
                        <th className="px-6 py-3">Name</th>
                        <th className="px-4 py-3">Position</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Phone / WhatsApp</th>
                        <th className="px-4 py-3">Badges</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.contacts || []).map((c: any) => (
                        <tr key={c.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                          <td className="px-6 py-3 font-bold">
                            {c.firstName} {c.lastName}
                            {c.isPrimary && <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-green-100 text-green-700 font-bold">PRIMARY</span>}
                          </td>
                          <td className="px-4 py-3 text-xs text-neutral-500">{c.position || '—'}</td>
                          <td className="px-4 py-3 text-xs">{c.email || '—'}</td>
                          <td className="px-4 py-3 text-xs">
                            {c.whatsappNumber || c.phone || '—'}
                          </td>
                          <td className="px-4 py-3 text-xs space-x-1">
                            {c.isDecisionMaker && <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-bold">DM</span>}
                            {c.consentWhatsapp === false && <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">No WA consent</span>}
                          </td>
                          <td className="px-4 py-3 text-right space-x-1">
                            {(c.whatsappNumber || c.phone) && (
                              <button onClick={() => sendWhatsApp(c)} title="WhatsApp"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-bold">
                                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                              </button>
                            )}
                            {c.phone && (
                              <a href={'tel:' + c.phone} title="Call"
                                className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold">
                                <PhoneCall className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {c.email && (
                              <a href={'mailto:' + c.email} title="Email"
                                className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-bold">
                                <Mail className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
            {tab === 'opportunities' && (
              <SimpleTable
                empty="No deals for this customer."
                rows={data.opportunities}
                cols={[
                  { k: 'name', label: 'Deal', href: (r: any) => '/wavecore-erp/crm/opportunities/' + r.id, bold: true },
                  { k: 'stage', label: 'Stage' },
                  { k: 'probability', label: 'Prob %' },
                  { k: 'amount', label: 'Amount', money: true },
                  { k: 'expectedCloseDate', label: 'Close', date: true },
                ]}
              />
            )}

            {tab === 'quotations' && (
              <SimpleTable
                empty="No quotations for this customer."
                rows={data.quotations}
                cols={[
                  { k: 'number', label: 'Quote#', href: (r: any) => '/wavecore-erp/crm/quotations/' + r.id, bold: true },
                  { k: 'status', label: 'Status' },
                  { k: 'total', label: 'Total', money: true },
                  { k: 'validUntil', label: 'Valid until', date: true },
                  { k: 'createdAt', label: 'Created', date: true },
                ]}
              />
            )}

            {tab === 'orders' && (
              <SimpleTable
                empty="No orders for this customer."
                rows={data.orders}
                cols={[
                  { k: 'number', label: 'Order#', href: (r: any) => '/wavecore-erp/crm/orders/' + r.id, bold: true },
                  { k: 'status', label: 'Status' },
                  { k: 'total', label: 'Total', money: true },
                  { k: 'createdAt', label: 'Created', date: true },
                ]}
              />
            )}

            {tab === 'invoices' && (
              <SimpleTable
                empty="No invoices for this customer."
                rows={data.invoices}
                cols={[
                  { k: 'number', label: 'Invoice#', bold: true },
                  { k: 'status', label: 'Status' },
                  { k: 'total', label: 'Total', money: true },
                  { k: 'dueDate', label: 'Due', date: true },
                  { k: 'createdAt', label: 'Created', date: true },
                ]}
              />
            )}

            {tab === 'payments' && (
              <SimpleTable
                empty="No payments for this customer."
                rows={data.payments}
                cols={[
                  { k: 'number', label: 'Payment#', bold: true },
                  { k: 'method', label: 'Method' },
                  { k: 'reference', label: 'Reference' },
                  { k: 'amount', label: 'Amount', money: true },
                  { k: 'createdAt', label: 'Date', date: true },
                ]}
              />
            )}

            {tab === 'activities' && (
              <SimpleTable
                empty="No activities for this customer."
                rows={data.activities}
                cols={[
                  { k: 'subject', label: 'Subject', href: (r: any) => '/wavecore-erp/crm/activities/' + r.id, bold: true },
                  { k: 'type', label: 'Type' },
                  { k: 'dueDate', label: 'Due', date: true },
                  { k: 'completed', label: 'Done' },
                  { k: 'createdAt', label: 'Created', date: true },
                ]}
              />
            )}

            {tab === 'communications' && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
                  <h3 className="font-bold">Communication Timeline</h3>
                  <p className="text-xs text-neutral-500">{commLogs.length} logged touchpoint(s)</p>
                </div>
                {commLoading ? (
                  <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" /></div>
                ) : commLogs.length === 0 ? (
                  <Empty msg="No communication logged yet. Use the WhatsApp, Call, or Email buttons on a contact, or log a meeting manually." />
                ) : (
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {commLogs.map((log: any) => (
                      <div key={log.id} className="p-4 flex items-start gap-3">
                        <div className={"w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 " + (
                          log.channel === "WHATSAPP" ? "bg-green-100 text-green-700" :
                          log.channel === "EMAIL" ? "bg-blue-100 text-blue-700" :
                          log.channel === "CALL" ? "bg-purple-100 text-purple-700" :
                          log.channel === "MEETING" ? "bg-amber-100 text-amber-700" :
                          "bg-neutral-100 text-neutral-700"
                        )}>
                          <MessageCircle className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="font-bold text-sm">{log.channel}</span>
                            <span className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">{log.direction}</span>
                            {log.contactName && <span className="text-xs text-neutral-500">— {log.contactName}</span>}
                            <span className="ml-auto text-xs text-neutral-400">{fmtDate(log.sentAt || log.createdAt)}</span>
                          </div>
                          {log.subject && <p className="text-sm font-medium mt-0.5">{log.subject}</p>}
                          {log.body && <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 whitespace-pre-wrap">{log.body}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

      {/* Phase 1 — Add Contact modal */}
      {showAddContact && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowAddContact(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Add Contact</h3>
              <button onClick={() => setShowAddContact(false)} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">First Name *</label>
                  <input value={contactForm.firstName} onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">Last Name *</label>
                  <input value={contactForm.lastName} onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Position</label>
                <input value={contactForm.position} onChange={(e) => setContactForm({ ...contactForm, position: e.target.value })}
                  placeholder="e.g., Procurement Manager"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Department</label>
                <input value={contactForm.department} onChange={(e) => setContactForm({ ...contactForm, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">Email</label>
                  <input type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">Phone</label>
                  <input type="tel" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    placeholder="0712345678"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">WhatsApp Number</label>
                <input type="tel" value={contactForm.whatsappNumber} onChange={(e) => setContactForm({ ...contactForm, whatsappNumber: e.target.value })}
                  placeholder="0712345678 (leave blank to use phone)"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm" />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={contactForm.isPrimary} onChange={(e) => setContactForm({ ...contactForm, isPrimary: e.target.checked })} />
                  Primary contact
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={contactForm.isDecisionMaker} onChange={(e) => setContactForm({ ...contactForm, isDecisionMaker: e.target.checked })} />
                  Decision maker
                </label>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs font-bold text-neutral-500 mb-2">Communication Consent (Kenya DPA 2019)</p>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={contactForm.consentEmail} onChange={(e) => setContactForm({ ...contactForm, consentEmail: e.target.checked })} />
                    Allow email
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={contactForm.consentSms} onChange={(e) => setContactForm({ ...contactForm, consentSms: e.target.checked })} />
                    Allow SMS
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={contactForm.consentWhatsapp} onChange={(e) => setContactForm({ ...contactForm, consentWhatsapp: e.target.checked })} />
                    Allow WhatsApp
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Notes</label>
                <textarea value={contactForm.notes} onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowAddContact(false)} disabled={contactSaving}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-neutral-100 dark:bg-neutral-800 disabled:opacity-40">
                Cancel
              </button>
              <button onClick={saveContact} disabled={contactSaving}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40">
                {contactSaving ? 'Saving...' : 'Save Contact'}
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>

  )
}

function StatTile({ label, value, sub, color }: any) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
      <p className={'text-xl font-bold ' + color}>{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold mt-1">{label}</p>
      <p className="text-[10px] text-neutral-400 mt-0.5">{sub}</p>
    </div>
  )
}

function Row({ label, value, link }: any) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-neutral-500">{label}</span>
      {link ? (
        <a href={link.startsWith('http') ? link : 'https://' + link} target="_blank" rel="noreferrer" className="text-right text-blue-500 hover:underline max-w-[60%] truncate">
          {value || '—'}
        </a>
      ) : (
        <span className="text-right font-medium max-w-[60%] truncate">{value || '—'}</span>
      )}
    </div>
  )
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="p-12 text-center text-neutral-500 text-sm">
      {msg}
    </div>
  )
}

function SimpleTable({ rows, cols, empty }: any) {
  if (!rows || rows.length === 0) return <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800"><Empty msg={empty} /></div>
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
            <tr className="text-left text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
              {cols.map((c: any) => <th key={c.k} className="px-4 py-3">{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                {cols.map((c: any) => {
                  const raw = r[c.k]
                  let display: any = raw
                  if (c.money) display = fmtMoney(raw)
                  else if (c.date) display = fmtDate(raw)
                  else if (typeof raw === 'boolean') display = raw ? '✓' : ''
                  else if (raw == null) display = '—'

                  return (
                    <td key={c.k} className={'px-4 py-3 ' + (c.bold ? 'font-bold' : 'text-xs ' + (c.money ? 'font-bold' : 'text-neutral-500'))}>
                      {c.href ? (
                        <Link href={c.href(r)} className="text-blue-600 dark:text-blue-400 hover:underline">
                          {display}
                        </Link>
                      ) : (
                        display
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}