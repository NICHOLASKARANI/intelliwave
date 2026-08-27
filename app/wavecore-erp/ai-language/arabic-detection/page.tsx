'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Languages, Upload, Camera, Loader2, CheckCircle, History, FileText, Globe, Search, Sparkles } from 'lucide-react'

interface ArabicDetection {
  id: string
  detectedText: string
  translatedText: string
  confidence: number
  dialect: string
  scriptType: string
  timestamp: string
}

export default function ArabicDetectionPage() {
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState<ArabicDetection[]>([])
  const [latest, setLatest] = useState<ArabicDetection | null>(null)
  const [inputText, setInputText] = useState('')

  const analyzeText = async () => {
    if (!inputText.trim()) return
    setAnalyzing(true)
    try {
      const res = await fetch('/api/wavecore/ai-language/arabic-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText })
      })
      const data = await res.json()
      if (data.success) {
        setLatest(data.result)
        setResults(prev => [data.result, ...prev].slice(0, 20))
      }
    } catch {} finally {
      setAnalyzing(false)
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

      <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Languages className="w-6 h-6 text-green-500" /> Arabic Language Detection & Text Recognition
        </h1>

        {/* Input */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter Arabic text or use samples below..."
            className="w-full px-4 py-3 rounded-xl border min-h-[100px] mb-4"
            dir="rtl"
          />
          <div className="flex gap-3 flex-wrap">
            <button onClick={analyzeText} disabled={analyzing || !inputText.trim()}
              className="px-6 py-3 rounded-xl bg-green-600 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              {analyzing ? 'Analyzing...' : 'Analyze Text'}
            </button>
          </div>
          
          {/* Sample texts */}
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Sample Arabic texts (click to analyze):</p>
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

        {/* Latest Result */}
        {latest && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="font-bold text-lg">Detection Result</p>
                <p className="text-sm text-muted-foreground">Confidence: {(latest.confidence * 100).toFixed(1)}%</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                <p className="text-xs text-muted-foreground mb-2">Detected Arabic Text:</p>
                <p className="text-xl font-bold" dir="rtl">{latest.detectedText}</p>
              </div>
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                <p className="text-xs text-muted-foreground mb-2">Translation:</p>
                <p className="text-xl">{latest.translatedText}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-sm">Dialect: {latest.dialect}</span>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm">Script: {latest.scriptType}</span>
            </div>
          </div>
        )}

        {/* History */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-500" /> Detection History
          </h2>
          {results.length === 0 ? (
            <p className="text-muted-foreground">No detections yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                  <span dir="rtl">{r.detectedText}</span>
                  <span className="text-sm text-muted-foreground">{r.translatedText}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}