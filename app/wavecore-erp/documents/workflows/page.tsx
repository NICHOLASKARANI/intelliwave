'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Workflow, ArrowLeft, Loader2, Plus, Trash2, X, Play, Save,
  Layers, Scissors, Minimize2, RotateCw, Stamp, Hash, GitBranch,
  Unlock, RefreshCw, Crop, FileSearch, FileText, AlertTriangle, CheckCircle2,
  ArrowUp, ArrowDown, Sparkles,
} from 'lucide-react'

const TOOLS = [
  { key: 'MERGE', label: 'Merge PDF', icon: Layers },
  { key: 'SPLIT', label: 'Split PDF', icon: Scissors },
  { key: 'COMPRESS', label: 'Compress PDF', icon: Minimize2 },
  { key: 'ROTATE', label: 'Rotate PDF', icon: RotateCw },
  { key: 'WATERMARK', label: 'Watermark', icon: Stamp },
  { key: 'PAGE_NUMBERS', label: 'Page Numbers', icon: Hash },
  { key: 'ORGANIZE', label: 'Organize', icon: GitBranch },
  { key: 'UNLOCK', label: 'Unlock', icon: Unlock },
  { key: 'REPAIR', label: 'Repair', icon: RefreshCw },
  { key: 'CROP', label: 'Crop', icon: Crop },
  { key: 'REDACT', label: 'Redact', icon: FileSearch },
  { key: 'METADATA', label: 'Metadata', icon: FileText },
]

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', steps: [] as string[] })

  const csrf = () => document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || ''

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/documents/workflows')
      const data = await res.json()
      setWorkflows(data.workflows || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }

  const resetForm = () => setForm({ name: '', description: '', steps: [] })

  const addStep = (key: string) => {
    setForm(prev => ({ ...prev, steps: [...prev.steps, key] }))
  }

  const removeStep = (idx: number) => {
    setForm(prev => ({ ...prev, steps: prev.steps.filter((_, i) => i !== idx) }))
  }

  const moveStep = (idx: number, dir: -1 | 1) => {
    setForm(prev => {
      const next = [...prev.steps]
      const target = idx + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return { ...prev, steps: next }
    })
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name required'); return }
    if (form.steps.length === 0) { setError('Add at least one step'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/wavecore/documents/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash('Workflow saved')
      setShowCreate(false)
      resetForm()
      fetchAll()
    } finally { setSaving(false) }
  }

  const del = async (id: string, name: string) => {
    if (!confirm('Delete workflow "' + name + '"?')) return
    const res = await fetch('/api/wavecore/documents/workflows?id=' + id, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrf() },
    })
    if (res.ok) { flash('Deleted'); fetchAll() }
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/documents" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Documents · Workflows</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <Link href="/wavecore-erp/documents" className="text-sm text-neutral-400 hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Workflow className="w-7 h-7 text-indigo-400" /> Workflows
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Chain PDF tools into repeatable workflows</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Workflow
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800 flex items-start gap-2"><AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" /></div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Workflow className="w-12 h-12 mx-auto mb-3 text-neutral-700" />
            <p className="text-neutral-400 mb-4">No workflows yet</p>
            <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create First Workflow
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {workflows.map(w => {
              const steps = Array.isArray(w.steps) ? w.steps : (typeof w.steps === 'string' ? JSON.parse(w.steps) : [])
              return (
                <div key={w.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="text-white font-bold mb-1">{w.name}</p>
                      {w.description && <p className="text-xs text-neutral-500 mb-3">{w.description}</p>}
                      <div className="flex flex-wrap gap-2 items-center">
                        {steps.map((s: string, i: number) => {
                          const tool = TOOLS.find(t => t.key === s)
                          const Icon = tool?.icon || FileText
                          return (
                            <div key={i} className="flex items-center gap-1">
                              <span className="px-2 py-1 rounded-lg bg-indigo-900/40 text-indigo-300 text-[10px] font-bold flex items-center gap-1">
                                <Icon className="w-3 h-3" /> {tool?.label || s}
                              </span>
                              {i < steps.length - 1 && <span className="text-neutral-600">→</span>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    <button onClick={() => del(w.id, w.name)} className="p-2 rounded-lg bg-red-900/40 text-red-300 hover:bg-red-800 flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => { setShowCreate(false); resetForm() }}>
          <form onSubmit={save} onClick={e => e.stopPropagation()} className="w-full max-w-2xl bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" /> New Workflow
              </h2>
              <button type="button" onClick={() => { setShowCreate(false); resetForm() }} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold block mb-1">Workflow Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold block mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold block mb-2">Available Tools (click to add)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {TOOLS.map(t => {
                    const Icon = t.icon
                    return (
                      <button key={t.key} type="button" onClick={() => addStep(t.key)} className="p-2.5 rounded-lg bg-neutral-800 hover:bg-indigo-900/40 text-white text-xs font-bold flex items-center gap-2 justify-start">
                        <Icon className="w-3.5 h-3.5 text-indigo-400" /> {t.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold block mb-2">Steps ({form.steps.length})</label>
                {form.steps.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-4 border border-dashed border-neutral-700 rounded-xl">Add tools from above to build your workflow</p>
                ) : (
                  <div className="space-y-2">
                    {form.steps.map((s, i) => {
                      const tool = TOOLS.find(t => t.key === s)
                      const Icon = tool?.icon || FileText
                      return (
                        <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-neutral-800">
                          <span className="text-xs text-neutral-500 font-bold">{i + 1}</span>
                          <Icon className="w-4 h-4 text-indigo-400" />
                          <span className="text-sm text-white flex-1">{tool?.label || s}</span>
                          <button type="button" onClick={() => moveStep(i, -1)} disabled={i === 0} className="p-1 rounded bg-neutral-700 text-neutral-400 hover:text-white disabled:opacity-30">
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button type="button" onClick={() => moveStep(i, 1)} disabled={i === form.steps.length - 1} className="p-1 rounded bg-neutral-700 text-neutral-400 hover:text-white disabled:opacity-30">
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button type="button" onClick={() => removeStep(i)} className="p-1 rounded bg-red-900/50 text-red-300 hover:bg-red-800">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800">
              <button type="button" onClick={() => { setShowCreate(false); resetForm() }} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" disabled={saving || form.steps.length === 0} className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Workflow
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}