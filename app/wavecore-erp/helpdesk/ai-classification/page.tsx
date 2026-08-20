'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Sparkles, Download, Zap, Bot } from 'lucide-react'

export default function AIClassificationPage() {
  const [input, setInput] = useState('')
  const [classification, setClassification] = useState<any>(null)

  const classify = () => {
    if (!input) return
    const lower = input.toLowerCase()
    let category = 'General'
    let priority = 'MEDIUM'
    let confidence = 85

    if (lower.includes('payment') || lower.includes('invoice') || lower.includes('billing')) { category = 'Billing'; priority = 'HIGH'; confidence = 95 }
    else if (lower.includes('crash') || lower.includes('error') || lower.includes('bug')) { category = 'Technical'; priority = 'URGENT'; confidence = 92 }
    else if (lower.includes('how') || lower.includes('help') || lower.includes('guide')) { category = 'Support'; priority = 'LOW'; confidence = 88 }
    else if (lower.includes('feature') || lower.includes('request')) { category = 'Feature Request'; priority = 'MEDIUM'; confidence = 90 }

    setClassification({ category, priority, confidence, suggestedAgent: priority === 'URGENT' ? 'Senior Engineer' : priority === 'HIGH' ? 'Technical Support' : 'General Support' })
  }

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - AI Classification', '='.repeat(50), `Input: ${input}`, `Category: ${classification?.category}`, `Priority: ${classification?.priority}`, `Confidence: ${classification?.confidence}%`, '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'ai-classification.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/helpdesk" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">AI Classification</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-purple-700 p-6 mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Bot className="w-7 h-7" /> AI Ticket Classification</h1>
          <p className="text-white/80 text-sm">Automatically categorize and prioritize tickets</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={4}
            className="w-full px-4 py-3 rounded-xl border mb-4" placeholder="Describe your issue..." />
          <button onClick={classify} className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" /> Classify with AI
          </button>
          {classification && (
            <div className="mt-6 p-4 rounded-xl bg-violet-50 dark:bg-violet-950">
              <p className="font-bold text-violet-700">{classification.category}</p>
              <p className="text-sm">Priority: {classification.priority}</p>
              <p className="text-sm">Confidence: {classification.confidence}%</p>
              <p className="text-sm">Suggested Agent: {classification.suggestedAgent}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}