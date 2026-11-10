'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, UserCheck, Loader2 } from 'lucide-react'

interface FollowButtonProps {
  sellerId: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost' | 'inline'
  initialFollowing?: boolean
  initialCount?: number
  showCount?: boolean
}

export function FollowButton({
  sellerId,
  size = 'md',
  variant = 'default',
  initialFollowing = false,
  initialCount = 0,
  showCount = true,
}: FollowButtonProps) {
  const router = useRouter()
  const [following, setFollowing] = useState(initialFollowing)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const [isSelf, setIsSelf] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Skip initial fetch if already preloaded
    if (initialFollowing || initialCount > 0) {
      setLoaded(true)
      return
    }

    fetch('/api/marketplace/follows?sellerId=' + encodeURIComponent(sellerId), { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        setFollowing(d.following || false)
        setCount(d.followerCount || 0)
        setIsSelf(d.isSelf || false)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [sellerId, initialFollowing, initialCount])

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return

    setLoading(true)
    const wasFollowing = following
    const prevCount = count

    // Optimistic update
    setFollowing(!wasFollowing)
    setCount(wasFollowing ? Math.max(0, prevCount - 1) : prevCount + 1)

    try {
      const url = wasFollowing
        ? '/api/marketplace/follows?sellerId=' + encodeURIComponent(sellerId)
        : '/api/marketplace/follows'

      const options: RequestInit = wasFollowing
        ? { method: 'DELETE' }
        : {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sellerId }),
          }

      const res = await fetch(url, options)

      if (res.status === 401) {
        // Rollback
        setFollowing(wasFollowing)
        setCount(prevCount)
        router.push('/wavecore-erp/auth/login?returnTo=' + window.location.pathname)
        return
      }

      if (!res.ok) {
        // Rollback
        setFollowing(wasFollowing)
        setCount(prevCount)
        return
      }

      const d = await res.json()
      setFollowing(d.following)
      setCount(d.followerCount)
    } catch {
      // Rollback
      setFollowing(wasFollowing)
      setCount(prevCount)
    } finally {
      setLoading(false)
    }
  }

  // Don't show button for own profile
  if (isSelf) {
    return null
  }

  const sizeClasses = {
    sm: { button: 'px-3 py-1.5 text-xs', icon: 'w-3.5 h-3.5' },
    md: { button: 'px-4 py-2 text-sm', icon: 'w-4 h-4' },
    lg: { button: 'px-5 py-3 text-base', icon: 'w-5 h-5' },
  }

  const s = sizeClasses[size]

  // Variant: inline (icon + text only, no background)
  if (variant === 'inline') {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className={'inline-flex items-center gap-1.5 font-bold transition-colors disabled:opacity-50 ' + s.button + ' ' + (following ? 'text-cyan-400 hover:text-cyan-300' : 'text-neutral-400 hover:text-cyan-400')}
      >
        {loading ? (
          <Loader2 className={s.icon + ' animate-spin'} />
        ) : following ? (
          <UserCheck className={s.icon} />
        ) : (
          <UserPlus className={s.icon} />
        )}
        {following ? 'Following' : 'Follow'}
        {showCount && count > 0 && <span className="ml-1">({count})</span>}
      </button>
    )
  }

  // Variant: ghost (subtle outline)
  if (variant === 'ghost') {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className={'inline-flex items-center gap-2 font-bold transition-colors disabled:opacity-50 rounded-xl border ' + s.button + ' ' + (following ? 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20' : 'border-neutral-700 text-neutral-300 hover:border-cyan-500/50 hover:text-cyan-400')}
      >
        {loading ? (
          <Loader2 className={s.icon + ' animate-spin'} />
        ) : following ? (
          <UserCheck className={s.icon} />
        ) : (
          <UserPlus className={s.icon} />
        )}
        {following ? 'Following' : 'Follow'}
        {showCount && <span className="font-normal opacity-75">· {count}</span>}
      </button>
    )
  }

  // Default: solid button
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={'inline-flex items-center gap-2 font-bold transition-colors disabled:opacity-50 rounded-xl ' + s.button + ' ' + (following ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' : 'bg-cyan-600 text-white hover:bg-cyan-500')}
    >
      {loading ? (
        <Loader2 className={s.icon + ' animate-spin'} />
      ) : following ? (
        <UserCheck className={s.icon} />
      ) : (
        <UserPlus className={s.icon} />
      )}
      {following ? 'Following' : 'Follow'}
      {showCount && <span className="font-normal opacity-75">· {count}</span>}
    </button>
  )
}