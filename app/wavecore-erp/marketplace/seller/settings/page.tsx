'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageCircle, Phone, Loader2, AlertCircle, CheckCircle2, Info } from 'lucide-react'

interface SettingsData {
  whatsappNumber: string | null
  mpesaNumber: string | null
  signupPhone: string | null
  effectiveWhatsApp: string | null
  isExplicit: boolean
}

export default function SellerSettingsPage() {
  const router = useRouter()
  const [data, setData] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [whatsappInput, setWhatsappInput] = useState('')

  useEffect(() => {
    fetch('/api/marketplace/seller/whatsapp')
      .then(r => {
        if (r.status === 401) {
          router.push('/wavecore-erp/auth/login?returnTo=/wavecore-erp/marketplace/seller/settings')
          return null
        }
        if (r.status === 404) {
          setError('You need to create a listing first to become a seller')
          setLoading(false)
          return null
        }
        return r.json()
      })
      .then(d => {
        if (d) {
          setData(d)
          setWhatsappInput(d.whatsappNumber || '')
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load settings')
        setLoading(false)
      })
  }, [router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/marketplace/seller/whatsapp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsappNumber: whatsappInput.trim() || null }),
      })

      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to save')
      }

      const updated = await res.json()
      setData(prev => prev ? { ...prev, ...updated } : null)
      setSuccess('WhatsApp number updated successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleClear = async () => {
    setWhatsappInput('')
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/marketplace/seller/whatsapp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsappNumber: null }),
      })
      if (!res.ok) throw new Error('Failed to clear')
      const updated = await res.json()
      setData(prev => prev ? { ...prev, ...updated } : null)
      setSuccess('Custom WhatsApp removed - using fallback')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/wavecore-erp/marketplace/seller" className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Seller Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">WhatsApp Settings</h1>
            <p className="text-sm text-neutral-400">Control how buyers contact you</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2 text-red-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-start gap-2 text-green-300">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{success}</p>
          </div>
        )}

        {data && (
          <>
            {/* Current status card */}
            <div className="mb-6 p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
              <h3 className="text-sm font-bold uppercase text-neutral-500 mb-3">Current WhatsApp for Buyers</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono">
                    {data.effectiveWhatsApp ? '+' + data.effectiveWhatsApp.replace(/\D/g, '') : 'No number set'}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {data.isExplicit ? 'Custom WhatsApp number' : 'Using fallback (M-Pesa or signup phone)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Edit form */}
            <form onSubmit={handleSave} className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
              <h3 className="text-lg font-bold mb-4">Set Your WhatsApp Number</h3>
              <p className="text-sm text-neutral-400 mb-4">
                This is the number buyers will reach when they click "Contact on WhatsApp".
                Leave empty to use your registered phone number.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">WhatsApp Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="tel"
                    value={whatsappInput}
                    onChange={e => setWhatsappInput(e.target.value)}
                    placeholder="+254 700 000 000"
                    className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-green-500"
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  Include country code (e.g. +254 for Kenya). Buyers see this as WhatsApp.
                </p>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-xl font-bold flex items-center gap-2 transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Save WhatsApp Number
                </button>
                {data.whatsappNumber && (
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={saving}
                    className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 rounded-xl font-bold transition-colors"
                  >
                    Use Default
                  </button>
                )}
              </div>
            </form>

            {/* Info card */}
            <div className="mt-6 p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-neutral-400">
                <p className="font-bold text-white mb-1">How this works</p>
                <p>Buyers click "Contact on WhatsApp" on your listings. Your number is used only for that interaction — never shared publicly.</p>
                <p className="mt-2 text-xs text-neutral-500">
                  If you leave the custom number empty, your M-Pesa number or registered phone is used instead.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}