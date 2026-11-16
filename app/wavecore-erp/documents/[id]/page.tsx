'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Download, Share2, Star, Trash2, FileText, History, Copy, Check, Loader2, ExternalLink } from 'lucide-react'

type Doc = {
  id: string
  fileName: string
  originalName: string
  mimeType: string
  fileSize: number
  fileUrl: string
  thumbnailUrl?: string
  category?: string
  tags?: string
  description?: string
  isStarred: boolean
  version: number
  ownerName?: string
  createdAt: string
  updatedAt: string
}

type Version = {
  id: string
  versionNumber: number
  fileName: string
  fileSize: number
  fileUrl: string
  uploadedByName?: string
  notes?: string
  createdAt: string
}

export default function DocumentViewerPage() {
  const params = useParams()
  const docId = params.id as string
  const [doc, setDoc] = useState<Doc | null>(null)
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [shareExpiry, setShareExpiry] = useState('24')

  useEffect(() => {
    if (!docId) return
    fetch('/api/wavecore/documents/' + docId)
      .then(r => r.json())
      .then(d => {
        if (d.document) {
          setDoc(d.document)
          setVersions(d.versions || [])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [docId])

  const toggleStar = async () => {
    if (!doc) return
    try {
      await fetch('/api/wavecore/documents/' + docId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: !doc.isStarred }),
      })
      setDoc({ ...doc, isStarred: !doc.isStarred })
    } catch {}
  }

  const trashDoc = async () => {
    if (!confirm('Move to trash?')) return
    try {
      await fetch('/api/wavecore/documents/' + docId, { method: 'DELETE' })
      window.location.href = '/wavecore-erp/documents'
    } catch {}
  }

  const createShare = async () => {
    try {
      const res = await fetch('/api/wavecore/documents/' + docId + '/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInHours: Number(shareExpiry) || 24 }),
      })
      const d = await res.json()
      if (d.url) {
        setShareLink(window.location.origin + d.url)
        setShowShare(false)
      }
    } catch {}
  }

  const copyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const isImage = (mime: string) => mime && mime.startsWith('image/')
  const isPdf = (mime: string) => mime === 'application/pdf'
  const isVideo = (mime: string) => mime && mime.startsWith('video/')

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-400 animate-spin" /></div>

  if (!doc) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Document not found</div>

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Link href="/wavecore-erp/documents" className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Documents
        </Link>

        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-8 h-8 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold break-words">{doc.originalName}</h1>
                <div className="flex flex-wrap gap-3 text-sm text-slate-400 mt-2">
                  <span>{formatSize(doc.fileSize)}</span>
                  <span>Version {doc.version}</span>
                  <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  {doc.ownerName && <span>By {doc.ownerName}</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={toggleStar} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl">
                <Star className={'w-5 h-5 ' + (doc.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-slate-400')} />
              </button>
              <button onClick={() => setShowShare(true)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm flex items-center gap-2">
                <Share2 className="w-4 h-4" /> Share
              </button>
              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-xl text-sm font-medium flex items-center gap-2">
                <Download className="w-4 h-4" /> Download
              </a>
              <button onClick={trashDoc} className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-xl">
                <Trash2 className="w-5 h-5 text-red-400" />
              </button>
            </div>
          </div>

          {/* Share link display */}
          {shareLink && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
              <p className="text-xs text-green-300 mb-2">Public link created (copied to clipboard)</p>
              <div className="flex gap-2">
                <input value={shareLink} readOnly className="flex-1 px-3 py-2 bg-slate-800 rounded-lg text-sm font-mono text-slate-300" />
                <button onClick={copyShareLink} className="px-3 py-2 bg-green-500 hover:bg-green-400 rounded-lg text-sm flex items-center gap-1">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Preview */}
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-sm font-bold mb-3 text-slate-400 uppercase">Preview</h2>
            {isImage(doc.mimeType) ? (
              <img src={doc.fileUrl} alt={doc.originalName} className="w-full rounded-xl" />
            ) : isPdf(doc.mimeType) ? (
              <iframe src={doc.fileUrl} className="w-full rounded-xl" style={{ minHeight: '600px' }} />
            ) : isVideo(doc.mimeType) ? (
              <video controls src={doc.fileUrl} className="w-full rounded-xl" />
            ) : (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500">Preview not available for this file type</p>
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-xl text-sm">
                  <ExternalLink className="w-4 h-4" /> Open in new tab
                </a>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h2 className="text-sm font-bold mb-3 text-slate-400 uppercase">Details</h2>
              <dl className="space-y-2 text-sm">
                {doc.category && <div><dt className="text-slate-500">Category</dt><dd className="text-white">{doc.category}</dd></div>}
                <div><dt className="text-slate-500">MIME Type</dt><dd className="text-white font-mono text-xs">{doc.mimeType}</dd></div>
                <div><dt className="text-slate-500">Updated</dt><dd className="text-white">{new Date(doc.updatedAt).toLocaleString()}</dd></div>
              </dl>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h2 className="text-sm font-bold mb-3 text-slate-400 uppercase flex items-center gap-2">
                <History className="w-4 h-4" /> Versions ({versions.length + 1})
              </h2>
              <div className="space-y-2">
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <p className="text-sm font-medium text-blue-300">Current (v{doc.version})</p>
                  <p className="text-xs text-slate-400">{formatSize(doc.fileSize)}</p>
                </div>
                {versions.map(v => (
                  <div key={v.id} className="p-3 bg-slate-800 rounded-xl">
                    <p className="text-sm text-white">v{v.versionNumber}</p>
                    <p className="text-xs text-slate-500">{formatSize(v.fileSize)} · {new Date(v.createdAt).toLocaleDateString()}</p>
                    {v.uploadedByName && <p className="text-xs text-slate-600">by {v.uploadedByName}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Share modal */}
        {showShare && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setShowShare(false)}>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">Share Document</h2>
              <label className="block text-sm text-slate-400 mb-2">Expires in (hours)</label>
              <input
                type="number"
                value={shareExpiry}
                onChange={e => setShareExpiry(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white mb-4"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowShare(false)} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl">Cancel</button>
                <button onClick={createShare} className="flex-1 py-3 bg-blue-500 hover:bg-blue-400 rounded-xl font-bold">Create Link</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}