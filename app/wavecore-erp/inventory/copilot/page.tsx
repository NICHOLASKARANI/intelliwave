'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Loader2, Package, Warehouse, Search, Brain, Sparkles, Send,
  ArrowLeft, ArrowLeftRight, RefreshCw, Sliders, ClipboardList, Layers, Activity, LineChart,
  TrendingUp, AlertTriangle, CheckCircle2, XCircle, DollarSign
} from 'lucide-react'

export default function CopilotPage() {
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<{query: string, answer: string}[]>([])

  const askCopilot = async (q?: string) => {
    const question = q || query
    if (!question.trim()) return
    setLoading(true)
    setError('')
    setAnswer('')
    try {
      const res = await fetch('/api/wavecore/inventory/copilot?query=' + encodeURIComponent(question))
      const result = await res.json()
      setAnswer(result.answer || 'No answer')
      setSuggestions(result.suggestions || [])
      setData(result.data || [])
      setHistory(prev => [{ query: question, answer: result.answer }, ...prev].slice(0, 10))
    } catch (err) {
      setError('Failed to query AI Copilot')
    } finally {
      setLoading(false)
    }
  }

  const suggestedQuestions = [
    'Which products will stock out?',
    'Show dead stock',
    'What needs reordering?',
    'Show overstocked items',
    'What is expiring soon?',
    'Warehouse overview'
  ]

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="fixed left-0 top-0 h-full w-64 bg-neutral-900 border-r border-neutral-800 z-50">
        <div className="p-4 border-b border-neutral-800">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
        </div>
        <nav className="p-4 space-y-2">
          <Link href="/wavecore-erp/inventory" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <ArrowLeft className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="/wavecore-erp/inventory/products" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <Package className="w-5 h-5" /> Products
          </Link>
          <Link href="/wavecore-erp/inventory/warehouses" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <Warehouse className="w-5 h-5" /> Warehouses
          </Link>
          <Link href="/wavecore-erp/inventory/movements" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <ArrowLeftRight className="w-5 h-5" /> Movements
          </Link>
          <Link href="/wavecore-erp/inventory/adjustments" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <Sliders className="w-5 h-5" /> Adjustments
          </Link>
          <Link href="/wavecore-erp/inventory/counts" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <ClipboardList className="w-5 h-5" /> Counts
          </Link>
          <Link href="/wavecore-erp/inventory/ledger" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <Layers className="w-5 h-5" /> Ledger
          </Link>
          <Link href="/wavecore-erp/inventory/copilot" className="flex items-center gap-3 p-3 rounded-xl bg-indigo-600 text-white font-bold shadow-lg">
            <Brain className="w-5 h-5" /> AI Copilot
          </Link>
        </nav>
      </div>

      <div className="ml-64 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-500" /> AI Inventory Copilot
          </h1>
          <p className="text-sm text-neutral-400 mt-1">Ask questions about your inventory in natural language</p>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 mb-6 shadow-xl">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={query} 
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') askCopilot() }}
              placeholder="Ask: Which products will stock out next week?"
              className="flex-1 px-4 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button onClick={() => askCopilot()} disabled={loading}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg transition-colors disabled:opacity-50">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Ask
            </button>
          </div>

          <div className="flex gap-2 mt-4 flex-wrap">
            {suggestedQuestions.map((q, i) => (
              <button key={i} onClick={() => askCopilot(q)}
                className="text-xs px-3 py-1.5 rounded-full bg-indigo-900/50 text-indigo-300 hover:bg-indigo-800 transition-colors">
                {q}
              </button>
            ))}
          </div>
        </div>

        {answer && (
          <div className="bg-neutral-900 rounded-2xl border border-indigo-800 p-6 mb-6 shadow-xl">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" />
              <p className="text-white text-lg">{answer}</p>
            </div>
          </div>
        )}

        {data.length > 0 && (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl mb-6">
            <table className="w-full">
              <thead className="bg-neutral-800">
                <tr>
                  {Object.keys(data[0]).slice(0, 5).map(key => (
                    <th key={key} className="text-left p-4 text-neutral-400 text-sm capitalize">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 10).map((item: any, i: number) => (
                  <tr key={i} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                    {Object.values(item).slice(0, 5).map((val: any, j: number) => (
                      <td key={j} className="p-4 text-neutral-300">
                        {typeof val === 'number' ? val.toLocaleString() : String(val || 'N/A')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {history.length > 0 && (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 shadow-xl">
            <h2 className="font-bold text-white mb-4">Recent Queries</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {history.map((h, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-800">
                  <p className="text-indigo-300 font-bold text-sm">{h.query}</p>
                  <p className="text-neutral-400 text-sm mt-1">{h.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}