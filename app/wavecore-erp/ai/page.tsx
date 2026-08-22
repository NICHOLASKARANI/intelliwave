'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Bot, Send, Sparkles, Loader2, User, Zap, Globe,
  Calculator, Users, Package, Factory, Briefcase,
  Trash2, RefreshCw, ChevronRight
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your WaveCore AI Copilot, powered by DeepSeek, Claude, and OpenAI.\n\nI can help you with:\n\n• Finance analysis\n• CRM insights\n• Inventory management\n• HR operations\n• Manufacturing\n• Projects\n• Real-time business intelligence\n\nAsk me anything about your ERP!',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [provider, setProvider] = useState('DEEPSEEK')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/wavecore/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, provider }),
      })

      const data = await res.json()
      const aiReply: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.reply || 'I could not process that. Please try again.', timestamp: new Date() }
      setMessages(prev => [...prev, aiReply])
    } catch {
      const errorReply: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Network error. Please check your connection and try again.', timestamp: new Date() }
      setMessages(prev => [...prev, errorReply])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([messages[0]])
  }

  const quickPrompts = [
    'What is my revenue this month?',
    'How many customers do we have?',
    'Show inventory status',
    'Employee summary',
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <div className="flex items-center gap-2">
            <select value={provider} onChange={(e) => setProvider(e.target.value)}
              className="px-3 py-1.5 rounded-xl border text-xs font-medium">
              <option value="DEEPSEEK">DeepSeek</option>
              <option value="CLAUDE">Claude</option>
              <option value="OPENAI">OpenAI</option>
            </select>
            <button onClick={clearChat} className="p-2 rounded-xl hover:bg-neutral-100" title="Clear chat">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 max-w-4xl mx-auto w-full">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0 mr-2">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}
            <div className={`max-w-[75%] p-4 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-purple-600 text-white rounded-br-md' 
                : 'bg-white dark:bg-neutral-900 border rounded-bl-md'
            }`}>
              <div className={`text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'text-white' : ''}`}>
                {msg.content}
              </div>
              <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-purple-200' : 'text-muted-foreground'}`}>
                {msg.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center mr-2">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white dark:bg-neutral-900 border rounded-2xl rounded-bl-md p-4">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                <span className="text-sm text-muted-foreground">AI is thinking via {provider}...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="max-w-4xl mx-auto w-full px-4 mb-3 flex gap-2 overflow-x-auto">
        {quickPrompts.map(prompt => (
          <button key={prompt} onClick={() => setInput(prompt)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950 text-xs text-purple-600 font-medium hover:bg-purple-100">
            {prompt}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white dark:bg-neutral-900">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 px-4 py-3 rounded-xl border bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Ask about your ERP data..."
          />
          <button onClick={handleSend} disabled={loading || !input.trim()}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send
          </button>
        </div>
      </div>
    </div>
  )
}