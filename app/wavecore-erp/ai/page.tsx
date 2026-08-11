'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  LayoutDashboard, Send, Bot, Sparkles, Zap, Brain,
  Lightbulb, TrendingUp, FileText, Search, BarChart3,
  MessageSquare, Settings, Plus, Trash2, Copy, ThumbsUp,
  ThumbsDown, RefreshCw, StopCircle, Paperclip, Mic,
  ArrowRight, Clock, Star, Globe, Code2, Calculator,
  Users, Package, Factory, Briefcase, HeadphonesIcon,
  FolderKanban, Shield, ChevronDown, Loader2, User,
  Wand2, LineChart, PieChart, ListTodo, CalendarDays,
  DollarSign, AlertCircle, CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  type?: 'text' | 'chart' | 'table' | 'action'
}

const aiCapabilities = [
  { icon: Calculator, label: 'Financial Analysis', desc: 'Analyze financial data, generate reports', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950' },
  { icon: Users, label: 'Customer Insights', desc: 'Customer behavior, segmentation, predictions', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
  { icon: Package, label: 'Inventory Optimization', desc: 'Stock predictions, reorder suggestions', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
  { icon: Factory, label: 'Production Planning', desc: 'Optimize manufacturing schedules', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
  { icon: Briefcase, label: 'HR Analytics', desc: 'Employee performance, attrition risk', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950' },
  { icon: TrendingUp, label: 'Sales Forecasting', desc: 'Predict revenue, identify trends', color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950' },
  { icon: Search, label: 'Smart Search', desc: 'Natural language search across all data', color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-950' },
  { icon: FileText, label: 'Document Analysis', desc: 'Extract insights from documents', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950' },
]

const suggestedPrompts = [
  { text: 'Show me this month revenue summary', icon: DollarSign },
  { text: 'Which products are low in stock?', icon: Package },
  { text: 'Generate a sales pipeline report', icon: BarChart3 },
  { text: 'What are my top 5 customers?', icon: Users },
  { text: 'Predict next month cash flow', icon: TrendingUp },
  { text: 'Create a weekly team schedule', icon: CalendarDays },
  { text: 'Analyze employee attendance trends', icon: Briefcase },
  { text: 'Show me overdue invoices', icon: FileText },
]

const quickActions = [
  { label: 'Generate Report', icon: FileText, prompt: 'Generate a comprehensive business report for this month' },
  { label: 'Data Analysis', icon: BarChart3, prompt: 'Analyze sales data and identify top trends' },
  { label: 'Forecast', icon: TrendingUp, prompt: 'Create a revenue forecast for next quarter' },
  { label: 'Smart Search', icon: Search, prompt: 'Search across all modules for relevant information' },
]

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your WaveCore AI Copilot. I can help you with:\n\n📊 **Data Analysis** - Analyze any business data\n📈 **Forecasting** - Predict trends and outcomes\n🔍 **Smart Search** - Find anything across your ERP\n📝 **Report Generation** - Create instant reports\n💡 **Recommendations** - Get AI-powered suggestions\n\nJust ask me anything about your business!',
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedCapability, setSelectedCapability] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I understand you're asking about: "${input}".\n\nAs your AI Copilot, I can help you analyze this data, generate reports, and provide actionable insights. In the full version, I'll connect to your database and give you real-time answers.\n\n**Try asking:**\n- "Show me revenue trends"\n- "Which customers haven't paid?"\n- "Predict inventory needs for next month"\n- "Analyze employee performance"`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiMessage])
      setLoading(false)
    }, 1500)
  }

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt)
  }

  const handleQuickAction = (prompt: string) => {
    setInput(prompt)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-800 shadow-lg">
                <Image src="/images/Wavecore.jpeg" alt="WaveCore ERP" width={40} height={40} className="object-cover" priority />
              </div>
              <span className="font-bold text-xl text-neutral-900 dark:text-white">WaveCore</span>
              <span className="ml-2 px-2 py-0.5 text-[10px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-medium">ERP</span>
            </Link>
            <span className="text-neutral-300">/</span>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-medium">AI Copilot</span>
              <span className="px-2 py-0.5 text-[9px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-bold">BETA</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setMessages([messages[0]])}>
              <Trash2 className="w-4 h-4 mr-1" /> Clear Chat
            </Button>
            <Link href="/wavecore-erp" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className="w-72 bg-white dark:bg-neutral-900 border-r p-4 hidden lg:flex flex-col">
          <Link href="/wavecore-erp" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted mb-4">
            ← Back to Dashboard
          </Link>

          {/* New Chat Button */}
          <Button className="gap-2 mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white" onClick={() => setMessages([messages[0]])}>
            <Plus className="w-4 h-4" /> New Conversation
          </Button>

          {/* Quick Actions */}
          <div className="mb-6">
            <p className="px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Quick Actions</p>
            <div className="space-y-1">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <button key={action.label} onClick={() => handleQuickAction(action.prompt)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-neutral-700 dark:text-neutral-300 hover:bg-muted transition-colors text-left">
                    <Icon className="w-4 h-4 text-indigo-500" />
                    {action.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* AI Capabilities */}
          <div className="flex-1 overflow-y-auto">
            <p className="px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Capabilities</p>
            <div className="space-y-2">
              {aiCapabilities.map((cap) => {
                const Icon = cap.icon
                return (
                  <button key={cap.label} onClick={() => setSelectedCapability(cap.label)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all ${
                      selectedCapability === cap.label
                        ? 'bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800'
                        : 'hover:bg-muted'
                    }`}>
                    <div className={`w-8 h-8 rounded-lg ${cap.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${cap.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{cap.label}</p>
                      <p className="text-[10px] text-muted-foreground">{cap.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Usage Stats */}
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <div className="px-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Daily Queries</span>
                <span className="text-xs font-medium">0 / 100</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: '0%' }} />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                
                <div className={`max-w-[70%] ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-2xl rounded-br-md'
                    : 'bg-white dark:bg-neutral-900 border rounded-2xl rounded-bl-md'
                } px-5 py-4 shadow-sm`}>
                  <div className={`text-sm whitespace-pre-wrap ${message.role === 'user' ? 'text-white' : 'text-neutral-900 dark:text-white'}`}>
                    {message.content.split('\n').map((line, i) => {
                      // Handle bold text
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <p key={i} className="font-bold mb-1">{line.replace(/\*\*/g, '')}</p>
                      }
                      // Handle bullet points
                      if (line.startsWith('- ')) {
                        return <p key={i} className="flex items-start gap-2 ml-2 mb-1">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                          {line.replace('- ', '')}
                        </p>
                      }
                      return <p key={i} className="mb-1">{line}</p>
                    })}
                  </div>
                  
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                      <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Copy">
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Thumbs up">
                        <ThumbsUp className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Thumbs down">
                        <ThumbsDown className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="w-10 h-10 rounded-xl bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white dark:bg-neutral-900 border rounded-2xl rounded-bl-md px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                    <span className="text-sm text-muted-foreground">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts (when chat is empty) */}
          {messages.length <= 1 && (
            <div className="px-8 pb-4">
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestedPrompts.map((prompt) => {
                  const Icon = prompt.icon
                  return (
                    <button key={prompt.text} onClick={() => handleSuggestedPrompt(prompt.text)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full border bg-white dark:bg-neutral-900 hover:border-indigo-300 hover:shadow-sm transition-all text-sm">
                      <Icon className="w-4 h-4 text-indigo-500" />
                      {prompt.text}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 lg:p-6 border-t bg-white dark:bg-neutral-900">
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about your business... (e.g., 'Show me revenue trends', 'Analyze customer data')"
                  rows={2}
                  className="w-full pl-4 pr-32 py-4 rounded-2xl border bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm"
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  <button className="p-2 rounded-xl hover:bg-muted transition-colors" title="Attach file">
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button className="p-2 rounded-xl hover:bg-muted transition-colors" title="Voice input">
                    <Mic className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Send message"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-center text-[10px] text-muted-foreground mt-2">
                AI Copilot can make mistakes. Verify important information. Powered by WaveCore AI
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}