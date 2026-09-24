'use client'

import { authedFetch, redirectToLogin } from '@/lib/wavecore/csrf-client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  MessageCircle, Loader2, Send, Search, Package, Store, Clock,
  RefreshCw, AlertCircle, CheckCheck, Bell,
} from 'lucide-react'

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchConversations = async () => {
    setLoading(true)
    try {
      const res = await authedFetch('/api/marketplace/conversations')
      const data = await res.json()
      setConversations(data.conversations || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchConversations() }, [])

  const loadMessages = async (conversationId: string) => {
    setLoadingMessages(true)
    try {
      const res = await fetch('/api/marketplace/messages?conversationId=' + conversationId)
      const data = await res.json()
      setMessages(data.messages || [])
    } catch {}
    finally { setLoadingMessages(false) }
  }

  const selectConversation = (c: any) => {
    setSelected(c)
    setMessages([])
    loadMessages(c.id)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !selected) return
    setSending(true)
    try {
      const res = await authedFetch('/api/marketplace/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selected.id, content: message.trim() }),
      })
      if (res.ok) {
        setMessage('')
        await loadMessages(selected.id)
        fetchConversations()
      }
    } finally { setSending(false) }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const filtered = conversations.filter(c => {
    if (!search) return true
    const s = search.toLowerCase()
    return (c.otherPartyName || '').toLowerCase().includes(s) ||
           (c.listingTitle || '').toLowerCase().includes(s) ||
           (c.lastMessage || '').toLowerCase().includes(s)
  })

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/marketplace" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveMarket" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveMarket · Messages</span>
          </Link>
          <button onClick={fetchConversations} className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white">
            <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}

        <div className="grid md:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-160px)]">
          {/* Conversation list */}
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-neutral-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search conversations..."
                  className="pl-9 pr-4 py-2 rounded-lg border border-neutral-700 bg-neutral-800 text-white w-full text-sm"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-500" /></div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30 text-neutral-500" />
                  <p className="text-sm text-neutral-500">No conversations yet</p>
                  <Link href="/wavecore-erp/marketplace" className="mt-3 inline-block text-xs text-cyan-400 hover:text-cyan-300">
                    Browse listings →
                  </Link>
                </div>
              ) : (
                filtered.map(c => (
                  <button
                    key={c.id}
                    onClick={() => selectConversation(c)}
                    className={'w-full text-left p-3 border-b border-neutral-800 hover:bg-neutral-800 transition-colors ' + (selected?.id === c.id ? 'bg-neutral-800' : '')}
                  >
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-lg bg-neutral-800 overflow-hidden flex-shrink-0">
                        {c.listingImages?.[0] ? (
                          <img src={c.listingImages[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-neutral-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <p className="text-sm font-bold text-white truncate">{c.otherPartyName || 'User'}</p>
                          {c.unreadCount > 0 && (
                            <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-cyan-500 text-white text-[10px] font-bold flex items-center justify-center">
                              {c.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 truncate">{c.listingTitle}</p>
                        <p className="text-[10px] text-neutral-600 mt-1 truncate">{c.lastMessage || 'No messages'}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat panel */}
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 flex flex-col overflow-hidden">
            {selected ? (
              <>
                <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-neutral-800 overflow-hidden flex-shrink-0">
                      {selected.listingImages?.[0] ? (
                        <img src={selected.listingImages[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-neutral-600" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{selected.otherPartyName || 'User'}</p>
                      <p className="text-xs text-neutral-500 truncate">Re: {selected.listingTitle}</p>
                    </div>
                  </div>
                  <Link href={'/wavecore-erp/marketplace/listing/' + selected.listingId} className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex-shrink-0">
                    View Item →
                  </Link>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingMessages ? (
                    <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-500" /></div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs mt-1">Start the conversation below</p>
                    </div>
                  ) : (
                    messages.map(m => {
                      // Determine if this is "my" message by checking receiverId
                      const isMine = m.senderId === selected.senderId || !m.receiverId
                      return (
                        <div key={m.id} className={'flex ' + (isMine ? 'justify-end' : 'justify-start')}>
                          <div className={'max-w-[70%] p-3 rounded-2xl ' + (isMine ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-br-sm' : 'bg-neutral-800 text-neutral-200 rounded-bl-sm')}>
                            <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                            <div className={'flex items-center gap-1 mt-1 text-[10px] ' + (isMine ? 'text-white/70 justify-end' : 'text-neutral-500')}>
                              {new Date(m.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                              {isMine && m.isRead && <CheckCheck className="w-3 h-3" />}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                <form onSubmit={sendMessage} className="p-3 border-t border-neutral-800 flex gap-2">
                  <input
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-cyan-500"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !message.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold flex items-center gap-2 disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-neutral-500">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-3 opacity-20" />
                  <p>Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}