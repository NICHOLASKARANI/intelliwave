'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Loader2 } from 'lucide-react'

interface LikeButtonProps {
  listingId: number
  initialCount?: number
  initialLiked?: boolean
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
  variant?: 'default' | 'inline'
}

export function LikeButton({
  listingId,
  initialCount = 0,
  initialLiked = false,
  size = 'md',
  showCount = true,
  variant = 'default',
}: LikeButtonProps) {
  const router = useRouter()
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const [authenticated, setAuthenticated] = useState(true)

  useEffect(() => {
    if (initialCount > 0 || initialLiked) return
    fetch('/api/marketplace/likes?listingId=' + listingId, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        setCount(d.likeCount || 0)
        setLiked(d.userLiked || false)
        setAuthenticated(d.authenticated !== false)
      })
      .catch(() => {})
  }, [listingId, initialCount, initialLiked])

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (loading) return

    // Optimistic update
    const newLiked = !liked
    const newCount = newLiked ? count + 1 : Math.max(0, count - 1)
    setLiked(newLiked)
    setCount(newCount)

    setLoading(true)
    try {
      const res = await fetch('/api/marketplace/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      })

      if (res.status === 401) {
        setLiked(liked)
        setCount(count)
        router.push('/wavecore-erp/auth/login?returnTo=' + window.location.pathname)
        return
      }

      if (!res.ok) {
        setLiked(liked)
        setCount(count)
        return
      }

      const d = await res.json()
      setLiked(d.userLiked)
      setCount(d.likeCount)
    } catch {
      setLiked(liked)
      setCount(count)
    } finally {
      setLoading(false)
    }
  }

  const sizeClasses = {
    sm: { button: 'px-2 py-1', icon: 'w-4 h-4', text: 'text-xs' },
    md: { button: 'px-3 py-2', icon: 'w-5 h-5', text: 'text-sm' },
    lg: { button: 'px-4 py-3', icon: 'w-6 h-6', text: 'text-base' },
  }

  const s = sizeClasses[size]

  if (variant === 'inline') {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className={'flex items-center gap-1.5 ' + s.text + ' transition-colors ' + (liked ? 'text-red-400' : 'text-neutral-400 hover:text-red-400')}
        title={liked ? 'Unlike' : 'Like'}
      >
        {loading ? (
          <Loader2 className={s.icon + ' animate-spin'} />
        ) : (
          <Heart className={s.icon + (liked ? ' fill-current' : '')} />
        )}
        {showCount && <span className="font-bold">{count}</span>}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={'flex items-center gap-2 ' + s.button + ' rounded-xl bg-neutral-800 hover:bg-neutral-700 transition-colors ' + (liked ? 'text-red-400' : 'text-neutral-400 hover:text-red-400')}
      title={liked ? 'Unlike' : 'Like'}
    >
      {loading ? (
        <Loader2 className={s.icon + ' animate-spin'} />
      ) : (
        <Heart className={s.icon + (liked ? ' fill-current' : '')} />
      )}
      {showCount && <span className={'font-bold ' + s.text}>{count}</span>}
    </button>
  )
}