'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Send, Bot, Sparkles, Zap, Brain, Lightbulb, TrendingUp, FileText,
  Search, BarChart3, MessageSquare, Settings, Plus, Trash2, Copy,
  ThumbsUp, ThumbsDown, RefreshCw, StopCircle, Paperclip, Mic,
  ArrowRight, Clock, Star, Globe, Calculator, Users, Package, Factory,
  Briefcase, HeadphonesIcon, FolderKanban, Shield, Loader2, User,
  Wand2, LineChart, PieChart, ListTodo, CalendarDays, DollarSign,
  AlertCircle, CheckCircle, ChevronRight, Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'

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
      content: '👋 Hello! I\'m your WaveCore AI Copilot. I can help you with:\n\n📊 **Data Analysis** - Analyze any business data\n📈 **Forecasting** - Predict trends\n🔍 **Smart Search** - Find anything in your ERP\n📝 **Reports** - Generate instant reports\n💡 **Recommendations** - AI-powered insights\n\nAsk me anything about your business!',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
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

    setTimeout(() => {
      const aiReply: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateAIResponse(userMsg.content),
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiReply])
      setLoading(false)
    }, 1200)
  }

  function generateAIResponse(query: string): string {
    const lower = query.toLowerCase()
    if (lower.includes('revenue')) return '📊 **Revenue Analysis**\n\nYour revenue (MTD) is tracked in real-time.\n\n**Key Metrics:**\n- Revenue: Check Finance → Analytics\n- Growth: Tracked monthly\n- Top Products: Available in Inventory\n\nWould you like me to generate a detailed revenue report?'
    if (lower.includes('customer')) return '👥 **Customer Intelligence**\n\nYour customer database is managed in CRM.\n\n**Actions:**\n- View all customers\n- Analyze purchase patterns\n- Segment by type\n\nI can help you analyze customer data!'
    if (lower.includes('inventory')) return '📦 **Inventory Status**\n\nTrack stock levels in real-time.\n\n**Features:**\n- Low stock alerts\n- Stock value calculation\n- Movement tracking\n\nNeed a specific product analysis?'
    if (lower.includes('employee') || lower.includes('hr')) return '👔 **HR Analytics**\n\nManage your workforce efficiently.\n\n**Modules:**\n- Employee records\n- Attendance tracking\n- Payroll processing\n- Leave management\n\nWhat would you like to know?'
    if (lower.includes('report')) return '📝 **Report Generation**\n\nI can help you create:\n\n1. Financial reports\n2. Sales analytics\n3. Inventory reports\n4. HR summaries\n\nWhich report would you like?'
    if (lower.includes('forecast') || lower.includes('predict')) return '📈 **AI Forecasting**\n\nBased on your current data trends, I can predict:\n\n- Revenue projections\n- Inventory needs\n- Customer growth\n- Cash flow\n\nStart entering data to enable accurate forecasts!'
    return `🤖 **AI Copilot Response**\n\nYou asked: "${query}"\n\nI can help you with:\n\n📊 **Analytics** - Real-time business data\n📈 **Forecasts** - Future predictions\n🔍 **Search** - Find any record\n📝 **Reports** - Generate documents\n\nTry asking about revenue, customers, inventory, or employees!`
  }

  const quickPrompts = [
    { label: 'Revenue Report', icon: DollarSign, prompt: 'Show me revenue report' },
    { label: 'Customer Analysis', icon: Users, prompt: 'Analyze my customers' },
    { label: 'Inventory Check', icon: Package, prompt: 'Check inventory levels' },
    { label: 'Employee Summary', icon: Briefcase, prompt: 'Show employee summary' },
  ]

  const capabilities = [
    { icon: Calculator, label: 'Financial Analysis', desc: 'Real-time financial insights', color: 'text-emerald-500' },
    { icon: Users, label: 'Customer Intelligence', desc: 'Customer behavior analysis', color: 'text-blue-500' },
    { icon: Package, label: 'Inventory Optimization', desc: 'Stock level predictions', color: 'text-orange-500' },
    { icon: TrendingUp, label: 'Sales Forecasting', desc: 'Revenue predictions', color: 'text-purple-500' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-600 rounded-full font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI Copilot
            </span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`w-72 bg-white dark:bg-neutral-900 border-r min-h-[calc(100vh-64px)] p-4 hidden lg:block overflow-y-auto ${sidebarOpen ? '' : 'hidden'}`}>
          <Button variant="outline" className="w-full gap-2 mb-4" onClick={() => setMessages([messages[0]])}>
            <Plus className="w-4 h-4" /> New Chat
          </Button>

          <p className="text-xs font-semibold text-muted-foreground uppercase mb-3 px-2">Quick Prompts</p>
          <div className="space-y-1 mb-6">
            {quickPrompts.map(p => {
              const Icon = p.icon
              return (
                <button key={p.label} onClick={() => setInput(p.prompt)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left">
                  <Icon className="w-4 h-4 text-purple-500" /> {p.label}
                </button>
              )
            })}
          </div>

          <p className="text-xs font-semibold text-muted-foreground uppercase mb-3 px-2">Capabilities</p>
          <div className="space-y-2">
            {capabilities.map(cap => {
              const Icon = cap.icon
              return (
                <div key={cap.label} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${cap.color}`} />
                    <p className="text-sm font-medium">{cap.label}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{cap.desc}</p>
                </div>
              )
            })}
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
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
                    {msg.content.split('\n').map((line, i) => (
                      <p key={i} className={line.startsWith('**') ? 'font-bold mt-2' : 'mb-1'}>{line.replace(/\*\*/g, '')}</p>
                    ))}
                  </div>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t">
                      <button className="p-1 rounded hover:bg-neutral-100"><Copy className="w-3 h-3 text-muted-foreground" /></button>
                      <button className="p-1 rounded hover:bg-neutral-100"><ThumbsUp className="w-3 h-3 text-muted-foreground" /></button>
                      <button className="p-1 rounded hover:bg-neutral-100"><ThumbsDown className="w-3 h-3 text-muted-foreground" /></button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center mr-2"><Bot className="w-5 h-5 text-white" /></div>
                <div className="bg-white dark:bg-neutral-900 border rounded-2xl rounded-bl-md p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                    <span className="text-sm text-muted-foreground">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-white dark:bg-neutral-900">
            <div className="flex gap-3 max-w-3xl mx-auto">
              <button className="p-3 rounded-xl border hover:bg-neutral-50"><Paperclip className="w-5 h-5 text-muted-foreground" /></button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 px-4 py-3 rounded-xl border bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Ask me anything about your business..."
              />
              <Button onClick={handleSend} disabled={loading || !input.trim()} className="gap-2 bg-purple-600 hover:bg-purple-700">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}