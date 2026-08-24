'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MessageCircle, Send, Loader2, ChevronLeft, User, BadgeCheck } from 'lucide-react'

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeConversation, setActiveConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id)
    }
  }, [activeConversation])

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/marketplace/conversations')
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
        if (data.conversations?.length > 0 && !activeConversation) {
          setActiveConversation(data.conversations[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch conversations')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: number) => {
    try {
      const res = await fetch(`/api/marketplace/messages?conversationId=${conversationId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to fetch messages')
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConversation) return
    setSending(true)
    try {
      const res = await fetch('/api/marketplace/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeConversation.id, content: newMessage.trim() })
      })
      if (res.ok) {
        setNewMessage('')
        fetchMessages(activeConversation.id)
        fetchConversations()
      }
    } catch (error) {
      console.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/marketplace" className="flex items-center gap-2 font-bold">
            <ChevronLeft className="w-5 h-5" /> Marketplace
          </Link>
          <span className="font-bold text-lg flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-500" /> Inbox
          </span>
          <div className="w-16"></div>
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
              <div className="p-4 border-b bg-neutral-50 dark:bg-neutral-800">
                <h2 className="font-bold">Conversations ({conversations.length})</h2>
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
                          <p className="font-medium truncate">{conv.otherPartyName || 'User'}</p>
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
                  {/* Conversation Header */}
                  <div className="p-4 border-b bg-neutral-50 dark:bg-neutral-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-bold">{activeConversation.otherPartyName || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{activeConversation.listingTitle}</p>
                    </div>
                    <span className="ml-auto text-sm font-bold text-green-600">KSh {Number(activeConversation.listingPrice).toLocaleString()}</span>
                  </div>

                  {/* Messages List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.senderId === activeConversation.buyerId && msg.senderId !== activeConversation.sellerId ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-3 rounded-2xl ${
                          msg.senderId === activeConversation.buyerId
                            ? 'bg-blue-600 text-white'
                            : 'bg-neutral-100 dark:bg-neutral-800'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${msg.senderId === activeConversation.buyerId ? 'text-white/70' : 'text-muted-foreground'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <form onSubmit={sendMessage} className="p-4 border-t flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button type="submit" disabled={sending || !newMessage.trim()}
                      className="px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                      <Send className="w-4 h-4" />
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