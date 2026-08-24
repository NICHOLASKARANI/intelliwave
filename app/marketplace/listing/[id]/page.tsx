'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  MessageCircle, Send, MapPin, Tag, Clock, Eye,
  Heart, Share2, Loader2, ChevronLeft, Shield,
  BadgeCheck, User, Phone, CheckCircle
} from 'lucide-react'

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [showContact, setShowContact] = useState(false)
  const [conversationCreated, setConversationCreated] = useState(false)

  useEffect(() => {
    fetchListing()
  }, [params.id])

  const fetchListing = async () => {
    try {
      const res = await fetch(`/api/marketplace/listings?id=${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setListing(data.listing)
      }
    } catch (error) {
      console.error('Failed to fetch listing')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (saved) {
      await fetch(`/api/marketplace/saved?listingId=${params.id}`, { method: 'DELETE' })
      setSaved(false)
    } else {
      await fetch('/api/marketplace/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: params.id })
      })
      setSaved(true)
    }
  }

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      const res = await fetch('/api/marketplace/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: parseInt(params.id), message: message || 'Hello, is this available?' })
      })
      if (res.ok) {
        setConversationCreated(true)
        setShowContact(false)
        setMessage('')
      }
    } catch (error) {
      console.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: listing?.title,
        text: `Check out this listing: ${listing?.title}`,
        url: window.location.href
      })
    } catch (error) {
      // Fallback
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold mb-2">Listing not found</p>
          <Link href="/marketplace" className="text-blue-600">Back to Marketplace</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/marketplace" className="flex items-center gap-2 font-bold">
            <ChevronLeft className="w-5 h-5" /> Marketplace
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={handleShare} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <Share2 className="w-5 h-5" />
            </button>
            <button onClick={handleSave} className={`p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 ${saved ? 'text-red-500' : ''}`}>
              <Heart className={`w-5 h-5 ${saved ? 'fill-red-500' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Images */}
          <div>
            <div className="rounded-2xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 h-96 relative">
              {listing.images && listing.images[activeImage] ? (
                <img src={listing.images[activeImage]} alt={listing.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image src="/images/Wavecore.jpeg" alt="" width={80} height={80} className="opacity-30" />
                </div>
              )}
              {listing.condition === 'New' && (
                <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-green-500 text-white text-sm font-bold">
                  NEW
                </div>
              )}
            </div>
            {listing.images && listing.images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {listing.images.map((img: string, index: number) => (
                  <button key={index} onClick={() => setActiveImage(index)}
                    className={`w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 ${activeImage === index ? 'border-blue-500' : 'border-transparent'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-3">{listing.title}</h1>
            <p className="text-3xl font-bold text-green-600 mb-4">KSh {Number(listing.price).toLocaleString()}</p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {listing.location || 'Kenya'}</span>
              <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {listing.views || 0} views</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(listing.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 text-sm font-medium flex items-center gap-1">
                <Tag className="w-3 h-3" /> {listing.category}
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 text-sm font-medium">
                {listing.condition || 'Used'}
              </span>
            </div>

            <div className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 mb-4">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{listing.description || 'No description provided'}</p>
            </div>

            {/* Seller Info */}
            <div className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  {listing.sellerImage ? (
                    <img src={listing.sellerImage} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <p className="font-bold flex items-center gap-1">
                    {listing.sellerName || 'Seller'}
                    <BadgeCheck className="w-4 h-4 text-blue-500" />
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Shield className="w-3 h-3 text-green-500" /> Verified Seller
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Button */}
            {conversationCreated ? (
              <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="font-bold text-green-600">Message Sent!</p>
                <Link href="/marketplace/inbox" className="text-blue-600 text-sm mt-1 inline-block">Go to Inbox</Link>
              </div>
            ) : (
              <button onClick={() => setShowContact(true)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-2">
                <MessageCircle className="w-5 h-5" /> Contact Seller
              </button>
            )}

            {showContact && (
              <form onSubmit={handleContact} className="mt-4 p-4 rounded-2xl border bg-white dark:bg-neutral-900">
                <p className="font-bold mb-3">Send Message to Seller</p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hi, is this still available?"
                  className="w-full px-4 py-3 rounded-xl border mb-3 min-h-[100px]"
                />
                <button type="submit" disabled={sending}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}