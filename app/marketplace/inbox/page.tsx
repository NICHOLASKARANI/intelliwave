'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { MessageCircle, Send, Loader2, ChevronLeft, User, BadgeCheck, AlertCircle, CheckCheck, Paperclip, Image as ImageIcon, FileText, X, ExternalLink } from 'lucide-react'

const POLL_INTERVAL = 3000

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeConversation, setActiveConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [subscriptionRequired, setSubscriptionRequired] = useState(false)
  const [lastMessageId, setLastMessageId] = useState<number>(0)
  const [uploading, setUploading] = useState(false)
  const [pendingAttachments, setPendingAttachments] = useState<string[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  // Fetch current user id
  useEffect(() => {
    fetch('/api/wavecore/auth/session')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.userId) setCurrentUserId(d.userId) })
      .catch(() => {})
  }, [])

  useEffect(() => { fetchConversations() }, [])

  useEffect(() => {
    if (activeConversation) {
      setMessages([])
      setLastMessageId(0)
      setAutoScroll(true)
      setPendingAttachments([])
      fetchMessages(activeConversation.id, 0)
    }
  }, [activeConversation?.id])

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeConversation) fetchMessages(activeConversation.id, lastMessageId, true)
      fetchConversations(true)
    }, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [activeConversation?.id, lastMessageId])

  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, autoScroll])

  const fetchConversations = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/marketplace/conversations')
      if (res.status === 402) { setSubscriptionRequired(true); setConversations([]); return }
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
        setSubscriptionRequired(false)
        if (data.conversations?.length > 0 && !activeConversation) setActiveConversation(data.conversations[0])
      }
    } catch {}
    finally { if (!silent) setLoading(false) }
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
    } catch (error) { if (!silent) console.error('fetchMessages', error) }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) { alert(`${file.name} is too large (max 10MB)`); continue }
        const fd = new FormData()
        fd.append('file', file)
        fd.append('title', file.name.replace(/\.[^.]+$/, ''))
        const res = await fetch('/api/marketplace/upload', { method: 'POST', body: fd })
        if (res.ok) {
          const d = await res.json()
          if (d.url) setPendingAttachments(prev => [...prev, d.url])
        } else {
          const d = await res.json()
          alert(d.error || 'Upload failed')
        }
      }
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (url: string) => {
    setPendingAttachments(prev => prev.filter(x => x !== url))
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newMessage.trim() && pendingAttachments.length === 0) || !activeConversation) return
    setSending(true)
    setAutoScroll(true)
    try {
      const hasFiles = pendingAttachments.length > 0
      const hasText = newMessage.trim().length > 0
      const messageType = hasFiles && hasText ? 'mixed' : hasFiles ? 'file' : 'text'

      const res = await fetch('/api/marketplace/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          content: newMessage.trim() || (hasFiles ? '📎 Sent an attachment' : ''),
          attachments: pendingAttachments,
          messageType,
        })
      })
      if (res.ok) {
        setNewMessage('')
        setPendingAttachments([])
        await fetchMessages(activeConversation.id, 0)
        fetchConversations(true)
      }
    } catch (error) { console.error('Failed to send message') }
    finally { setSending(false) }
  }

  const handleScroll = () => {
    if (!messagesContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 50)
  }

  const isImage = (url: string) => /\.(jpg|jpeg|png|webp|gif)$/i.test(url) || url.includes('image')
  const getFileName = (url: string) => {
    try { return decodeURIComponent(url.split('/').pop()?.split('?')[0] || 'file') } catch { return 'file' }
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
          <p className="text-sm text-muted-foreground mb-6">Messaging is available to subscribed users only.</p>
          <a href="/wavecore-erp/subscription/pay" className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold hover:opacity-90">Subscribe Now</a>
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
              <span className="absolute -top-1 -right-6 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{totalUnread > 99 ? '99+' : totalUnread}</span>
            )}
          </span>
          <div className="flex items-center gap-2">
            <span className="hidden md:flex items-center gap-1 text-xs text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live
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
            <Link href="/marketplace" className="mt-4 inline-block px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700">Browse Marketplace</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
              <div className="p-4 border-b bg-neutral-50 dark:bg-neutral-800 flex items-center justify-between">
                <h2 className="font-bold">Chats ({conversations.length})</h2>
                {totalUnread > 0 && <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">{totalUnread} new</span>}
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {conversations.map(conv => (
                  <button key={conv.id} onClick={() => setActiveConversation(conv)}
                    className={`w-full text-left p-4 border-b transition-colors ${activeConversation?.id === conv.id ? 'bg-blue-50 dark:bg-blue-950' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        {conv.otherPartyImage ? <img src={conv.otherPartyImage} alt="" className="w-full h-full rounded-full object-cover" /> : <User className="w-5 h-5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`truncate ${conv.unreadCount > 0 ? 'font-bold' : 'font-medium'}`}>{conv.otherPartyName || 'User'}</p>
                          {conv.unreadCount > 0 && <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-bold">{conv.unreadCount}</span>}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conv.lastMessage || 'No messages'}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <BadgeCheck className="w-3 h-3 text-blue-500" /> {conv.listingTitle}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border flex flex-col h-[600px]">
              {activeConversation ? (
                <>
                  {/* Header with product context */}
                  <div className="p-4 border-b bg-neutral-50 dark:bg-neutral-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">{activeConversation.otherPartyName || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{activeConversation.listingTitle}</p>
                    </div>
                    <Link href={`/marketplace/listing/${activeConversation.listingId}`} className="flex items-center gap-2 bg-white dark:bg-neutral-900 rounded-xl p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
                      {activeConversation.listingImages?.[0] && (
                        <img src={activeConversation.listingImages[0]} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      )}
                      <div className="text-right">
                        <p className="text-xs font-bold text-green-600">KSh {Number(activeConversation.listingPrice).toLocaleString()}</p>
                        <p className="text-[10px] text-neutral-500 flex items-center gap-0.5">View <ExternalLink className="w-2.5 h-2.5" /></p>
                      </div>
                    </Link>
                  </div>

                  {/* Messages */}
                  <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-muted-foreground">Start the conversation</p>
                      </div>
                    ) : messages.map(msg => {
                      const isMine = currentUserId && msg.senderId === currentUserId
                      const attachments = msg.attachments || []
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                          <span className={`text-[10px] font-semibold mb-1 px-1 ${isMine ? 'text-blue-600' : 'text-pink-600'}`}>
                            {isMine ? 'You' : (msg.senderName || 'User')}
                          </span>
                          <div className={`max-w-[75%] space-y-1 ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                            {/* Attachments */}
                            {attachments.map((url: string, i: number) => (
                              <div key={i}>
                                {isImage(url) ? (
                                  <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                                    <img src={url} alt={`Attachment ${i+1}`} className="max-w-full max-h-64 rounded-xl border border-black/10 hover:opacity-90 transition" />
                                  </a>
                                ) : (
                                  <a href={url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${isMine ? 'bg-blue-600 text-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}>
                                    <FileText className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate max-w-[200px]">{getFileName(url)}</span>
                                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                  </a>
                                )}
                              </div>
                            ))}
                            {/* Text */}
                            {msg.content && (
                              <div className={`p-3 rounded-2xl ${isMine ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-bl-sm'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                <div className={`flex items-center gap-1 mt-1 justify-end ${isMine ? 'text-white/80' : 'text-neutral-500'}`}>
                                  <p className="text-[10px]">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                  {isMine && msg.isRead && <CheckCheck className="w-3 h-3" />}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Pending attachments preview */}
                  {pendingAttachments.length > 0 && (
                    <div className="px-4 py-2 border-t bg-neutral-50 dark:bg-neutral-800 flex gap-2 overflow-x-auto">
                      {pendingAttachments.map((url, i) => (
                        <div key={i} className="relative flex-shrink-0">
                          {isImage(url) ? (
                            <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                              <FileText className="w-6 h-6" />
                            </div>
                          )}
                          <button onClick={() => removeAttachment(url)} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Input */}
                  <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,.pdf,.doc,.docx,.txt,.csv" multiple />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                      className="px-3 py-3 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 disabled:opacity-50 flex items-center justify-center">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                    />
                    <button type="submit" disabled={sending || (!newMessage.trim() && pendingAttachments.length === 0)}
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