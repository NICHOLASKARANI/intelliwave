'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Languages, Loader2, CheckCircle, History, Send, X, Copy, Trash2 } from 'lucide-react'

interface ArabicDetection {
  id: string
  detectedText: string
  translatedText: string
  isArabic: boolean
  dialect: string
  confidence: number
  translationSuccess: boolean
  timestamp: string
}

export default function ArabicDetectionPage() {
  const [inputText, setInputText] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState<ArabicDetection[]>([])
  const [latest, setLatest] = useState<ArabicDetection | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const analyzeText = async () => {
    if (!inputText.trim()) {
      setError('Please enter Arabic text')
      return
    }
    setAnalyzing(true)
    setError('')
    
    try {
      const res = await fetch('/api/wavecore/ai-language/arabic-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText })
      })
      const data = await res.json()
      
      if (data.success) {
        const newResult = {
          ...data.result,
          id: Date.now().toString(),
          timestamp: new Date().toISOString()
        }
        setLatest(newResult)
        setResults(prev => [newResult, ...prev].slice(0, 10))
        setInputText('')
      } else {
        setError(data.error || 'Detection failed')
      }
    } catch {
      setError('Network error. Try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  const deleteResult = (id: string) => {
    setResults(prev => prev.filter(r => r.id !== id))
    if (latest?.id === id) setLatest(null)
  }

  const deleteAll = () => {
    setResults([])
    setLatest(null)
  }

  const copyTranslation = () => {
    if (latest?.translatedText) {
      navigator.clipboard.writeText(latest.translatedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const sampleTexts = [
    'مرحبا بالعالم',
    'كيف حالك اليوم؟',
    'أنا أتعلم اللغة العربية',
    'هذا نظام ذكاء اصطناعي',
    'شكرا جزيلا لكم'
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Arabic Language Detection</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Languages className="w-6 h-6 text-green-500" /> Arabic Language Detection
        </h1>

        {/* Input Area */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or paste Arabic text here..."
            className="w-full px-4 py-3 rounded-xl border min-h-[120px]"
            dir="rtl"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                analyzeText()
              }
            }}
          />
          
          <div className="flex gap-3 mt-4">
            <button onClick={analyzeText} disabled={analyzing || !inputText.trim()}
              className="px-6 py-3 rounded-xl bg-green-600 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {analyzing ? 'Analyzing...' : 'Detect & Translate'}
            </button>
            {inputText && (
              <button onClick={() => setInputText('')} className="px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Quick samples:</p>
            <div className="flex flex-wrap gap-2">
              {sampleTexts.map((sample, i) => (
                <button key={i} onClick={() => setInputText(sample)}
                  className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-sm hover:bg-neutral-200">
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-600">{error}</div>}

        {/* Latest Result */}
        {latest && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" /> Detection Result
              </h2>
              <div className="flex gap-2">
                <button onClick={copyTranslation} className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                  {copied ? '✓ Copied' : <Copy className="w-4 h-4" />}
                </button>
                <button onClick={() => setLatest(null)} className="p-2 rounded-lg bg-red-50 text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                <p className="text-xs text-muted-foreground mb-2">Detected Arabic:</p>
                <p className="text-xl font-bold" dir="rtl">{latest.detectedText}</p>
              </div>
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                <p className="text-xs text-muted-foreground mb-2">English Translation:</p>
                <p className="text-xl">{latest.translatedText}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <span className={`px-3 py-1 rounded-full text-sm ${latest.isArabic ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {latest.isArabic ? '✓ Arabic Detected' : '✗ Not Arabic'}
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm">
                Dialect: {latest.dialect}
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-sm">
                Confidence: {(latest.confidence * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* History */}
        {results.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-purple-500" /> Recent Detections ({results.length})
              </h2>
              <button onClick={deleteAll} className="text-sm text-red-600 flex items-center gap-1">
                <Trash2 className="w-4 h-4" /> Clear All
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {results.map((det) => (
                <div key={det.id} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-bold" dir="rtl">{det.detectedText}</p>
                    <p className="text-sm text-muted-foreground">{det.translatedText}</p>
                  </div>
                  <button onClick={() => deleteResult(det.id)} className="text-red-500 ml-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}