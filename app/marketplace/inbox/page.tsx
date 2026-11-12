'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { MessageCircle, Send, Loader2, ChevronLeft, User, BadgeCheck, AlertCircle, CheckCheck } from 'lucide-react'

const POLL_INTERVAL = 3000  // 3 seconds

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeConversation, setActiveConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [subscriptionRequired, setSubscriptionRequired] = useState(false)
  const [pollingActive, setPollingActive] = useState(true)
  const [lastMessageId, setLastMessageId] = useState<number>(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  // Initial fetch
  useEffect(() => {
    fetchConversations()
  }, [])

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      setMessages([])
      setLastMessageId(0)
      setAutoScroll(true)
      fetchMessages(activeConversation.id, 0)
    }
  }, [activeConversation?.id])

  // Poll for new messages + conversation updates
  useEffect(() => {
    if (!pollingActive) return
    const interval = setInterval(() => {
      if (activeConversation) {
        // Only fetch new messages
        fetchMessages(activeConversation.id, lastMessageId, true)
      }
      // Always refresh conversations for unread counts
      fetchConversations(true)
    }, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [activeConversation?.id, lastMessageId, pollingActive])

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, autoScroll])

  const fetchConversations = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/marketplace/conversations')
      if (res.status === 402) {
        setSubscriptionRequired(true)
        setConversations([])
        return
      }
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
        setSubscriptionRequired(false)
        if (data.conversations?.length > 0 && !activeConversation) {
          setActiveConversation(data.conversations[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch conversations')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: number, sinceId: number = 0, silent = false) => {
    try {
      const url = sinceId > 0
        ? `/api/marketplace/messages?conversationId=${conversationId}&sinceId=${sinceId}`
        : `/api/marketplace/messages?conversationId=${conversationId}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        const newMsgs = data.messages || []
        if (sinceId > 0) {
          // Append only new messages
          if (newMsgs.length > 0) {
            setMessages(prev => {
              const existingIds = new Set(prev.map(m => m.id))
              const unique = newMsgs.filter((m: any) => !existingIds.has(m.id))
              return [...prev, ...unique]
            })
            setLastMessageId(newMsgs[newMsgs.length - 1].id)
          }
        } else {
          setMessages(newMsgs)
          if (newMsgs.length > 0) setLastMessageId(newMsgs[newMsgs.length - 1].id)
        }
      }
    } catch (error) {
      if (!silent) console.error('Failed to fetch messages')
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConversation) return
    setSending(true)
    setAutoScroll(true)
    try {
      const res = await fetch('/api/marketplace/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeConversation.id, content: newMessage.trim() })
      })
      if (res.ok) {
        setNewMessage('')
        await fetchMessages(activeConversation.id, 0)
        fetchConversations(true)
      }
    } catch (error) {
      console.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleScroll = () => {
    if (!messagesContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    const atBottom = scrollHeight - scrollTop - clientHeight < 50
    setAutoScroll(atBottom)
  }

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

  if (subscriptionRequired) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-2xl border p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Subscription Required</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Messaging is available to subscribed users only. Activate a plan to message sellers and buyers.
          </p>
          <a href="/wavecore-erp/subscription/pay" className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold hover:opacity-90">
            Subscribe Now
          </a>
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
          <span className="font-bold text-lg flex items-center gap-2 relative">
            <MessageCircle className="w-5 h-5 text-blue-500" /> Inbox
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-6 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            <span className="hidden md:flex items-center gap-1 text-xs text-green-400">
              <span className={`w-2 h-2 rounded-full ${pollingActive ? 'bg-green-500 animate-pulse' : 'bg-neutral-500'}`}></span>
              {pollingActive ? 'Live' : 'Paused'}
            </span>
            <div className="w-8"></div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-6">
        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-500" /></div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium text-muted-foreground">No conversations yet</p>
            <p className="text-sm text-muted-foreground mt-1">When you contact a seller, your conversations will appear here</p>
            <Link href="/marketplace" className="mt-4 inline-block px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700">
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Conversations List */}
            <div className="md:col-span-1 bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
              <div className="p-4 border-b bg-neutral-50 dark:bg-neutral-800 flex items-center justify-between">
                <h2 className="font-bold">Conversations ({conversations.length})</h2>
                {totalUnread > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">{totalUnread} new</span>
                )}
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {conversations.map(conv => (
                  <button key={conv.id} onClick={() => setActiveConversation(conv)}
                    className={`w-full text-left p-4 border-b transition-colors ${
                      activeConversation?.id === conv.id
                        ? 'bg-blue-50 dark:bg-blue-950'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        {conv.otherPartyImage ? (
                          <img src={conv.otherPartyImage} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`truncate ${conv.unreadCount > 0 ? 'font-bold' : 'font-medium'}`}>{conv.otherPartyName || 'User'}</p>
                          {conv.unreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-bold">{conv.unreadCount}</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conv.lastMessage || 'No messages'}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <BadgeCheck className="w-3 h-3 text-blue-500" />
                          {conv.listingTitle}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="md:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border flex flex-col h-[600px]">
              {activeConversation ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b bg-neutral-50 dark:bg-neutral-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">{activeConversation.otherPartyName || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{activeConversation.listingTitle}</p>
                    </div>
                    <span className="text-sm font-bold text-green-600">KSh {Number(activeConversation.listingPrice).toLocaleString()}</span>
                  </div>

                  {/* Messages */}
                  <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-muted-foreground">Start the conversation</p>
                      </div>
                    ) : messages.map(msg => {
                      const isMine = msg.senderId !== activeConversation.buyerId ? msg.senderId === activeConversation.sellerId && activeConversation.buyerId !== activeConversation.sellerId && false : false
                      // Simplify: use currentUserId not available here; fallback to comparing senderId to which role
                      const isBuyer = msg.senderId === activeConversation.buyerId
                      return (
                        <div key={msg.id} className={`flex flex-col ${isBuyer ? 'items-start' : 'items-end'}`}>
                          <span className={`text-[10px] font-semibold mb-1 px-1 ${isBuyer ? 'text-pink-600' : 'text-blue-600'}`}>
                            {msg.senderName || (isBuyer ? 'Buyer' : 'Seller')}
                          </span>
                          <div className={`max-w-[70%] p-3 rounded-2xl ${
                            isBuyer ? 'bg-pink-500 text-white rounded-bl-sm' : 'bg-blue-500 text-white rounded-br-sm'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <div className="flex items-center gap-1 mt-1 justify-end">
                              <p className="text-[10px] text-white/80">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {msg.isRead && <CheckCheck className="w-3 h-3 text-white/80" />}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <form onSubmit={sendMessage} className="p-4 border-t flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                    />
                    <button type="submit" disabled={sending || !newMessage.trim()}
                      className="px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-muted-foreground">Select a conversation</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}