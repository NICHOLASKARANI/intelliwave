'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Languages, Loader2, CheckCircle, History, Send, X, Copy, Trash2, Sparkles, Info } from 'lucide-react'
import { authedFetch } from '@/lib/wavecore/csrf-client'

interface DetectionResult {
  id: string
  detectedText: string
  translatedText: string
  isArabic: boolean
  language: string
  languageName: string
  dialect: string
  confidence: number
  translationSuccess: boolean
  timestamp: string
}

const LANGUAGES: Array<{ code: string; name: string; rtl: boolean; sample: string }> = [
  { code: 'ar', name: 'Arabic (Modern Standard)', rtl: true, sample: 'مرحبا بالعالم' },
  { code: 'so', name: 'Somali', rtl: false, sample: 'Salaan adduunka' },
  { code: 'om', name: 'Oromo', rtl: false, sample: 'Akkam addunyaa' },
  { code: 'am', name: 'Amharic', rtl: false, sample: 'ሰላም ለዓለም' },
  { code: 'sw', name: 'Swahili', rtl: false, sample: 'Habari dunia' },
]

export default function WavveAIPage() {
  const [inputText, setInputText] = useState('')
  const [language, setLanguage] = useState('ar')
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState<DetectionResult[]>([])
  const [latest, setLatest] = useState<DetectionResult | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0]

  const analyzeText = async () => {
    if (!inputText.trim()) {
      setError('Please enter text to translate')
      return
    }
    setAnalyzing(true)
    setError('')

    try {
      const res = await authedFetch('/api/wavecore/ai-language/arabic-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, language }),
      })
      const data = await res.json()

      if (data.success) {
        const newResult = {
          ...data.result,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
        }
        setLatest(newResult)
        setResults(prev => [newResult, ...prev].slice(0, 10))
        setInputText('')
      } else {
        setError(data.error || 'Translation failed')
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

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Wavve AI</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-500" /> Wavve AI — Language Detection & Translation
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Detect and translate African and world languages to English in real time.
        </p>

        {/* Input Area */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
          <label className="block text-sm font-bold mb-2">Source Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border bg-background mb-4"
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>

          <label className="block text-sm font-bold mb-2">Text</label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Type or paste ${currentLang.name} text here...`}
            className="w-full px-4 py-3 rounded-xl border min-h-[120px]"
            dir={currentLang.rtl ? 'rtl' : 'ltr'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                analyzeText()
              }
            }}
          />

          <div className="flex gap-3 mt-4">
            <button
              onClick={analyzeText}
              disabled={analyzing || !inputText.trim()}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-2 disabled:opacity-50"
            >
              {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {analyzing ? 'Translating...' : 'Detect & Translate'}
            </button>
            {inputText && (
              <button onClick={() => setInputText('')} className="px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Try a sample:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setInputText(currentLang.sample)}
                className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-sm hover:bg-neutral-200"
              >
                {currentLang.sample}
              </button>
            </div>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-600">{error}</div>}

        {/* Latest Result */}
        {latest && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" /> Result
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
                <p className="text-xs text-muted-foreground mb-2">Original ({latest.languageName}):</p>
                <p className="text-xl font-bold" dir={currentLang.rtl ? 'rtl' : 'ltr'}>{latest.detectedText}</p>
              </div>
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                <p className="text-xs text-muted-foreground mb-2">English Translation:</p>
                <p className="text-xl">{latest.translatedText}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <span className="px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-600">
                {latest.languageName}
              </span>
              {latest.isArabic && latest.dialect !== '—' && (
                <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-sm">
                  Dialect: {latest.dialect}
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-sm ${latest.translationSuccess ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {latest.translationSuccess ? '✓ Translated' : '⚠ Translation unavailable'}
              </span>
              <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-600 text-sm">
                Confidence: {(latest.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        )}

        {/* History */}
        {results.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-purple-500" /> Recent ({results.length})
              </h2>
              <button onClick={deleteAll} className="text-sm text-red-600 flex items-center gap-1">
                <Trash2 className="w-4 h-4" /> Clear All
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {results.map((det) => (
                <div key={det.id} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">{det.languageName}</p>
                    <p className="text-sm font-bold">{det.detectedText}</p>
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

        {/* Roadmap — honest note about expanding African language support */}
        <div className="rounded-2xl border bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 p-5 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-200">
            <p className="font-bold mb-1">Expanding African Language Support</p>
            <p className="text-blue-800 dark:text-blue-300">
              Wavve AI currently supports Arabic, Somali, Oromo, Amharic, and Swahili. Additional Kenyan mother tongues — including Kikuyu, Luo, Kamba, Kalenjin, Borana, and others — require dedicated language data and models which we are actively building. Once ready, they will be added here without any change to how you use the tool.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}