'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Loader2, ExternalLink } from 'lucide-react'

interface WhatsAppButtonProps {
  listingId: number
  listingTitle?: string
  listingUrl?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'icon'
  onNoNumber?: () => void
}

export function WhatsAppButton({
  listingId,
  listingTitle = '',
  listingUrl,
  size = 'md',
  variant = 'primary',
  onNoNumber,
}: WhatsAppButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/marketplace/listings/' + listingId + '/whatsapp', {
        cache: 'no-store',
      })

      if (res.status === 401) {
        router.push('/wavecore-erp/auth/login?returnTo=' + window.location.pathname)
        return
      }

      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        if (d.canChat && onNoNumber) {
          onNoNumber()
          return
        }
        setError(d.error || 'Seller unavailable on WhatsApp')
        return
      }

      const data = await res.json()
      const whatsapp = data.whatsapp

      if (!whatsapp) {
        setError('No WhatsApp number available')
        return
      }

      // Build prefilled message
      const url = listingUrl || (typeof window !== 'undefined' ? window.location.href : '')
      let message = 'Hi! I am interested in'
      if (listingTitle) {
        message += ' "' + listingTitle + '"'
      }
      message += ' on IntelliWavve Marketplace'
      if (url) {
        message += ': ' + url
      }

      const waUrl = 'https://wa.me/' + whatsapp + '?text=' + encodeURIComponent(message)
      window.open(waUrl, '_blank', 'noopener,noreferrer')
    } catch {
      setError('Failed to contact seller')
    } finally {
      setLoading(false)
    }
  }

  const sizeClasses = {
    sm: { button: 'px-3 py-1.5 text-xs', icon: 'w-3.5 h-3.5' },
    md: { button: 'px-4 py-2 text-sm', icon: 'w-4 h-4' },
    lg: { button: 'px-5 py-3 text-base', icon: 'w-5 h-5' },
  }

  const s = sizeClasses[size]

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className="p-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-colors disabled:opacity-50"
        title="Contact on WhatsApp"
      >
        {loading ? <Loader2 className={s.icon + ' animate-spin'} /> : <MessageCircle className={s.icon} />}
      </button>
    )
  }

  if (variant === 'secondary') {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className={'flex items-center justify-center gap-2 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 font-bold transition-colors disabled:opacity-50 ' + s.button}
      >
        {loading ? <Loader2 className={s.icon + ' animate-spin'} /> : <MessageCircle className={s.icon} />}
        {error || 'Chat on WhatsApp'}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={'flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition-colors disabled:opacity-50 ' + s.button}
    >
      {loading ? <Loader2 className={s.icon + ' animate-spin'} /> : <MessageCircle className={s.icon} />}
      Contact on WhatsApp
    </button>
  )
}