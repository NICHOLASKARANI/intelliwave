'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Bot, Zap, Lightbulb, Users, Package, TrendingUp, ArrowRight, CheckCircle } from 'lucide-react'

export default function AIAssistantPage() {
  const [activeTask, setActiveTask] = useState('')

  const tasks = [
    { name: 'Analyze Sales', icon: TrendingUp, desc: 'Get insights on your sales performance', color: 'text-blue-500' },
    { name: 'Customer Insights', icon: Users, desc: 'Understand your customer base', color: 'text-green-500' },
    { name: 'Inventory Check', icon: Package, desc: 'Review stock levels', color: 'text-orange-500' },
    { name: 'Smart Recommendations', icon: Lightbulb, desc: 'AI-powered suggestions', color: 'text-purple-500' },
  ]

  const handleTask = (task: string) => {
    setActiveTask(task)
    setTimeout(() => setActiveTask(''), 3000)
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/ai" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">AI Assistant</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 p-8 mb-8 text-center">
          <Bot className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">AI Assistant</h1>
          <p className="text-white/80">Your intelligent business assistant</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {tasks.map(task => {
            const Icon = task.icon
            return (
              <button key={task.name} onClick={() => handleTask(task.name)}
                className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 text-left hover:border-purple-300 hover:shadow-lg transition-all">
                <Icon className={`w-6 h-6 ${task.color} mb-3`} />
                <p className="font-bold">{task.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{task.desc}</p>
                {activeTask === task.name && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Processing...</p>
                )}
              </button>
            )
          })}
        </div>
      </main>
    </div>
  )
}