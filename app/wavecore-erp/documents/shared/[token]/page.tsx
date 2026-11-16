'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { FileText, Download, Loader2, AlertCircle, ExternalLink } from 'lucide-react'

export default function SharedDocumentPage() {
  const params = useParams()
  const token = params.token as string
  const [doc, setDoc] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    fetch('/api/wavecore/documents/shared/' + token)
      .then(r => r.json())
      .then(d => {
        if (d.document) setDoc(d.document)
        else setError(d.error || 'Document not found or link expired')
      })
      .catch(() => setError('Failed to load document'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-400 animate-spin" /></div>

  if (error) return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Cannot Load Document</h1>
      <p className="text-slate-400">{error}</p>
    </div>
  )

  const isImage = (doc.mimeType || '').startsWith('image/')
  const isPdf = doc.mimeType === 'application/pdf'

  return (
    <div className="min-h-screen bg-slate-950 text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{doc.originalName || doc.fileName}</h1>
                <p className="text-sm text-slate-400">Shared document · View-only access</p>
              </div>
            </div>
            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-xl text-sm font-medium flex items-center gap-2">
              <Download className="w-4 h-4" /> Download
            </a>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          {isImage(doc.fileUrl) ? (
            <img src={doc.fileUrl} alt={doc.originalName} className="w-full rounded-xl" />
          ) : isPdf ? (
            <iframe src={doc.fileUrl} className="w-full rounded-xl" style={{ minHeight: '600px' }} />
          ) : (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 mb-4">Preview not available</p>
              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-xl text-sm">
                <ExternalLink className="w-4 h-4" /> Open Document
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}