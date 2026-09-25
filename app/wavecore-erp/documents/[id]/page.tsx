'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  FileText, ArrowLeft, Loader2, Star, Trash2, Share2, Download, Edit3,
  History, Activity, PenTool, Clock, User, AlertTriangle, CheckCircle2,
  X, Save, Plus, Copy, ExternalLink, Tag, FolderOpen, Calendar,
} from 'lucide-react'

export default function DocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params.id || '')

  const [doc, setDoc] = useState<any>(null)
  const [versions, setVersions] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [shares, setShares] = useState<any[]>([])
  const [signatures, setSignatures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tab, setTab] = useState<'preview'|'versions'|'activity'|'shares'|'signatures'>('preview')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [shareEmail, setShareEmail] = useState('')
  const [sharePermission, setSharePermission] = useState('VIEW')
  const [signerEmail, setSignerEmail] = useState('')
  const [signerName, setSignerName] = useState('')

  const csrf = () => document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || ''

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/documents/' + id)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      setDoc(data.document)
      setVersions(data.versions || [])
      setActivity(data.activity || [])
      setShares(data.shares || [])
      setSignatures(data.signatures || [])
      setForm({
        name: data.document.name || '',
        description: data.document.description || '',
        category: data.document.category || 'GENERAL',
        tags: data.document.tags || '',
        status: data.document.status || 'ACTIVE',
      })
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { if (id) fetchAll() }, [id])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }

  const saveEdit = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/wavecore/documents/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify(form),
      })
      if (res.ok) { flash('Document updated'); setEditing(false); fetchAll() }
    } finally { setSaving(false) }
  }

  const toggleStar = async () => {
    await fetch('/api/wavecore/documents/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
      body: JSON.stringify({ isStarred: !doc.isStarred }),
    })
    fetchAll()
  }

  const del = async () => {
    if (!confirm('Delete "' + doc.name + '"? Cannot be undone.')) return
    const res = await fetch('/api/wavecore/documents/' + id, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrf() },
    })
    if (res.ok) router.push('/wavecore-erp/documents')
  }

  const createShare = async () => {
    if (!shareEmail.trim()) return
    const res = await fetch('/api/wavecore/documents/shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
      body: JSON.stringify({ documentId: id, sharedWithEmail: shareEmail.trim(), permission: sharePermission }),
    })
    if (res.ok) { flash('Shared!'); setShareEmail(''); fetchAll() }
  }

  const revokeShare = async (shareId: string) => {
    if (!confirm('Revoke this share?')) return
    await fetch('/api/wavecore/documents/shares?id=' + shareId, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrf() },
    })
    flash('Revoked'); fetchAll()
  }

  const copyShareLink = (token: string) => {
    const url = window.location.origin + '/wavecore-erp/documents/shared/' + token
    navigator.clipboard.writeText(url)
    flash('Link copied')
  }

  const requestSignature = async () => {
    if (!signerEmail.trim()) return
    const res = await fetch('/api/wavecore/documents/signatures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
      body: JSON.stringify({ documentId: id, signerEmail: signerEmail.trim(), signerName: signerName.trim() }),
    })
    if (res.ok) { flash('Signature requested'); setSignerEmail(''); setSignerName(''); fetchAll() }
  }

  const signSignature = async (sigId: string) => {
    await fetch('/api/wavecore/documents/signatures', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
      body: JSON.stringify({ id: sigId, action: 'SIGN', signatureData: 'data:image/png;base64,iVBOR...' }),
    })
    flash('Signed'); fetchAll()
  }

  if (loading) return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
    </div>
  )

  if (error || !doc) return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
        <p className="text-red-300">{error || 'Document not found'}</p>
        <Link href="/wavecore-erp/documents" className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
          Back to Documents
        </Link>
      </div>
    </div>
  )

  const tabs = [
    { key: 'preview', label: 'Preview', icon: FileText },
    { key: 'versions', label: 'Versions', icon: History, count: versions.length },
    { key: 'activity', label: 'Activity', icon: Activity, count: activity.length },
    { key: 'shares', label: 'Shares', icon: Share2, count: shares.length },
    { key: 'signatures', label: 'Signatures', icon: PenTool, count: signatures.length },
  ] as const

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/documents" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Document</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <button onClick={() => router.back()} className="text-sm text-neutral-400 hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* Header */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 mb-6">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div className="flex items-start gap-4 flex-1 min-w-[280px]">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center flex-shrink-0">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                {editing ? (
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full text-xl font-bold bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-white mb-2" />
                ) : (
                  <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    {doc.name}
                    {doc.isStarred && <Star className="w-5 h-5 text-amber-500 fill-amber-500" />}
                  </h1>
                )}
                <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
                  <span className="flex items-center gap-1"><FolderOpen className="w-3 h-3" />{doc.folderName || 'Root'}</span>
                  <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{doc.category}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(doc.createdAt).toLocaleDateString('en-GB')}</span>
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{doc.uploadedByName || 'Unknown'}</span>
                  <span>v{doc.currentVersion}</span>
                  <span>{Math.round((doc.fileSize || 0) / 1024)} KB</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {editing ? (
                <>
                  <button onClick={saveEdit} disabled={saving} className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold flex items-center gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                  </button>
                  <button onClick={() => setEditing(false)} className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold">
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={toggleStar} className={'p-2.5 rounded-xl ' + (doc.isStarred ? 'bg-amber-900/50 text-amber-300' : 'bg-neutral-800 text-neutral-300 hover:text-amber-300')} title="Star">
                    <Star className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditing(true)} className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
                    <Edit3 className="w-4 h-4" /> Edit
                  </button>
                  {doc.fileUrl && (
                    <a href={doc.fileUrl} download className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold flex items-center gap-2">
                      <Download className="w-4 h-4" /> Download
                    </a>
                  )}
                  <button onClick={del} className="p-2.5 rounded-xl bg-red-900/40 text-red-300 hover:bg-red-800" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-neutral-900 rounded-xl p-1 mb-6 overflow-x-auto">
          {tabs.map(t => {
            const Icon = t.icon
            return (
              <button key={t.key} onClick={() => setTab(t.key)} className={'px-4 py-2 rounded-lg text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 ' + (tab === t.key ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white')}>
                <Icon className="w-3.5 h-3.5" /> {t.label}
                {t.count !== undefined && t.count > 0 && <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">{t.count}</span>}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        {tab === 'preview' && (
          <div className="space-y-6">
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-3">Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Description</p>
                  {editing ? (
                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" />
                  ) : (
                    <p className="text-sm text-white">{doc.description || '—'}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Tags</p>
                  {editing ? (
                    <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" />
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {(doc.tags || '').split(',').filter(Boolean).map((t: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-indigo-900/40 text-indigo-300 text-[10px] font-bold">{t.trim()}</span>
                      ))}
                      {!doc.tags && <p className="text-sm text-neutral-500">—</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {doc.textContent && (
              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-3">Extracted Text</h3>
                <pre className="text-xs text-neutral-300 whitespace-pre-wrap max-h-96 overflow-y-auto">{doc.textContent.slice(0, 5000)}</pre>
              </div>
            )}
          </div>
        )}

        {tab === 'versions' && (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            {versions.length === 0 ? (
              <p className="text-center text-sm text-neutral-500 py-12">No version history yet</p>
            ) : (
              <div className="divide-y divide-neutral-800">
                {versions.map(v => (
                  <div key={v.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-white font-bold">Version {v.version}</p>
                      <p className="text-xs text-neutral-500">{v.changeNote || 'No note'} · {v.createdByName || 'Unknown'} · {new Date(v.createdAt).toLocaleString('en-GB')}</p>
                    </div>
                    {v.fileUrl && (
                      <a href={v.fileUrl} download className="p-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-indigo-400">
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'activity' && (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            {activity.length === 0 ? (
              <p className="text-center text-sm text-neutral-500 py-12">No activity yet</p>
            ) : (
              <div className="divide-y divide-neutral-800">
                {activity.map(a => (
                  <div key={a.id} className="p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-400">
                      {(a.userName || 'U')[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white">{a.action.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-neutral-500">{a.userName || 'User'} · {new Date(a.createdAt).toLocaleString('en-GB')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'shares' && (
          <div className="space-y-4">
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Share2 className="w-4 h-4 text-indigo-400" /> Create new share</h3>
              <div className="flex gap-2 flex-wrap">
                <input value={shareEmail} onChange={e => setShareEmail(e.target.value)} placeholder="recipient@email.com" className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm" />
                <select value={sharePermission} onChange={e => setSharePermission(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
                  <option value="VIEW">View only</option>
                  <option value="DOWNLOAD">Can download</option>
                  <option value="EDIT">Can edit</option>
                  <option value="FULL">Full access</option>
                </select>
                <button onClick={createShare} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Share
                </button>
              </div>
            </div>

            {shares.length === 0 ? (
              <div className="text-center py-12 bg-neutral-900 rounded-2xl border border-neutral-800">
                <Share2 className="w-10 h-10 mx-auto mb-2 text-neutral-700" />
                <p className="text-sm text-neutral-500">Not shared yet</p>
              </div>
            ) : (
              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
                <div className="divide-y divide-neutral-800">
                  {shares.map(s => (
                    <div key={s.id} className="p-4 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium">{s.sharedWithEmail || 'Unknown'}</p>
                        <p className="text-xs text-neutral-500">{s.permission} · {new Date(s.createdAt).toLocaleDateString('en-GB')}{s.expiresAt ? ' · expires ' + new Date(s.expiresAt).toLocaleDateString('en-GB') : ''}</p>
                      </div>
                      {s.shareToken && (
                        <button onClick={() => copyShareLink(s.shareToken)} className="p-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-indigo-400" title="Copy link">
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => revokeShare(s.id)} className="p-2 rounded-lg bg-red-900/40 text-red-300 hover:bg-red-800" title="Revoke">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'signatures' && (
          <div className="space-y-4">
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><PenTool className="w-4 h-4 text-green-400" /> Request signature</h3>
              <div className="flex gap-2 flex-wrap">
                <input value={signerName} onChange={e => setSignerName(e.target.value)} placeholder="Name" className="w-40 px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm" />
                <input value={signerEmail} onChange={e => setSignerEmail(e.target.value)} placeholder="signer@email.com" className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm" />
                <button onClick={requestSignature} className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Request
                </button>
              </div>
            </div>

            {signatures.length === 0 ? (
              <div className="text-center py-12 bg-neutral-900 rounded-2xl border border-neutral-800">
                <PenTool className="w-10 h-10 mx-auto mb-2 text-neutral-700" />
                <p className="text-sm text-neutral-500">No signature requests</p>
              </div>
            ) : (
              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
                <div className="divide-y divide-neutral-800">
                  {signatures.map(sig => (
                    <div key={sig.id} className="p-4 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium">{sig.signerName || sig.signerEmail}</p>
                        <p className="text-xs text-neutral-500">{sig.status} · requested {new Date(sig.requestedAt).toLocaleDateString('en-GB')}</p>
                      </div>
                      {sig.status === 'PENDING' && (
                        <button onClick={() => signSignature(sig.id)} className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold">
                          Sign
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}