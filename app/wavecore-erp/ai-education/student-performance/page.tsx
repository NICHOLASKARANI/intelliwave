'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { GraduationCap, TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle, History, Target, Book, Clock, Brain } from 'lucide-react'

interface StudentPrediction {
  id: string
  studentId: string
  predictedScore: number
  engagementLevel: number
  attendance: number
  studyHours: number
  riskLevel: string
  confidence: number
  recommendations: string[]
  timestamp: string
}

export default function StudentPerformancePage() {
  const [analyzing, setAnalyzing] = useState(false)
  const [predictions, setPredictions] = useState<StudentPrediction[]>([])
  const [latest, setLatest] = useState<StudentPrediction | null>(null)
  const [studentName, setStudentName] = useState('')

  const analyzeStudent = async () => {
    setAnalyzing(true)
    try {
      const res = await fetch('/api/wavecore/ai-education/student-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName })
      })
      const data = await res.json()
      if (data.success) {
        setLatest(data.prediction)
        setPredictions(prev => [data.prediction, ...prev].slice(0, 20))
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
          <span className="text-sm">Student Performance Prediction</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-blue-500" /> Student Performance Prediction
        </h1>

        {/* Input */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
          <div className="flex gap-3">
            <input 
              type="text" 
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter student name or ID"
              className="flex-1 px-4 py-3 rounded-xl border"
            />
            <button onClick={analyzeStudent} disabled={analyzing}
              className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              {analyzing ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>

        {/* Latest Prediction */}
        {latest && (
          <div className={`rounded-2xl border p-6 mb-6 ${latest.riskLevel === 'HIGH RISK' ? 'bg-red-50 border-red-200' : latest.riskLevel === 'MEDIUM RISK' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-3">
              {latest.riskLevel === 'HIGH RISK' ? (
                <AlertTriangle className="w-8 h-8 text-red-600" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-600" />
              )}
              <div>
                <p className="font-bold text-lg">Student: {latest.studentId}</p>
                <p className="text-sm text-muted-foreground">Predicted Score: {latest.predictedScore}%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-center">
              <div>
                <Activity className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                <p className="text-lg font-bold">{latest.engagementLevel}%</p>
                <p className="text-xs text-muted-foreground">Engagement</p>
              </div>
              <div>
                <Clock className="w-5 h-5 mx-auto mb-2 text-purple-500" />
                <p className="text-lg font-bold">{latest.attendance}%</p>
                <p className="text-xs text-muted-foreground">Attendance</p>
              </div>
              <div>
                <Book className="w-5 h-5 mx-auto mb-2 text-green-500" />
                <p className="text-lg font-bold">{latest.studyHours}h/wk</p>
                <p className="text-xs text-muted-foreground">Study Hours</p>
              </div>
              <div>
                <Brain className="w-5 h-5 mx-auto mb-2 text-orange-500" />
                <p className="text-lg font-bold">{latest.riskLevel}</p>
                <p className="text-xs text-muted-foreground">Risk Level</p>
              </div>
            </div>

            {/* Recommendations */}
            <div className="mt-4">
              <p className="font-bold mb-2">Recommendations:</p>
              <div className="space-y-2">
                {latest.recommendations.map((rec, i) => (
                  <div key={i} className="p-2 rounded-lg bg-blue-50 text-blue-700 text-sm flex items-center gap-2">
                    <Target className="w-4 h-4" /> {rec}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* History */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-500" /> Analysis History
          </h2>
          {predictions.length === 0 ? (
            <p className="text-muted-foreground">No analyses yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {predictions.map((p, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                  <span>{p.studentId} - {p.predictedScore}%</span>
                  <span className={`text-sm font-bold ${p.riskLevel === 'HIGH RISK' ? 'text-red-600' : 'text-green-600'}`}>
                    {p.riskLevel}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}