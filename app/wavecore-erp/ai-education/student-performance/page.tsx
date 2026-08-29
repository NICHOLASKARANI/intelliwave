'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { GraduationCap, Loader2, CheckCircle, AlertTriangle, History, Target, Book, Clock, Brain, TrendingUp, TrendingDown, BarChart3, Activity, Users, Star, Zap, Trash2, Copy } from 'lucide-react'

interface StudentPrediction {
  predictedScore: number
  riskScore: number
  riskLevel: string
  attendance: number
  studyHours: number
  engagementScore: number
  assignmentCompletion: number
  participationRate: number
  homeworkCompletion: number
  recommendations: string[]
  confidence: number
  timestamp: string
}

export default function StudentPerformancePage() {
  const [formData, setFormData] = useState({
    studyHours: 5,
    attendance: 70,
    engagementScore: 50,
    assignmentCompletion: 60,
    participationRate: 40,
    homeworkCompletion: 65,
    quizScores: [55, 60, 65],
    previousScores: [65, 70, 75]
  })
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState<StudentPrediction[]>([])
  const [latest, setLatest] = useState<StudentPrediction | null>(null)
  const [error, setError] = useState('')

  const analyzeStudent = async () => {
    setAnalyzing(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/ai-education/student-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.success) {
        setLatest(data.prediction)
        setResults(prev => [data.prediction, ...prev].slice(0, 10))
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

  const deleteAll = () => {
    setResults([])
    setLatest(null)
  }

  const inputClass = "w-full px-3 py-2 rounded-lg border text-sm"

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Student Performance</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-blue-500" /> Student Performance Prediction
        </h1>

        {/* Input Form */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Book className="w-5 h-5 text-blue-500" /> Student Data Input
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Study Hours/Week</label>
              <input type="number" value={formData.studyHours} onChange={(e) => setFormData({...formData, studyHours: Number(e.target.value)})} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Attendance %</label>
              <input type="number" value={formData.attendance} onChange={(e) => setFormData({...formData, attendance: Number(e.target.value)})} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Engagement %</label>
              <input type="number" value={formData.engagementScore} onChange={(e) => setFormData({...formData, engagementScore: Number(e.target.value)})} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Assignment %</label>
              <input type="number" value={formData.assignmentCompletion} onChange={(e) => setFormData({...formData, assignmentCompletion: Number(e.target.value)})} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Participation %</label>
              <input type="number" value={formData.participationRate} onChange={(e) => setFormData({...formData, participationRate: Number(e.target.value)})} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Homework %</label>
              <input type="number" value={formData.homeworkCompletion} onChange={(e) => setFormData({...formData, homeworkCompletion: Number(e.target.value)})} className={inputClass} />
            </div>
          </div>
          <button onClick={analyzeStudent} disabled={analyzing}
            className="mt-4 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-2 disabled:opacity-50">
            {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
            {analyzing ? 'Predicting...' : 'Predict Performance'}
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-600">{error}</div>}

        {/* Latest Prediction */}
        {latest && (
          <div className={`rounded-2xl border p-6 mb-6 ${latest.riskLevel === 'CRITICAL' ? 'bg-red-50 border-red-200' : latest.riskLevel === 'HIGH RISK' ? 'bg-orange-50 border-orange-200' : latest.riskLevel === 'MEDIUM RISK' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {latest.riskLevel === 'CRITICAL' || latest.riskLevel === 'HIGH RISK' ? (
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                )}
                <div>
                  <p className="font-bold text-xl">Predicted Score: {latest.predictedScore}%</p>
                  <p className="text-sm text-muted-foreground">Risk Level: {latest.riskLevel}</p>
                </div>
              </div>
              <button onClick={() => setLatest(null)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>

            {/* Score Gauge */}
            <div className="mt-4">
              <div className="w-full bg-neutral-200 rounded-full h-4">
                <div className={`h-4 rounded-full ${latest.predictedScore > 70 ? 'bg-green-600' : latest.predictedScore > 50 ? 'bg-yellow-500' : 'bg-red-600'}`}
                  style={{ width: `${latest.predictedScore}%` }} />
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-4 text-center">
              <MetricChip icon={Clock} label="Study" value={`${latest.studyHours}h`} />
              <MetricChip icon={Users} label="Attendance" value={`${latest.attendance}%`} />
              <MetricChip icon={Activity} label="Engagement" value={`${latest.engagementScore}%`} />
              <MetricChip icon={Book} label="Assignments" value={`${latest.assignmentCompletion}%`} />
              <MetricChip icon={Star} label="Participation" value={`${latest.participationRate}%`} />
              <MetricChip icon={Zap} label="Homework" value={`${latest.homeworkCompletion}%`} />
            </div>

            {/* Recommendations */}
            <div className="mt-4">
              <p className="font-bold mb-2">AI Recommendations:</p>
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
        {results.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-purple-500" /> Prediction History ({results.length})
              </h2>
              <button onClick={deleteAll} className="text-sm text-red-600 flex items-center gap-1">
                <Trash2 className="w-4 h-4" /> Clear All
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                  <div>
                    <span className="font-bold">{r.predictedScore}%</span>
                    <span className={`ml-2 text-sm ${r.riskLevel === 'LOW RISK' ? 'text-green-600' : 'text-red-600'}`}>{r.riskLevel}</span>
                  </div>
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

function MetricChip({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800">
      <Icon className="w-4 h-4 mx-auto mb-1 text-blue-500" />
      <p className="text-xs font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}