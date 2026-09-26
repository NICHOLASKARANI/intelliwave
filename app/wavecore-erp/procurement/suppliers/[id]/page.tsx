'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  Users, ArrowLeft, Loader2, AlertTriangle, CheckCircle2, Star, Ban,
  Mail, Phone, Globe, MapPin, Building2, FileText, CreditCard,
  TrendingUp, History, Shield, Activity, Plus, X, Save, Edit3,
  Trash2, Download, ExternalLink, Calendar, DollarSign, Package, FileDown,
  FileSpreadsheet, Receipt, Clock,
} from 'lucide-react'

type Tab = 'overview' | 'contacts' | 'bank' | 'documents' | 'scorecards' | 'risks' | 'activity'

export default function SupplierDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params.id || '')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tab, setTab] = useState<Tab>('overview')

  const [supplier, setSupplier] = useState<any>(null)
  const [contacts, setContacts] = useState<any[]>([])
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [scorecards, setScorecards] = useState<any[]>([])
  const [risks, setRisks] = useState<any[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [quotations, setQuotations] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any>({ lifetime_spend: 0, po_count: 0 })

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  // Sub-modal forms
  const [subModal, setSubModal] = useState<null | 'contact' | 'bank' | 'document' | 'scorecard' | 'risk'>(null)
  const [subForm, setSubForm] = useState<any>({})
  const [subSaving, setSubSaving] = useState(false)

  // Document preview modal
  const [previewDoc, setPreviewDoc] = useState<any>(null)

  const csrf = () => document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || ''
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/procurement/suppliers/' + id)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      setSupplier(data.supplier)
      setContacts(data.contacts || [])
      setBankAccounts(data.bankAccounts || [])
      setDocuments(data.documents || [])
      setScorecards(data.scorecards || [])
      setRisks(data.risks || [])
      setPurchaseOrders(data.purchaseOrders || [])
      setQuotations(data.quotations || [])
      setActivity(data.activity || [])
      setMetrics(data.metrics || { lifetime_spend: 0, po_count: 0 })
      setForm({
        name: data.supplier.name || '',
        legalName: data.supplier.legalName || '',
        tradingName: data.supplier.tradingName || '',
        registrationNumber: data.supplier.registrationNumber || '',
        taxPin: data.supplier.taxPin || '',
        email: data.supplier.email || '',
        phone: data.supplier.phone || '',
        primaryEmail: data.supplier.primaryEmail || '',
        primaryPhone: data.supplier.primaryPhone || '',
        category: data.supplier.category || '',
        country: data.supplier.country || '',
        county: data.supplier.county || '',
        city: data.supplier.city || '',
        address: data.supplier.address || '',
        website: data.supplier.website || '',
        currency: data.supplier.currency || 'KES',
        paymentTerms: data.supplier.paymentTerms || 30,
        creditLimit: data.supplier.creditLimit || 0,
        status: data.supplier.status || 'ACTIVE',
        isPreferred: data.supplier.isPreferred || false,
        isBlacklisted: data.supplier.isBlacklisted || false,
        blacklistReason: data.supplier.blacklistReason || '',
        notes: data.supplier.notes || '',
      })
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (id) fetchAll() /* eslint-disable-next-line */ }, [id])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/wavecore/procurement/suppliers/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify(form),
      })
      if (res.ok) { flash('Supplier updated'); setEditing(false); fetchAll() }
      else { const d = await res.json(); setError(d.error || 'Save failed') }
    } finally { setSaving(false) }
  }

  const softDelete = async () => {
    if (!confirm('Deactivate "' + supplier.name + '"? It will be marked INACTIVE.')) return
    const res = await fetch('/api/wavecore/procurement/suppliers/' + id, {
      method: 'DELETE', headers: { 'X-CSRF-Token': csrf() },
    })
    if (res.ok) { flash('Supplier deactivated'); fetchAll() }
  }

  // ---- Sub-modal handlers ----
  const submitSub = async () => {
    if (!subModal) return
    setSubSaving(true)
    try {
      let url = '/api/wavecore/procurement/suppliers/' + id
      if (subModal === 'contact') url += '/contacts'
      if (subModal === 'bank') url += '/bank-accounts'
      if (subModal === 'document') url += '/documents'
      if (subModal === 'scorecard') url += '/scorecards'
      if (subModal === 'risk') url += '/risks'

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify(subForm),
      })
      if (res.ok) {
        flash(subModal + ' added')
        setSubModal(null); setSubForm({}); fetchAll()
      } else {
        const d = await res.json()
        setError(d.error || 'Failed')
      }
    } finally { setSubSaving(false) }
  }

  const riskColor = (level?: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-400'
      case 'HIGH': return 'text-orange-400'
      case 'MEDIUM': return 'text-amber-400'
      default: return 'text-green-400'
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
    </div>
  )

  if (error && !supplier) return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
        <p className="text-red-300 mb-4">{error}</p>
        <Link href="/wavecore-erp/procurement/suppliers" className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold">Back to Suppliers</Link>
      </div>
    </div>
  )

  if (!supplier) return null

  const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: 'overview',   label: 'Overview',   icon: Building2 },
    { key: 'contacts',   label: 'Contacts',   icon: Users,       count: contacts.length },
    { key: 'bank',       label: 'Bank',       icon: CreditCard,  count: bankAccounts.length },
    { key: 'documents',  label: 'Documents',  icon: FileText,    count: documents.length },
    { key: 'scorecards', label: 'Scorecards', icon: TrendingUp,  count: scorecards.length },
    { key: 'risks',      label: 'Risks',      icon: Shield,      count: risks.length },
    { key: 'activity',   label: 'Activity',   icon: Activity,    count: activity.length },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/procurement" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-500">Procurement · Supplier</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <Link href="/wavecore-erp/procurement/suppliers" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Suppliers
        </Link>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2"><AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/30 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-6 lg:p-8 mb-6">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div className="flex items-start gap-4 flex-1 min-w-[280px]">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                {editing ? (
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full text-2xl font-bold bg-white/10 border border-white/30 rounded-lg px-3 py-1.5 text-white mb-2" />
                ) : (
                  <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 flex items-center gap-2 flex-wrap">
                    {supplier.name}
                    {supplier.isPreferred && <Star className="w-5 h-5 text-amber-400 fill-amber-400" />}
                    {supplier.isBlacklisted && <Ban className="w-5 h-5 text-red-400" />}
                  </h1>
                )}
                <div className="flex flex-wrap gap-3 text-xs text-white/80">
                  <span className={'font-bold uppercase ' + riskColor(supplier.riskLevel)}>{supplier.riskLevel || 'LOW'} risk</span>
                  <span>·</span>
                  <span>{supplier.category || 'General'}</span>
                  <span>·</span>
                  <span>{supplier.status || 'ACTIVE'}</span>
                  {supplier.taxPin && <><span>·</span><span>PIN {supplier.taxPin}</span></>}
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {editing ? (
                <>
                  <button onClick={save} disabled={saving} className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold flex items-center gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                  </button>
                  <button onClick={() => setEditing(false)} className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold">
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditing(true)} className="px-4 py-2.5 rounded-xl bg-white text-indigo-700 font-bold flex items-center gap-2 shadow-lg">
                    <Edit3 className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => window.open('/api/wavecore/procurement/suppliers/' + id + '/export/pdf', '_blank')}
                    className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2"
                    title="Export PDF"
                  >
                    <FileDown className="w-4 h-4" /> Export PDF
                  </button>
                  <button onClick={softDelete} className="px-4 py-2.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-bold flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Deactivate
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="rounded-2xl bg-white/10 backdrop-blur p-4">
              <DollarSign className="w-5 h-5 text-white/70 mb-1" />
              <p className="text-2xl font-bold text-white">{supplier.currency || 'KES'} {Number(metrics.lifetime_spend || 0).toLocaleString()}</p>
              <p className="text-[10px] uppercase tracking-wide text-white/60 font-bold">Lifetime spend</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur p-4">
              <Package className="w-5 h-5 text-white/70 mb-1" />
              <p className="text-2xl font-bold text-white">{metrics.po_count || 0}</p>
              <p className="text-[10px] uppercase tracking-wide text-white/60 font-bold">Purchase orders</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur p-4">
              <TrendingUp className="w-5 h-5 text-white/70 mb-1" />
              <p className="text-2xl font-bold text-white">{supplier.rating || 0}/5</p>
              <p className="text-[10px] uppercase tracking-wide text-white/60 font-bold">Rating</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur p-4">
              <Shield className="w-5 h-5 text-white/70 mb-1" />
              <p className="text-2xl font-bold text-white">{supplier.riskScore || 0}</p>
              <p className="text-[10px] uppercase tracking-wide text-white/60 font-bold">Risk score</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white dark:bg-neutral-900 rounded-2xl p-1 mb-6 overflow-x-auto border border-neutral-200 dark:border-neutral-800">
          {tabs.map(t => {
            const Icon = t.icon
            return (
              <button key={t.key} onClick={() => setTab(t.key)} className={'px-4 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 ' + (tab === t.key ? 'bg-indigo-600 text-white' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white')}>
                <Icon className="w-3.5 h-3.5" /> {t.label}
                {t.count !== undefined && t.count > 0 && <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">{t.count}</span>}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        {tab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Company Details</h3>
              <div className="space-y-3">
                {editing ? (
                  <>
                    <EditField label="Legal name"   value={form.legalName}    onChange={v => setForm({ ...form, legalName: v })} />
                    <EditField label="Trading name" value={form.tradingName}  onChange={v => setForm({ ...form, tradingName: v })} />
                    <EditField label="Reg. number"  value={form.registrationNumber} onChange={v => setForm({ ...form, registrationNumber: v })} />
                    <EditField label="Tax PIN"      value={form.taxPin}       onChange={v => setForm({ ...form, taxPin: v })} />
                    <EditField label="Website"      value={form.website}      onChange={v => setForm({ ...form, website: v })} />
                  </>
                ) : (
                  <>
                    <Row label="Legal name"   value={supplier.legalName} />
                    <Row label="Trading name" value={supplier.tradingName} />
                    <Row label="Reg. number"  value={supplier.registrationNumber} />
                    <Row label="Tax PIN"      value={supplier.taxPin} />
                    <Row label="Website"      value={supplier.website} link />
                  </>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Contact</h3>
              <div className="space-y-3">
                {editing ? (
                  <>
                    <EditField label="Email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
                    <EditField label="Phone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
                    <EditField label="Country" value={form.country} onChange={v => setForm({ ...form, country: v })} />
                    <EditField label="City" value={form.city} onChange={v => setForm({ ...form, city: v })} />
                    <EditField label="Address" value={form.address} onChange={v => setForm({ ...form, address: v })} />
                  </>
                ) : (
                  <>
                    <Row label="Email" value={supplier.email} icon={Mail} />
                    <Row label="Phone" value={supplier.phone} icon={Phone} />
                    <Row label="Country" value={supplier.country} icon={MapPin} />
                    <Row label="City" value={supplier.city} icon={MapPin} />
                    <Row label="Address" value={supplier.address} icon={MapPin} />
                  </>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Commercial Terms</h3>
              <div className="space-y-3">
                {editing ? (
                  <>
                    <EditField label="Currency" value={form.currency} onChange={v => setForm({ ...form, currency: v })} />
                    <EditField label="Payment terms (days)" value={form.paymentTerms} onChange={v => setForm({ ...form, paymentTerms: v })} type="number" />
                    <EditField label="Credit limit" value={form.creditLimit} onChange={v => setForm({ ...form, creditLimit: v })} type="number" />
                  </>
                ) : (
                  <>
                    <Row label="Currency" value={supplier.currency} icon={DollarSign} />
                    <Row label="Payment terms" value={(supplier.paymentTerms || 0) + ' days'} icon={Calendar} />
                    <Row label="Credit limit" value={Number(supplier.creditLimit || 0).toLocaleString()} icon={CreditCard} />
                  </>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Notes</h3>
              {editing ? (
                <textarea rows={5} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              ) : (
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{supplier.notes || 'No notes'}</p>
              )}
            </div>
          </div>
        )}

        {tab === 'contacts' && (
          <ListSection
            title="Contacts"
            icon={Users}
            items={contacts}
            onAdd={() => { setSubModal('contact'); setSubForm({ name: '', role: '', email: '', phone: '', isPrimary: false }) }}
            addLabel="Add contact"
            empty="No contacts yet"
            render={c => (
              <div key={c.id} className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                <div>
                  <p className="font-bold text-sm flex items-center gap-2">
                    {c.name}
                    {c.isPrimary && <span className="px-2 py-0.5 rounded-full bg-indigo-900/40 text-indigo-300 text-[10px] font-bold">PRIMARY</span>}
                  </p>
                  <p className="text-xs text-neutral-500">{c.role || '—'} · {c.email || 'no email'} · {c.phone || 'no phone'}</p>
                </div>
              </div>
            )}
          />
        )}

        {tab === 'bank' && (
          <ListSection
            title="Bank Accounts"
            icon={CreditCard}
            items={bankAccounts}
            onAdd={() => { setSubModal('bank'); setSubForm({ bankName: '', accountName: '', accountNumber: '', branchCode: '', swiftCode: '', currency: 'KES', isPrimary: false }) }}
            addLabel="Add bank account"
            empty="No bank accounts yet"
            render={b => (
              <div key={b.id} className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                <div>
                  <p className="font-bold text-sm flex items-center gap-2">
                    {b.bankName}
                    {b.isPrimary && <span className="px-2 py-0.5 rounded-full bg-indigo-900/40 text-indigo-300 text-[10px] font-bold">PRIMARY</span>}
                  </p>
                  <p className="text-xs text-neutral-500">{b.accountName} · ****{String(b.accountNumber).slice(-4)} · {b.currency}</p>
                </div>
              </div>
            )}
          />
        )}

        {tab === 'documents' && (
          <ListSection
            title="Documents"
            icon={FileText}
            items={documents}
            onAdd={() => { setSubModal('document'); setSubForm({ documentType: 'TAX_CERTIFICATE', name: '', fileUrl: '', expiryDate: '' }) }}
            addLabel="Add document"
            empty="No documents yet"
            render={d => {
              const days = d.expiryDate ? Math.ceil((new Date(d.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
              const expiryPill =
                days === null ? null
                : days < 0 ? { label: 'Expired', cls: 'bg-red-900/50 text-red-300' }
                : days < 30 ? { label: 'Expires in ' + days + 'd', cls: 'bg-red-900/50 text-red-300' }
                : days < 90 ? { label: 'Expires in ' + days + 'd', cls: 'bg-amber-900/50 text-amber-300' }
                : { label: 'Expires in ' + days + 'd', cls: 'bg-green-900/50 text-green-300' }
              return (
                <div key={d.id} className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                      <span className="truncate">{d.name}</span>
                    </p>
                    <p className="text-xs text-neutral-500 flex items-center gap-2 mt-1 flex-wrap">
                      <span>{d.documentType}</span>
                      <span>·</span>
                      <span>{d.status}</span>
                      {expiryPill && (
                        <>
                          <span>·</span>
                          <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + expiryPill.cls}>{expiryPill.label}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 ml-3">
                    <button onClick={() => setPreviewDoc(d)} className="px-3 py-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900 text-xs font-bold flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Preview
                    </button>
                    <a href={d.fileUrl} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-indigo-500">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )
            }}
          />
        )}

        {tab === 'scorecards' && (
          <div className="space-y-4">
          {scorecards.length > 1 && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold">Overall Score Trend</h3>
                  <p className="text-[10px] text-neutral-400 mt-0.5">{scorecards.length} periods</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                    {scorecards[0].overallScore}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Latest</p>
                </div>
              </div>
              <Sparkline
                data={scorecards.slice().reverse().map((s: any) => Number(s.overallScore) || 0)}
                width={600}
                height={80}
              />
            </div>
          )}
          <ListSection
            title="Scorecards"
            icon={TrendingUp}
            items={scorecards}
            onAdd={() => {
              const now = new Date()
              const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0,10)
              const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0,10)
              setSubModal('scorecard')
              setSubForm({ periodStart: start, periodEnd: end, deliveryScore: 80, qualityScore: 80, priceScore: 80, responsivenessScore: 80, complianceScore: 80, notes: '' })
            }}
            addLabel="Add scorecard"
            empty="No scorecards yet"
            render={s => (
              <div key={s.id} className="p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-bold">{new Date(s.periodStart).toLocaleDateString('en-GB')} → {new Date(s.periodEnd).toLocaleDateString('en-GB')}</p>
                  <span className={'px-3 py-1 rounded-full text-xs font-bold ' + (s.overallScore >= 80 ? 'bg-green-900/40 text-green-300' : s.overallScore >= 60 ? 'bg-amber-900/40 text-amber-300' : 'bg-red-900/40 text-red-300')}>
                    {s.overallScore}/100
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2 text-xs">
                  <ScoreCell label="Delivery" value={s.deliveryScore} />
                  <ScoreCell label="Quality"  value={s.qualityScore} />
                  <ScoreCell label="Price"    value={s.priceScore} />
                  <ScoreCell label="Response" value={s.responsivenessScore} />
                  <ScoreCell label="Compliance" value={s.complianceScore} />
                </div>
              </div>
            )}
          />
          </div>
        )}

        {tab === 'risks' && (
          <ListSection
            title="Risk Flags"
            icon={Shield}
            items={risks}
            onAdd={() => { setSubModal('risk'); setSubForm({ riskType: 'DELIVERY', severity: 'MEDIUM', title: '', description: '' }) }}
            addLabel="Flag risk"
            empty="No risks flagged"
            render={r => (
              <div key={r.id} className="p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-bold text-sm flex items-center gap-2">
                      <Shield className={'w-3.5 h-3.5 ' + riskColor(r.severity)} />
                      {r.title}
                    </p>
                    <p className="text-xs text-neutral-500">{r.riskType} · {r.status} · {new Date(r.detectedAt).toLocaleDateString('en-GB')}</p>
                    {r.description && <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2">{r.description}</p>}
                  </div>
                  <span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + (r.severity === 'CRITICAL' ? 'bg-red-900/50 text-red-300' : r.severity === 'HIGH' ? 'bg-orange-900/50 text-orange-300' : r.severity === 'MEDIUM' ? 'bg-amber-900/50 text-amber-300' : 'bg-green-900/50 text-green-300')}>
                    {r.severity}
                  </span>
                </div>
              </div>
            )}
          />
        )}

        {tab === 'activity' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            {activity.length === 0 ? (
              <p className="text-center text-sm text-neutral-500 py-12">No activity yet</p>
            ) : (
              <div>
                {activity.map(a => (
                  <div key={a.id} className="p-4 flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-500">
                      {(a.actorName || 'U')[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-neutral-900 dark:text-white">{a.summary || a.eventType}</p>
                      <p className="text-xs text-neutral-500">{a.actorName || 'System'} · {new Date(a.createdAt).toLocaleString('en-GB')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Document preview modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setPreviewDoc(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-800">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold truncate flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                  {previewDoc.name}
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">{previewDoc.documentType} · {previewDoc.status}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0 ml-3">
                <a href={previewDoc.fileUrl} download className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-indigo-500" title="Download">
                  <Download className="w-4 h-4" />
                </a>
                <a href={previewDoc.fileUrl} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-indigo-500" title="Open in new tab">
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button onClick={() => setPreviewDoc(null)} className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-red-500" title="Close">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-neutral-100 dark:bg-neutral-950 p-4">
              <DocPreview url={previewDoc.fileUrl} mime={previewDoc.mimeType} name={previewDoc.name} />
            </div>
          </div>
        </div>
      )}
      {/* Sub-modal */}
      {subModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSubModal(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-lg font-bold capitalize">Add {subModal}</h2>
              <button onClick={() => setSubModal(null)} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {subModal === 'contact' && (
                <>
                  <SubField label="Name *" value={subForm.name} onChange={v => setSubForm({ ...subForm, name: v })} />
                  <SubField label="Role" value={subForm.role} onChange={v => setSubForm({ ...subForm, role: v })} />
                  <SubField label="Email" value={subForm.email} onChange={v => setSubForm({ ...subForm, email: v })} />
                  <SubField label="Phone" value={subForm.phone} onChange={v => setSubForm({ ...subForm, phone: v })} />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!subForm.isPrimary} onChange={e => setSubForm({ ...subForm, isPrimary: e.target.checked })} />
                    Mark as primary contact
                  </label>
                </>
              )}

              {subModal === 'bank' && (
                <>
                  <SubField label="Bank name *" value={subForm.bankName} onChange={v => setSubForm({ ...subForm, bankName: v })} />
                  <SubField label="Account name *" value={subForm.accountName} onChange={v => setSubForm({ ...subForm, accountName: v })} />
                  <SubField label="Account number *" value={subForm.accountNumber} onChange={v => setSubForm({ ...subForm, accountNumber: v })} />
                  <SubField label="Branch code" value={subForm.branchCode} onChange={v => setSubForm({ ...subForm, branchCode: v })} />
                  <SubField label="SWIFT code" value={subForm.swiftCode} onChange={v => setSubForm({ ...subForm, swiftCode: v })} />
                  <SubField label="Currency" value={subForm.currency} onChange={v => setSubForm({ ...subForm, currency: v })} />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!subForm.isPrimary} onChange={e => setSubForm({ ...subForm, isPrimary: e.target.checked })} />
                    Primary account
                  </label>
                </>
              )}

              {subModal === 'document' && (
                <>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Type</label>
                    <select value={subForm.documentType} onChange={e => setSubForm({ ...subForm, documentType: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                      {['TAX_CERTIFICATE', 'BUSINESS_LICENSE', 'INSURANCE', 'BANK_STATEMENT', 'KYC', 'CERTIFICATION', 'OTHER'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <SubField label="Document name *" value={subForm.name} onChange={v => setSubForm({ ...subForm, name: v })} />
                  <SubField label="File URL *" value={subForm.fileUrl} onChange={v => setSubForm({ ...subForm, fileUrl: v })} />
                  <div>
                    <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Expiry date</label>
                    <input type="date" value={subForm.expiryDate} onChange={e => setSubForm({ ...subForm, expiryDate: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
                  </div>
                </>
              )}

              {subModal === 'scorecard' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Period start *</label>
                      <input type="date" value={subForm.periodStart} onChange={e => setSubForm({ ...subForm, periodStart: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Period end *</label>
                      <input type="date" value={subForm.periodEnd} onChange={e => setSubForm({ ...subForm, periodEnd: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
                    </div>
                  </div>
                  <SubField label="Delivery (0–100)" value={subForm.deliveryScore} onChange={v => setSubForm({ ...subForm, deliveryScore: v })} type="number" />
                  <SubField label="Quality (0–100)" value={subForm.qualityScore} onChange={v => setSubForm({ ...subForm, qualityScore: v })} type="number" />
                  <SubField label="Price (0–100)" value={subForm.priceScore} onChange={v => setSubForm({ ...subForm, priceScore: v })} type="number" />
                  <SubField label="Responsiveness (0–100)" value={subForm.responsivenessScore} onChange={v => setSubForm({ ...subForm, responsivenessScore: v })} type="number" />
                  <SubField label="Compliance (0–100)" value={subForm.complianceScore} onChange={v => setSubForm({ ...subForm, complianceScore: v })} type="number" />
                  <SubField label="Notes" value={subForm.notes} onChange={v => setSubForm({ ...subForm, notes: v })} />
                </>
              )}

              {subModal === 'risk' && (
                <>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Risk type</label>
                    <select value={subForm.riskType} onChange={e => setSubForm({ ...subForm, riskType: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                      {['DELIVERY', 'QUALITY', 'FINANCIAL', 'COMPLIANCE', 'CONCENTRATION', 'REPUTATION', 'OTHER'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Severity</label>
                    <select value={subForm.severity} onChange={e => setSubForm({ ...subForm, severity: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                      {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <SubField label="Title *" value={subForm.title} onChange={v => setSubForm({ ...subForm, title: v })} />
                  <div>
                    <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Description</label>
                    <textarea rows={3} value={subForm.description} onChange={e => setSubForm({ ...subForm, description: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-200 dark:border-neutral-800">
              <button onClick={() => setSubModal(null)} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">Cancel</button>
              <button onClick={submitSub} disabled={subSaving} className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
                {subSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- Sparkline (SVG, no dependency) ----------
function Sparkline({ data, width = 400, height = 60 }: { data: number[]; width?: number; height?: number }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data, 100)
  const min = Math.min(...data, 0)
  const range = Math.max(1, max - min)
  const stepX = width / Math.max(1, data.length - 1)

  const points = data.map((v, i) => {
    const x = i * stepX
    const y = height - ((v - min) / range) * height
    return { x, y }
  })

  const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ')
  const areaPath =
    'M0,' + height +
    ' ' + points.map(p => 'L' + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ') +
    ' L' + width + ',' + height + ' Z'

  const last = points[points.length - 1]
  const color = data[data.length - 1] >= 80 ? '#22c55e' : data[data.length - 1] >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <svg viewBox={'0 0 ' + width + ' ' + height} width="100%" height={height} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkFill)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r="4" fill={color} />
    </svg>
  )
}

// ---------- Document preview (inline) ----------
function DocPreview({ url, mime, name }: { url: string; mime?: string; name: string }) {
  const isImage = (mime && mime.startsWith('image/')) || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(name)
  const isPdf = (mime === 'application/pdf') || /\.pdf$/i.test(name)
  const isText = (mime && mime.startsWith('text/')) || /\.(txt|csv|log|json|md)$/i.test(name)

  if (isImage) {
    return <img src={url} alt={name} className="max-w-full mx-auto rounded-lg" />
  }

  if (isPdf) {
    return (
      <iframe
        src={url}
        className="w-full h-[75vh] rounded-lg bg-white"
        title={name}
      />
    )
  }

  if (isText) {
    return (
      <iframe
        src={url}
        className="w-full h-[75vh] rounded-lg bg-white"
        title={name}
      />
    )
  }

  return (
    <div className="text-center py-16">
      <FileText className="w-16 h-16 mx-auto mb-3 text-neutral-400" />
      <p className="text-sm text-neutral-500 mb-4">Preview not available for this file type</p>
      <a href={url} target="_blank" rel="noreferrer" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold inline-flex items-center gap-2">
        <ExternalLink className="w-4 h-4" /> Open in new tab
      </a>
    </div>
  )
}

// ---------- Helper components ----------
function Row({ label, value, icon: Icon, link }: any) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-xs text-neutral-500 flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />} {label}
      </span>
      {link && value ? (
        <a href={value.startsWith('http') ? value : 'https://' + value} target="_blank" rel="noreferrer" className="text-sm text-indigo-500 hover:underline max-w-[60%] truncate">
          {value}
        </a>
      ) : (
        <span className="text-sm text-neutral-900 dark:text-white max-w-[60%] truncate">{value || '—'}</span>
      )}
    </div>
  )
}

function EditField({ label, value, onChange, type = 'text' }: any) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">{label}</label>
      <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
    </div>
  )
}

function SubField({ label, value, onChange, type = 'text' }: any) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">{label}</label>
      <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
    </div>
  )
}

function ScoreCell({ label, value }: any) {
  return (
    <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-center">
      <p className="text-[10px] uppercase text-neutral-500 font-bold">{label}</p>
      <p className="text-sm font-bold text-neutral-900 dark:text-white">{value}</p>
    </div>
  )
}

function ListSection({ title, icon: Icon, items, onAdd, addLabel, empty, render }: any) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-800">
        <h3 className="text-sm font-bold flex items-center gap-2"><Icon className="w-4 h-4 text-indigo-500" />{title}</h3>
        <button onClick={onAdd} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> {addLabel}
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-center text-sm text-neutral-500 py-12">{empty}</p>
      ) : (
        <div>{items.map((it: any) => render(it))}</div>
      )}
    </div>
  )
}