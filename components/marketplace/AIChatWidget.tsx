'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bot, X, Send, Loader2, ShoppingCart, MessageCircle } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  products?: any[]
}

const SUGGESTIONS = [
  'Find me a phone under 20K',
  'Cheapest electronics',
  'New furniture deals',
  'Laptops for programming',
]

export default function AIChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, open])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || sending) return

    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setInput('')
    setSending(true)

    try {
      const res = await fetch('/api/marketplace/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })
      if (res.ok) {
        const d = await res.json()
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: d.reply,
          products: d.products || [],
        }])
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "I'm having trouble right now. Please try again.",
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Network error. Please try again.',
      }])
    } finally {
      setSending(false)
    }
  }

  const addToCart = async (listingId: number) => {
    try {
      const res = await fetch('/api/marketplace/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, quantity: 1 }),
      })
      if (res.ok) {
        window.dispatchEvent(new Event('cart-updated'))
        // Show success briefly
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '✓ Added to cart! Anything else I can help with?',
        }])
      } else {
        const d = await res.json()
        alert(d.error || 'Failed to add to cart')
      }
    } catch {
      alert('Network error')
    }
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-2xl hover:scale-110 transition-transform flex items-center justify-center"
          title="Ask WaveMarket AI"
        >
          <Bot className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[420px] h-[80vh] sm:h-[600px] bg-neutral-950 sm:rounded-2xl border sm:border border-neutral-800 shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-neutral-800 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">WaveMarket AI</p>
                <p className="text-xs text-cyan-400">Shopping assistant</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-neutral-400 hover:text-white p-2">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-6">
                <Bot className="w-16 h-16 mx-auto mb-4 text-cyan-400 opacity-50" />
                <p className="text-white font-bold mb-1">Hi! I'm your shopping assistant 👋</p>
                <p className="text-xs text-neutral-400 mb-6">Tell me what you're looking for</p>
                <div className="space-y-2">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="w-full text-left p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-cyan-600 text-sm text-neutral-300 transition"
                    >
                      💡 {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] ${m.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                    <div className={`p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-cyan-600 text-white rounded-br-sm'
                        : 'bg-neutral-800 text-white rounded-bl-sm'
                    }`}>
                      {m.content}
                    </div>
                    {m.products && m.products.length > 0 && (
                      <div className="space-y-2 w-full">
                        {m.products.map((p: any) => (
                          <div key={p.id} className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center gap-2">
                            <div className="w-12 h-12 rounded-lg bg-neutral-800 overflow-hidden flex-shrink-0">
                              {p.images?.[0] ? (
                                <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><ShoppingCart className="w-5 h-5 text-neutral-600" /></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <Link href={`/marketplace/listing/${p.id}`} className="text-xs font-bold text-white truncate hover:text-cyan-400 block">
                                {p.title}
                              </Link>
                              <p className="text-xs text-amber-400 font-bold">KES {Number(p.price).toLocaleString()}</p>
                              {p.averageRating && <p className="text-[10px] text-neutral-500">⭐ {Number(p.averageRating).toFixed(1)}</p>}
                            </div>
                            <button
                              onClick={() => addToCart(p.id)}
                              className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white flex-shrink-0"
                              title="Add to cart"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="flex justify-start">
                <div className="p-3 rounded-2xl bg-neutral-800 text-white rounded-bl-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-neutral-800 bg-neutral-900">
            <form onSubmit={e => { e.preventDefault(); sendMessage() }} className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[10px] text-neutral-500 text-center mt-2">
              AI can make mistakes. Verify product details before buying.
            </p>
          </div>
        </div>
      )}
    </>
  )
}