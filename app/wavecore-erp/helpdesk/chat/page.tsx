'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MessageSquare, Send, Users, Phone, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChatMessage {
  id: string
  sender: string
  content: string
  timestamp: string
  isAgent: boolean
}

export default function LiveChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'Support Agent', content: 'Hello! How can we help you today?', timestamp: new Date().toISOString(), isAgent: true },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'You',
      content: input,
      timestamp: new Date().toISOString(),
      isAgent: false,
    }
    setMessages([...messages, newMessage])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const agentReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'Support Agent',
        content: 'Thanks for your message! Our team will respond shortly.',
        timestamp: new Date().toISOString(),
        isAgent: true,
      }
      setMessages(prev => [...prev, agentReply])
      setIsTyping(false)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/helpdesk" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-green-600 font-medium">Agents Online</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full p-4 flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.isAgent ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[70%] p-4 rounded-2xl ${
                msg.isAgent 
                  ? 'bg-white dark:bg-neutral-900 border rounded-bl-md' 
                  : 'bg-pink-600 text-white rounded-br-md'
              }`}>
                <p className="text-sm font-medium mb-1">{msg.sender}</p>
                <p className={`text-sm ${msg.isAgent ? '' : 'text-white/90'}`}>{msg.content}</p>
                <p className={`text-[10px] mt-2 ${msg.isAgent ? 'text-muted-foreground' : 'text-white/60'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-neutral-900 border rounded-2xl rounded-bl-md p-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-pink-500 animate-spin" />
                  <span className="text-sm text-muted-foreground">Agent is typing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 px-4 py-3 rounded-xl border bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="Type your message..."
          />
          <Button onClick={handleSend} className="gap-2 bg-pink-600 hover:bg-pink-700">
            <Send className="w-4 h-4" /> Send
          </Button>
        </div>
      </main>
    </div>
  )
}