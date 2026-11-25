'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, PenTool, Loader2, FileText, Trash2, CheckCircle2, XCircle,
  Mail, User, Printer, Plus, X, Clock, AlertCircle,
} from 'lucide-react'

interface SignatureRow {
  id: string
  documentId: string
  signerId: string | null
  signerName: string | null
  signerEmail: string | null
  status: 'PENDING' | 'SIGNED' | 'DECLINED'
  requestedAt: string
  signedAt: string | null
  signatureData: string | null
  declineReason: string | null
  documentName?: string
}

interface DocOption {
  id: string
  name: string
}

export default function SignaturesPage() {
  const [signatures, setSignatures] = useState<SignatureRow[]>([])
  const [documents, setDocuments] = useState<DocOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showRequest, setShowRequest] = useState(false)
  const [showSign, setShowSign] = useState<SignatureRow | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [form, setForm] = useState({ documentId: '', signerName: '', signerEmail: '' })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)

  const csrf = () => (typeof document === 'undefined') ? '' : (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '')
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3500) }

  const loadAll = async () => {
    setLoading(true); setError('')
    try {
      const [sigRes, docRes] = await Promise.all([
        fetch('/api/wavecore/documents/signatures', { cache: 'no-store' }),
        fetch('/api/wavecore/documents?limit=500', { cache: 'no-store' }),
      ])
      const sigJson = await sigRes.json()
      const docJson = await docRes.json()
      if (!sigRes.ok) { setError(sigJson.error || 'Failed to load signatures'); return }
      const docMap: Record<string, string> = {}
      ;(docJson.documents || []).forEach((d: any) => { docMap[d.id] = d.name })
      const enriched = (sigJson.signatures || []).map((s: any) => ({ ...s, documentName: docMap[s.documentId] || 'Unknown document' }))
      setSignatures(enriched)
      setDocuments((docJson.documents || []).map((d: any) => ({ id: d.id, name: d.name })))
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadAll() }, [])

  const openRequest = () => {
    setForm({ documentId: documents[0]?.id || '', signerName: '', signerEmail: '' })
    setShowRequest(true)
  }

  const submitRequest = async () => {
    if (!form.documentId || !form.signerEmail) { setError('Document and signer email required'); return }
    setBusy('request'); setError(''); setSuccess('')
    try {
      const res = await fetch('/api/wavecore/documents/signatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Request failed'); return }
      setShowRequest(false)
      flash('Signature requested')
      loadAll()
    } catch { setError('Network error') }
    finally { setBusy(null) }
  }

  const openSign = (sig: SignatureRow) => {
    setShowSign(sig)
    setTimeout(() => {
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) { ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.lineCap = 'round' }
      }
    }, 50)
  }

  const startDrawing = (e: React.MouseEvent) => {
    setDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    ctx?.beginPath()
    ctx?.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }
  const draw = (e: React.MouseEvent) => {
    if (!drawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    ctx?.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx?.stroke()
  }
  const stopDrawing = () => setDrawing(false)

  const submitSignature = async () => {
    if (!showSign) return
    const canvas = canvasRef.current
    if (!canvas) return
    const signatureData = canvas.toDataURL('image/png')
    if (signatureData.length < 1000) { setError('Please draw a signature first'); return }
    setBusy('sign'); setError('')
    try {
      const res = await fetch('/api/wavecore/documents/signatures', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({ id: showSign.id, action: 'SIGN', signatureData }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Sign failed'); return }
      setShowSign(null)
      flash('Signed successfully')
      loadAll()
    } catch { setError('Network error') }
    finally { setBusy(null) }
  }

  const decline = async (sig: SignatureRow) => {
    const reason = prompt('Reason for declining (optional):')
    if (reason === null) return
    setBusy(sig.id); setError('')
    try {
      const res = await fetch('/api/wavecore/documents/signatures', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({ id: sig.id, action: 'DECLINE', declineReason: reason || 'No reason given' }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Decline failed'); return }
      flash('Declined')
      loadAll()
    } catch { setError('Network error') }
    finally { setBusy(null) }
  }

  const remove = async (sig: SignatureRow) => {
    if (!confirm('Delete this signature request? This cannot be undone.')) return
    setBusy(sig.id); setError('')
    try {
      const res = await fetch('/api/wavecore/documents/signatures?id=' + sig.id, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrf() },
      })
      if (!res.ok) { const j = await res.json(); setError(j.error || 'Delete failed'); return }
      flash('Deleted')
      loadAll()
    } catch { setError('Network error') }
    finally { setBusy(null) }
  }

  const printList = () => window.print()

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      PENDING: 'bg-amber-100 text-amber-700',
      SIGNED: 'bg-green-100 text-green-700',
      DECLINED: 'bg-red-100 text-red-700',
    }
    return map[s] || 'bg-neutral-100 text-neutral-700'
  }

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleString('en-KE') : '—'

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b print:hidden">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <Link href="/wavecore-erp/documents" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Documents
          </Link>
          <h1 className="font-bold flex items-center gap-2"><PenTool className="w-5 h-5 text-indigo-500" /> Signatures</h1>
          <div className="flex gap-2">
            <button onClick={printList} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-bold flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={openRequest} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center gap-2">
              <Plus className="w-4 h-4" /> Request Signature
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="hidden print:block mb-6 pb-4 border-b-2 border-neutral-800">
          <h2 className="text-xl font-bold">Signature Requests</h2>
          <p className="text-xs text-neutral-500">Generated {new Date().toLocaleString()}</p>
        </div>

        {error && <div className="p-4 mb-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
        {success && <div className="p-4 mb-4 rounded-xl bg-green-50 text-green-600 text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {success}</div>}

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
          {loading ? (
            <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>
          ) : signatures.length === 0 ? (
            <div className="p-12 text-center text-sm text-neutral-500">
              No signature requests yet. Click "Request Signature" to start.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800 text-xs uppercase text-neutral-500">
                  <tr>
                    <th className="text-left px-4 py-3">Document</th>
                    <th className="text-left px-4 py-3">Signer</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Requested</th>
                    <th className="text-left px-4 py-3">Signed</th>
                    <th className="text-right px-4 py-3 print:hidden">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {signatures.map(sig => (
                    <tr key={sig.id} className="border-t hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="px-4 py-3 font-medium">{sig.documentName}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium">{sig.signerName || '—'}</span>
                          <span className="text-xs text-neutral-500 flex items-center gap-1"><Mail className="w-3 h-3" /> {sig.signerEmail}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className={'px-2 py-1 rounded text-xs font-bold ' + statusBadge(sig.status)}>{sig.status}</span></td>
                      <td className="px-4 py-3 text-xs text-neutral-500">{fmtDate(sig.requestedAt)}</td>
                      <td className="px-4 py-3 text-xs text-neutral-500">{fmtDate(sig.signedAt)}</td>
                      <td className="px-4 py-3 text-right print:hidden">
                        <div className="flex gap-1 justify-end">
                          {sig.status === 'PENDING' && (
                            <>
                              <button onClick={() => openSign(sig)} disabled={busy === sig.id} className="px-2 py-1 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-bold disabled:opacity-40">
                                Sign
                              </button>
                              <button onClick={() => decline(sig)} disabled={busy === sig.id} className="px-2 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-xs font-bold disabled:opacity-40">
                                Decline
                              </button>
                            </>
                          )}
                          <button onClick={() => remove(sig)} disabled={busy === sig.id} className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold disabled:opacity-40">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Request modal */}
      {showRequest && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowRequest(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-neutral-900 rounded-2xl border max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Request Signature</h3>
              <button onClick={() => setShowRequest(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Document *</label>
                <select value={form.documentId} onChange={e => setForm({ ...form, documentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-neutral-50 dark:bg-neutral-800 text-sm">
                  <option value="">Select document...</option>
                  {documents.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Signer Name</label>
                <input value={form.signerName} onChange={e => setForm({ ...form, signerName: e.target.value })}
                  placeholder="John Kamau"
                  className="w-full px-3 py-2 rounded-lg border bg-neutral-50 dark:bg-neutral-800 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Signer Email *</label>
                <input type="email" value={form.signerEmail} onChange={e => setForm({ ...form, signerEmail: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full px-3 py-2 rounded-lg border bg-neutral-50 dark:bg-neutral-800 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowRequest(false)} disabled={busy === 'request'} className="px-4 py-2 rounded-lg text-sm bg-neutral-100 dark:bg-neutral-800">Cancel</button>
              <button onClick={submitRequest} disabled={busy === 'request'} className="px-4 py-2 rounded-lg text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40">
                {busy === 'request' ? 'Requesting...' : 'Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign modal */}
      {showSign && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowSign(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-neutral-900 rounded-2xl border max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Sign: {showSign.documentName}</h3>
              <button onClick={() => setShowSign(null)}><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-neutral-500 mb-3">Draw your signature below:</p>
            <canvas
              ref={canvasRef}
              width={480}
              height={180}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="w-full border-2 border-dashed rounded-xl cursor-crosshair bg-white"
            />
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowSign(null)} disabled={busy === 'sign'} className="px-4 py-2 rounded-lg text-sm bg-neutral-100 dark:bg-neutral-800">Cancel</button>
              <button onClick={submitSignature} disabled={busy === 'sign'} className="px-4 py-2 rounded-lg text-sm font-bold bg-green-600 hover:bg-green-500 text-white disabled:opacity-40">
                {busy === 'sign' ? 'Signing...' : 'Sign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}