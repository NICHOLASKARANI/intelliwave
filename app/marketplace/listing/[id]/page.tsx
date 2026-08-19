'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  MessageCircle, Send, MapPin, Tag, Clock, Eye,
  Heart, Share2, Loader2, ChevronLeft, Shield
} from 'lucide-react'

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [activeImage, setActiveImage] = useState(0)
  const [subscribed, setSubscribed] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchListing()
    checkSubscription()
    fetchMessages()
  }, [params.id])

  const fetchListing = async () => {
    try {
      const res = await fetch(`/api/marketplace/listings?id=${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setListing(data.listing || data.listings?.[0])
      }
    } catch {} finally { setLoading(false) }
  }

  const checkSubscription = async () => {
    try {
      const res = await fetch('/api/wavecore/subscription')
      if (res.ok) {
        const data = await res.json()
        setSubscribed(data.subscribed)
      }
    } catch {}
  }

  const fetchMessages = async () => {
    // For now, just initialize empty
    setMessages([])
  }

  const handleSendMessage = async () => {
    if (!message.trim()) return
    setSending(true)
    // Simulate sending message
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now(), content: message, from: 'me', createdAt: new Date().toISOString() }])
      setMessage('')
      setSending(false)
    }, 1000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center">
          <p className="text-2xl font-bold mb-2">Listing Not Found</p>
          <Link href="/marketplace" className="text-indigo-500">← Back to Marketplace</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/marketplace" className="flex items-center gap-2 font-bold">
            <ChevronLeft className="w-5 h-5" /> Back
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={() => setSaved(!saved)} className="p-2 rounded-xl hover:bg-neutral-100">
              <Heart className={`w-5 h-5 ${saved ? 'text-red-500 fill-red-500' : ''}`} />
            </button>
            <button className="p-2 rounded-xl hover:bg-neutral-100">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        {subscribed ? (
          <>
            {/* Images */}
            <div className="grid gap-4 mb-8">
              {listing.images && listing.images.length > 0 ? (
                <>
                  <div className="aspect-square max-w-xl mx-auto rounded-2xl overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                    <img src={listing.images[activeImage]} alt={listing.title} className="w-full h-full object-cover" />
                  </div>
                  {listing.images.length > 1 && (
                    <div className="flex gap-2 justify-center">
                      {listing.images.map((img: string, i: number) => (
                        <button key={i} onClick={() => setActiveImage(i)}
                          className={`w-16 h-16 rounded-xl overflow-hidden border-2 ${activeImage === i ? 'border-indigo-500' : 'border-transparent'}`}>
                          <img src={img} alt={`Thumb ${i+1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-square max-w-xl mx-auto rounded-2xl bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-neutral-400" />
                </div>
              )}
            </div>

            {/* Title & Price */}
            <div className="mb-6">
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">{listing.title}</h1>
              <p className="text-3xl font-extrabold text-green-600">KSh {listing.price?.toLocaleString()}</p>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border">
                <Tag className="w-5 h-5 text-indigo-500 mb-2" />
                <p className="text-sm font-medium">{listing.category}</p>
                <p className="text-xs text-muted-foreground">Category</p>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border">
                <MapPin className="w-5 h-5 text-green-500 mb-2" />
                <p className="text-sm font-medium">{listing.location || 'Kenya'}</p>
                <p className="text-xs text-muted-foreground">Location</p>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border">
                <Clock className="w-5 h-5 text-blue-500 mb-2" />
                <p className="text-sm font-medium">{new Date(listing.createdAt).toLocaleDateString()}</p>
                <p className="text-xs text-muted-foreground">Posted</p>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border">
                <Eye className="w-5 h-5 text-purple-500 mb-2" />
                <p className="text-sm font-medium">{listing.views || 0}</p>
                <p className="text-xs text-muted-foreground">Views</p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-lg font-bold mb-2">Description</h2>
              <p className="text-neutral-600 dark:text-neutral-300">{listing.description || 'No description provided.'}</p>
            </div>

            {/* Messages */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-indigo-500" /> Message Seller
              </h2>

              {/* Message List */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {messages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No messages yet. Start a conversation with the seller!
                  </p>
                )}
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-xl ${
                      msg.from === 'me' 
                        ? 'bg-indigo-600 text-white rounded-br-md' 
                        : 'bg-neutral-100 dark:bg-neutral-800 rounded-bl-md'
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">{new Date(msg.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <input type="text" value={message} onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Type your message to the seller..." />
                <button onClick={handleSendMessage} disabled={sending || !message.trim()}
                  className="px-4 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Not subscribed - show locked state */
          <div className="text-center py-20">
            <Shield className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Subscription Required</h2>
            <p className="text-muted-foreground mb-6">
              Subscribe to WaveCore ERP (KSh 500/month) to view full listing details and message sellers.
            </p>
            <Link href="/wavecore-erp/subscription" className="inline-block px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium">
              Subscribe Now - KSh 500
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

function ImageIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
}