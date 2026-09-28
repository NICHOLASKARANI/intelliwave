'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Settings, ArrowLeft, Loader2, Save, AlertCircle, CheckCircle2,
  DollarSign, Clock, Package2, Microscope, ShieldCheck, Hash, FileText,
} from 'lucide-react'

interface Settings {
  id?: string
  defaultCurrency: string
  defaultPaymentTerms: number
  requireGRNBeforeInvoice: boolean
  requireQualityInspection: boolean
  matchQtyTolerance: number
  matchAmountTolerancePct: number
  matchAmountToleranceAbs: number
  autoApproveMatchedInvoices: boolean
  paymentRunRequireApproval: boolean
  contractExpiryNoticeDays: number
  poNumberPrefix: string
  grnNumberPrefix: string
  invoiceNumberPrefix: string
  notes?: string
}

export default function ProcurementSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [s, setS] = useState<Settings | null>(null)

  const csrf = () => document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || ''
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3500) }

  useEffect(() => {
    fetch('/api/wavecore/procurement/settings')
      .then(r => r.json())
      .then(d => { if (d.settings) setS(d.settings); else setError(d.error || 'Failed to load') })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false))
  }, [])

  const update = (k: keyof Settings, v: any) => s && setS({ ...s, [k]: v } as Settings)

  const save = async () => {
    if (!s) return
    setSaving(true); setError('')
    try {
      const payload = {
        defaultCurrency: s.defaultCurrency,
        defaultPaymentTerms: Number(s.defaultPaymentTerms),
        requireGRNBeforeInvoice: s.requireGRNBeforeInvoice,
        requireQualityInspection: s.requireQualityInspection,
        matchQtyTolerance: Number(s.matchQtyTolerance),
        matchAmountTolerancePct: Number(s.matchAmountTolerancePct),
        matchAmountToleranceAbs: Number(s.matchAmountToleranceAbs),
        autoApproveMatchedInvoices: s.autoApproveMatchedInvoices,
        paymentRunRequireApproval: s.paymentRunRequireApproval,
        contractExpiryNoticeDays: Number(s.contractExpiryNoticeDays),
        poNumberPrefix: s.poNumberPrefix,
        grnNumberPrefix: s.grnNumberPrefix,
        invoiceNumberPrefix: s.invoiceNumberPrefix,
        notes: s.notes || undefined,
      }
      const res = await fetch('/api/wavecore/procurement/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify(payload),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error || 'Save failed'); return }
      setS(d.settings)
      flash('Settings saved')
    } finally { setSaving(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
    </div>
  )

  if (!s) return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
        <p className="text-red-300 mb-4">{error || 'Settings unavailable'}</p>
        <Link href="/wavecore-erp/procurement" className="px-5 py-2.5 rounded-xl bg-cyan-600 text-white font-bold">Back</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/procurement" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-500">Procurement · Settings</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <Link href="/wavecore-erp/procurement" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Procurement
        </Link>

        <div className="rounded-3xl bg-gradient-to-br from-cyan-600 via-sky-600 to-blue-700 p-6 lg:p-8 mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <Settings className="w-8 h-8" /> Procurement Settings
          </h1>
          <p className="text-white/80 text-sm">Defaults, workflow rules, match tolerances, numbering</p>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2"><AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/30 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* Defaults */}
        <Section icon={DollarSign} title="Defaults" subtitle="Applied to new documents across the module">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Default currency">
              <select value={s.defaultCurrency} onChange={e => update('defaultCurrency', e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                {['KES','USD','EUR','GBP','ZAR','UGX','TZS'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Default payment terms (days)">
              <input type="number" value={s.defaultPaymentTerms} onChange={e => update('defaultPaymentTerms', Number(e.target.value))} min="0" className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
            </Field>
          </div>
        </Section>

        {/* Workflow rules */}
        <Section icon={ShieldCheck} title="Workflow rules" subtitle="Gate checks for the source-to-pay flow">
          <Toggle
            label="Require GRN before invoice"
            desc="Block invoice creation unless the linked PO has an accepted GRN"
            value={s.requireGRNBeforeInvoice}
            onChange={v => update('requireGRNBeforeInvoice', v)}
          />
          <Toggle
            label="Require quality inspection"
            desc="GRNs cannot reach ACCEPTED until every line has a passed inspection"
            value={s.requireQualityInspection}
            onChange={v => update('requireQualityInspection', v)}
          />
          <Toggle
            label="Auto-approve matched invoices"
            desc="Skip manual approval when the 3-way match result is AUTO_MATCHED"
            value={s.autoApproveMatchedInvoices}
            onChange={v => update('autoApproveMatchedInvoices', v)}
          />
          <Toggle
            label="Require approval for payment runs"
            desc="When ON, payment runs go through approval before execution"
            value={s.paymentRunRequireApproval}
            onChange={v => update('paymentRunRequireApproval', v)}
          />
        </Section>

        {/* Match tolerances */}
        <Section icon={Microscope} title="3-way match tolerances" subtitle="How strict the invoice ↔ GRN ↔ PO matching is">
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Qty tolerance (units)">
              <input type="number" value={s.matchQtyTolerance} onChange={e => update('matchQtyTolerance', Number(e.target.value))} min="0" step="0.01" className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
            </Field>
            <Field label="Amount tolerance (%)">
              <input type="number" value={s.matchAmountTolerancePct} onChange={e => update('matchAmountTolerancePct', Number(e.target.value))} min="0" step="0.1" className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
            </Field>
            <Field label="Amount tolerance (absolute)">
              <input type="number" value={s.matchAmountToleranceAbs} onChange={e => update('matchAmountToleranceAbs', Number(e.target.value))} min="0" step="1" className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
            </Field>
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            Tolerance used = max(amount × pct, absolute). Current: max({s.matchAmountToleranceAbs}, x × {s.matchAmountTolerancePct}%).
          </p>
        </Section>

        {/* Numbering */}
        <Section icon={Hash} title="Numbering prefixes" subtitle="Applied to new auto-generated document numbers">
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="PO prefix">
              <input value={s.poNumberPrefix} onChange={e => update('poNumberPrefix', e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
            </Field>
            <Field label="GRN prefix">
              <input value={s.grnNumberPrefix} onChange={e => update('grnNumberPrefix', e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
            </Field>
            <Field label="Invoice prefix">
              <input value={s.invoiceNumberPrefix} onChange={e => update('invoiceNumberPrefix', e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
            </Field>
          </div>
        </Section>

        {/* Other */}
        <Section icon={Clock} title="Notifications" subtitle="Warnings and alerts">
          <Field label="Contract expiry notice (days)">
            <input type="number" value={s.contractExpiryNoticeDays} onChange={e => update('contractExpiryNoticeDays', Number(e.target.value))} min="1" className="w-full md:w-64 px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
          </Field>
        </Section>

        <Section icon={FileText} title="Notes" subtitle="Internal memo for admins">
          <textarea rows={3} value={s.notes || ''} onChange={e => update('notes', e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
        </Section>

        <div className="sticky bottom-4 mt-6">
          <button onClick={save} disabled={saving} className="w-full md:w-auto px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold flex items-center gap-2 shadow-lg disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Settings
          </button>
        </div>
      </main>
    </div>
  )
}

function Section({ icon: Icon, title, subtitle, children }: any) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 mb-4">
      <div className="flex items-center gap-3 mb-4">
        <Icon className="w-5 h-5 text-cyan-500" />
        <div>
          <h2 className="text-sm font-bold">{title}</h2>
          <p className="text-xs text-neutral-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }: any) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">{label}</label>
      {children}
    </div>
  )
}

function Toggle({ label, desc, value, onChange }: any) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer mb-2">
      <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} className="mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-neutral-500">{desc}</p>
      </div>
    </label>
  )
}