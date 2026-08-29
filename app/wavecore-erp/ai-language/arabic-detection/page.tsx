'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Languages, Loader2, CheckCircle, History, FileText, Globe, Search, Sparkles, Mic, Send, X, Copy } from 'lucide-react'

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
  const [history, setHistory] = useState<ArabicDetection[]>([])

  // Load history on mount
  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/wavecore/ai-language/arabic-detection')
      const data = await res.json()
      setHistory(data.detections || [])
    } catch {}
  }

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
        setLatest(data.result)
        setResults(prev => [data.result, ...prev].slice(0, 10))
        fetchHistory()
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
    'شكرا جزيلا لكم',
    'السوق التجاري',
    'التكنولوجيا الحديثة',
    'الذكاء الاصطناعي'
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
          <div className="flex gap-3">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type or paste Arabic text here..."
              className="flex-1 px-4 py-3 rounded-xl border min-h-[120px]"
              dir="rtl"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  analyzeText()
                }
              }}
            />
          </div>
          
          <div className="flex gap-3 mt-4">
            <button onClick={analyzeText} disabled={analyzing || !inputText.trim()}
              className="px-6 py-3 rounded-xl bg-green-600 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {analyzing ? 'Analyzing...' : 'Detect & Translate'}
            </button>
            {inputText && (
              <button onClick={() => setInputText('')}
                className="px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Sample Texts */}
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

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-600">{error}</div>
        )}

        {/* Latest Result */}
        {latest && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" /> Detection Result
              </h2>
              <div className="flex gap-2">
                <button onClick={copyTranslation}
                  className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200">
                  {copied ? '✓ Copied' : <Copy className="w-4 h-4" />}
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
              {latest.translationSuccess ? (
                <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-sm">
                  ✓ Real Translation
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-yellow-50 text-yellow-600 text-sm">
                  ⚠ Translation unavailable
                </span>
              )}
            </div>
          </div>
        )}

        {/* History */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-500" /> Recent Detections ({history.length})
          </h2>
          {history.length === 0 ? (
            <p className="text-muted-foreground">No detections yet</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {history.map((det, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-bold" dir="rtl">{det.detectedText}</p>
                      <p className="text-sm text-muted-foreground">{det.translatedText}</p>
                    </div>
                    <span className={`text-xs ml-2 ${det.isArabic ? 'text-green-600' : 'text-red-600'}`}>
                      {det.isArabic ? '✓ AR' : '✗'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}