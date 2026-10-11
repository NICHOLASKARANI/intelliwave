'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Upload, Save, Loader2, CheckCircle, AlertCircle, X, ArrowLeft, Building2 } from 'lucide-react'
import { authedFetch } from '@/lib/wavecore/csrf-client'

export default function BrandingPage() {
  const [companyName, setCompanyName] = useState('')
  const [logo, setLogo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchBranding = async () => {
    setLoading(true)
    try {
      const res = await authedFetch('/api/wavecore/organization/branding')
      const data = await res.json()
      setCompanyName(data.companyName || '')
      setLogo(data.logo || null)
    } catch {
      setError('Failed to load branding')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBranding() }, [])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500 * 1024) {
      setError('Logo must be under 500KB')
      return
    }
    if (!/^image\/(png|jpe?g|svg\+xml|webp|gif)$/.test(file.type)) {
      setError('Logo must be PNG, JPG, SVG, WebP, or GIF')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setLogo(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  const clearLogo = () => {
    setLogo(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const save = async () => {
    setSaving(true); setError(''); setSuccess('')
    try {
      const res = await authedFetch('/api/wavecore/organization/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, logo }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to save'); return }
      setCompanyName(data.companyName || companyName)
      setLogo(data.logo || null)
      setSuccess('Branding saved successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/settings" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Organization Branding</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 lg:p-8">
        <Link href="/wavecore-erp/settings" className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Settings
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <Building2 className="w-7 h-7 text-teal-400" /> Organization Branding
        </h1>
        <p className="text-sm text-neutral-400 mb-8">
          Upload your logo and set your company name. These will appear on every report, invoice, and PDF you print or download.
        </p>

        {error && (
          <div className="p-4 mb-6 rounded-xl bg-red-900/50 border border-red-800 text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
        {success && (
          <div className="p-4 mb-6 rounded-xl bg-green-900/50 border border-green-800 text-green-300 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> {success}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-400" /></div>
        ) : (
          <div className="space-y-6">
            {/* Company name */}
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
              <label className="block text-sm font-bold text-white mb-2">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-teal-500"
                placeholder="Your company name"
                maxLength={120}
              />
              <p className="text-xs text-neutral-500 mt-2">This appears as the header text on all reports.</p>
            </div>

            {/* Logo */}
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
              <label className="block text-sm font-bold text-white mb-4">Company Logo</label>

              <div className="flex items-start gap-6">
                {/* Preview */}
                <div className="w-40 h-40 rounded-xl border border-neutral-800 bg-neutral-950 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logo} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <p className="text-xs text-neutral-600 text-center px-2">No logo uploaded yet</p>
                  )}
                </div>

                {/* Controls */}
                <div className="flex-1 space-y-3">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                    onChange={handleFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full px-4 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" /> Choose Image
                  </button>
                  {logo && (
                    <button
                      type="button"
                      onClick={clearLogo}
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" /> Remove Logo
                    </button>
                  )}
                  <p className="text-xs text-neutral-500">
                    PNG, JPG, SVG, WebP, or GIF · max 500KB · will be embedded in every report and invoice
                  </p>
                </div>
              </div>
            </div>

            {/* Preview note */}
            <div className="bg-neutral-900/60 rounded-2xl border border-neutral-800 p-4 text-xs text-neutral-400">
              When you print or download a document, the header will show {logo ? 'your logo and company name' : 'the default WaveCore ERP branding (no logo set)'}.
            </div>

            {/* Save */}
            <button
              onClick={save}
              disabled={saving}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? 'Saving...' : 'Save Branding'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}