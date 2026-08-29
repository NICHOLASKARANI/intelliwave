'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, Camera, Mic, AlertTriangle, CheckCircle, Loader2, History, Brain, Activity, User, Scan, Trash2, Send } from 'lucide-react'

export default function LieDetectionPage() {
  const [textInput, setTextInput] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [latest, setLatest] = useState<any | null>(null)
  const [error, setError] = useState('')

  const analyzeText = async () => {
    if (!textInput.trim()) {
      setError('Please enter statement text to analyze')
      return
    }
    setAnalyzing(true)
    setError('')
    
    try {
      const res = await fetch('/api/wavecore/ai-security/lie-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textInput })
      })
      const data = await res.json()
      
      if (data.success) {
        setLatest(data.result)
        setResults(prev => [data.result, ...prev].slice(0, 10))
        setTextInput('')
      } else {
        setError(data.error || 'Analysis failed')
      }
    } catch {
      setError('Network error')
    } finally {
      setAnalyzing(false)
    }
  }

  const deleteResult = (index: number) => {
    setResults(prev => prev.filter((_, i) => i !== index))
  }

  const clearAll = () => {
    setResults([])
    setLatest(null)
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">AI Lie Detection</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-500" /> AI Lie Detection System
        </h1>

        {/* Text Input */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
          <label className="text-sm font-medium mb-2 block">Enter statement or confession to analyze:</label>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type the statement you want to analyze..."
            className="w-full px-4 py-3 rounded-xl border min-h-[100px] mb-3"
          />
          <button onClick={analyzeText} disabled={analyzing || !textInput.trim()}
            className="px-6 py-3 rounded-xl bg-purple-600 text-white font-bold flex items-center gap-2 disabled:opacity-50">
            {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
            {analyzing ? 'Analyzing with AI...' : 'Analyze Statement'}
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-600">{error}</div>}

        {/* Latest Result */}
        {latest && (
          <div className={`rounded-2xl border p-6 mb-6 ${latest.verdict === 'DECEPTION LIKELY' ? 'bg-red-50 border-red-200' : latest.verdict === 'TRUTHFUL' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {latest.verdict === 'DECEPTION LIKELY' ? (
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                ) : latest.verdict === 'TRUTHFUL' ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <Activity className="w-8 h-8 text-yellow-600" />
                )}
                <div>
                  <p className="font-bold text-xl">{latest.verdict}</p>
                  <p className="text-sm text-muted-foreground">Confidence: {(latest.confidence * 100).toFixed(1)}%</p>
                </div>
              </div>
              <button onClick={() => setLatest(null)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>

            {/* Probability Gauge */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-green-600">Truth: {(latest.truthProbability * 100).toFixed(0)}%</span>
                <span className="text-red-600">Deception: {(latest.deceptionProbability * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-4 flex">
                <div className="h-4 rounded-l-full bg-green-500" style={{ width: `${latest.truthProbability * 100}%` }} />
                <div className="h-4 rounded-r-full bg-red-500" style={{ width: `${latest.deceptionProbability * 100}%` }} />
              </div>
            </div>

            {/* AI Models Used */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={`px-2 py-1 rounded-lg text-xs ${latest.aiModelsUsed.sentiment ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                Sentiment Analysis {latest.aiModelsUsed.sentiment ? '✓' : '✗'}
              </span>
              <span className={`px-2 py-1 rounded-lg text-xs ${latest.aiModelsUsed.emotion ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                Emotion Detection {latest.aiModelsUsed.emotion ? '✓' : '✗'}
              </span>
              <span className={`px-2 py-1 rounded-lg text-xs ${latest.aiModelsUsed.voiceStress ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                Voice Stress {latest.aiModelsUsed.voiceStress ? '✓' : '✗'}
              </span>
              <span className={`px-2 py-1 rounded-lg text-xs ${latest.aiModelsUsed.microExpressions ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                Micro-expressions {latest.aiModelsUsed.microExpressions ? '✓' : '✗'}
              </span>
            </div>
          </div>
        )}

        {/* History */}
        {results.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-purple-500" /> Analysis History ({results.length})
              </h2>
              <button onClick={clearAll} className="text-sm text-red-600 flex items-center gap-1">
                <Trash2 className="w-4 h-4" /> Clear All
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                  <span className={r.verdict === 'DECEPTION LIKELY' ? 'text-red-600 font-bold' : r.verdict === 'TRUTHFUL' ? 'text-green-600' : 'text-yellow-600'}>
                    {r.verdict} - {(r.deceptionProbability * 100).toFixed(0)}% deception
                  </span>
                  <button onClick={() => deleteResult(i)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}