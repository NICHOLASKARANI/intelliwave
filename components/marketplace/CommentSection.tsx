'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { MessageSquare, Heart, Send, Trash2, Reply, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

interface CommentUser {
  userName: string | null
  userImage: string | null
}

interface Comment {
  id: string
  userId: string
  listingId: number
  parentId: string | null
  body: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  userName: string | null
  userImage: string | null
  likeCount: number
  userLiked: boolean
  isOwner: boolean
  replies: Comment[]
}

interface CommentSectionProps {
  listingId: number
}

export function CommentSection({ listingId }: CommentSectionProps) {
  const router = useRouter()
  const [comments, setComments] = useState<Comment[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [likingComment, setLikingComment] = useState<string | null>(null)

  const loadComments = async () => {
    try {
      const res = await fetch('/api/marketplace/comments?listingId=' + listingId + '&limit=100', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load')
      const d = await res.json()
      setComments(d.comments || [])
      setTotal(d.total || 0)
      setAuthenticated(d.authenticated !== false)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComments()
  }, [listingId])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/marketplace/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, body: newComment.trim() }),
      })
      if (res.status === 401) {
        router.push('/wavecore-erp/auth/login?returnTo=' + window.location.pathname)
        return
      }
      if (!res.ok) throw new Error('Failed to post')
      const d = await res.json()
      setComments(prev => [...prev, { ...d.comment, replies: [] }])
      setTotal(t => t + 1)
      setNewComment('')
    } catch {
      alert('Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!replyBody.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/marketplace/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, body: replyBody.trim(), parentId }),
      })
      if (res.status === 401) {
        router.push('/wavecore-erp/auth/login?returnTo=' + window.location.pathname)
        return
      }
      if (!res.ok) throw new Error('Failed to reply')
      const d = await res.json()
      setComments(prev => prev.map(c =>
        c.id === parentId
          ? { ...c, replies: [...(c.replies || []), { ...d.comment, replies: [] }] }
          : c
      ))
      setReplyBody('')
      setReplyingTo(null)
    } catch {
      alert('Failed to post reply')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLike = async (commentId: string) => {
    setLikingComment(commentId)
    try {
      const res = await fetch('/api/marketplace/comments/' + commentId + '/like', {
        method: 'POST',
      })
      if (res.status === 401) {
        router.push('/wavecore-erp/auth/login?returnTo=' + window.location.pathname)
        return
      }
      if (!res.ok) throw new Error('Failed')
      const d = await res.json()

      const updateComment = (c: Comment): Comment =>
        c.id === commentId
          ? { ...c, likeCount: d.likeCount, userLiked: d.userLiked }
          : { ...c, replies: (c.replies || []).map(updateComment) }

      setComments(prev => prev.map(updateComment))
    } catch {
      // silent
    } finally {
      setLikingComment(null)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return
    setDeleting(commentId)
    try {
      const res = await fetch('/api/marketplace/comments/' + commentId, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed')
      setComments(prev => prev.filter(c => c.id !== commentId).map(c => ({
        ...c,
        replies: (c.replies || []).filter(r => r.id !== commentId),
      })))
      setTotal(t => Math.max(0, t - 1))
    } catch {
      alert('Failed to delete')
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return mins + 'm ago'
    const hours = Math.floor(mins / 60)
    if (hours < 24) return hours + 'h ago'
    const days = Math.floor(hours / 24)
    if (days < 7) return days + 'd ago'
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const CommentAvatar = ({ name, image, size = 'md' }: { name: string | null, image: string | null, size?: 'sm' | 'md' }) => {
    const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
    return (
      <div className={'rounded-full overflow-hidden bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0 ' + sizeClass}>
        {image ? (
          <Image src={image} alt={name || 'User'} width={40} height={40} className="object-cover w-full h-full" />
        ) : (
          <span className="text-white font-bold">{(name || 'A').charAt(0).toUpperCase()}</span>
        )}
      </div>
    )
  }

  const CommentItem = ({ comment, isReply = false }: { comment: Comment, isReply?: boolean }) => {
    return (
      <div className={isReply ? 'ml-12 mt-3' : 'mt-4'}>
        <div className="flex gap-3">
          <CommentAvatar name={comment.userName} image={comment.userImage} size={isReply ? 'sm' : 'md'} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1 flex-wrap">
              <p className="font-bold text-sm text-white">{comment.userName || 'Anonymous'}</p>
              <span className="text-xs text-neutral-500">{formatDate(comment.createdAt)}</span>
            </div>
            <p className="text-sm text-neutral-300 whitespace-pre-line break-words">{comment.body}</p>

            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => handleLike(comment.id)}
                disabled={likingComment === comment.id}
                className={'flex items-center gap-1 text-xs transition-colors ' + (comment.userLiked ? 'text-red-400' : 'text-neutral-500 hover:text-red-400')}
              >
                {likingComment === comment.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Heart className={'w-3.5 h-3.5 ' + (comment.userLiked ? 'fill-current' : '')} />
                )}
                {comment.likeCount > 0 && <span className="font-bold">{comment.likeCount}</span>}
              </button>

              {!isReply && authenticated && (
                <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="flex items-center gap-1 text-xs text-neutral-500 hover:text-cyan-400 transition-colors"
                >
                  <Reply className="w-3.5 h-3.5" /> Reply
                </button>
              )}

              {comment.isOwner && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  disabled={deleting === comment.id}
                  className="flex items-center gap-1 text-xs text-neutral-500 hover:text-red-400 transition-colors"
                >
                  {deleting === comment.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Delete
                </button>
              )}
            </div>

            {replyingTo === comment.id && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={replyBody}
                  onChange={e => setReplyBody(e.target.value)}
                  placeholder={'Reply to ' + (comment.userName || 'user') + '...'}
                  className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitReply(comment.id) } }}
                />
                <button
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={submitting || !replyBody.trim()}
                  className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded-lg text-sm font-bold"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-2">
                {comment.replies.map(reply => (
                  <CommentItem key={reply.id} comment={reply} isReply={true} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mt-8 pt-8 border-t border-neutral-800">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-cyan-400" />
          <h2 className="text-2xl font-bold">Comments</h2>
        </div>
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8 pt-8 border-t border-neutral-800">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-cyan-400" />
        <h2 className="text-2xl font-bold">Comments ({total})</h2>
      </div>

      {authenticated ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="flex gap-3">
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this product..."
                rows={3}
                maxLength={2000}
                className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-neutral-500">{newComment.length}/2000</span>
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Post Comment
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-center">
          <p className="text-sm text-neutral-400">
            <a href={'/wavecore-erp/auth/login?returnTo=' + (typeof window !== 'undefined' ? window.location.pathname : '')} className="text-cyan-400 hover:underline font-bold">
              Sign in
            </a>{' '}to comment on this product
          </p>
        </div>
      )}

      {comments.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-1">
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  )
}