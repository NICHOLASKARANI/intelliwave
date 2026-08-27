'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Flag, AlertTriangle, CheckCircle, Loader2, History, Shield, Heart, MessageSquare, User, Brain, Zap } from 'lucide-react'

interface RedFlagAnalysis {
  id: string
  riskScore: number
  riskLevel: string
  redFlags: string[]
  greenFlags: string[]
  behaviourPatterns: string[]
  confidence: number
  recommendation: string
  timestamp: string
}

export default function RedFlagDetectorPage() {
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState<RedFlagAnalysis[]>([])
  const [latest, setLatest] = useState<RedFlagAnalysis | null>(null)
  const [profileText, setProfileText] = useState('')

  const analyzeBehaviour = async () => {
    setAnalyzing(true)
    try {
      const res = await fetch('/api/wavecore/ai-security/red-flag-detector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: profileText })
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

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Red Flag Detector</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Flag className="w-6 h-6 text-red-500" /> AI Red Flag Detector
        </h1>

        {/* Input */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
          <textarea
            value={profileText}
            onChange={(e) => setProfileText(e.target.value)}
            placeholder="Paste conversation, profile description, or behaviour notes..."
            className="w-full px-4 py-3 rounded-xl border min-h-[120px] mb-4"
          />
          <button onClick={analyzeBehaviour} disabled={analyzing}
            className="px-8 py-4 rounded-xl bg-red-600 text-white font-bold text-lg flex items-center gap-2 mx-auto disabled:opacity-50">
            {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
            {analyzing ? 'Analyzing...' : 'Analyze Behaviour'}
          </button>
        </div>

        {/* Latest Result */}
        {latest && (
          <div className={`rounded-2xl border p-6 mb-6 ${latest.riskLevel === 'HIGH RISK' ? 'bg-red-50 border-red-200' : latest.riskLevel === 'MEDIUM RISK' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-3">
              {latest.riskLevel === 'HIGH RISK' ? (
                <AlertTriangle className="w-8 h-8 text-red-600" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-600" />
              )}
              <div>
                <p className="font-bold text-lg">{latest.riskLevel}</p>
                <p className="text-sm text-muted-foreground">Risk Score: {latest.riskScore}/100</p>
              </div>
            </div>

            {/* Risk Gauge */}
            <div className="mt-4">
              <div className="w-full bg-neutral-200 rounded-full h-4">
                <div 
                  className={`h-4 rounded-full ${latest.riskScore > 70 ? 'bg-red-600' : latest.riskScore > 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${latest.riskScore}%` }}
                />
              </div>
            </div>

            {/* Red Flags */}
            {latest.redFlags.length > 0 && (
              <div className="mt-4">
                <p className="font-bold text-red-600 mb-2">🚩 Red Flags:</p>
                <div className="space-y-2">
                  {latest.redFlags.map((flag, i) => (
                    <div key={i} className="p-2 rounded-lg bg-red-100 text-red-700 text-sm flex items-center gap-2">
                      <Flag className="w-4 h-4" /> {flag}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Green Flags */}
            {latest.greenFlags.length > 0 && (
              <div className="mt-4">
                <p className="font-bold text-green-600 mb-2">✅ Green Flags:</p>
                <div className="space-y-2">
                  {latest.greenFlags.map((flag, i) => (
                    <div key={i} className="p-2 rounded-lg bg-green-100 text-green-700 text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> {flag}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendation */}
            <div className="mt-4 p-3 rounded-xl bg-blue-50 text-blue-700 text-sm">
              <span className="font-bold">Recommendation: </span>{latest.recommendation}
            </div>
          </div>
        )}

        {/* History */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-500" /> Analysis History
          </h2>
          {results.length === 0 ? (
            <p className="text-muted-foreground">No analyses yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                  <span className={r.riskLevel === 'HIGH RISK' ? 'text-red-600 font-bold' : 'text-green-600'}>
                    {r.riskLevel} - {r.riskScore}/100
                  </span>
                  <span className="text-sm text-muted-foreground">{new Date(r.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}