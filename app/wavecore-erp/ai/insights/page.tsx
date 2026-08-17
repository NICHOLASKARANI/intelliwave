'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Sparkles, TrendingUp, TrendingDown, DollarSign, Users, Package,
  AlertCircle, CheckCircle, Loader2, Download, RefreshCw, Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AIInsightsPage() {
  const [insights, setInsights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setInsights([
        { id: '1', title: 'Revenue Growth Detected', description: 'Revenue is trending upward. Consider expanding marketing efforts.', type: 'positive', icon: TrendingUp, value: '+12%' },
        { id: '2', title: 'Low Stock Alert', description: '3 products are below minimum stock levels and need reordering.', type: 'warning', icon: AlertCircle, value: '3 items' },
        { id: '3', title: 'Customer Acquisition', description: 'New customer signups increased this month.', type: 'positive', icon: Users, value: '+8%' },
        { id: '4', title: 'Expense Optimization', description: 'Operating expenses could be reduced by 5% through automation.', type: 'info', icon: Zap, value: '5%' },
      ])
      setLoading(false)
    }, 800)
  }, [])

  const handleExport = () => {
    const csv = 'Title,Description,Type,Value\n' + insights.map(i => `${i.title},${i.description},${i.type},${i.value}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'ai-insights.csv'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/ai" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">AI Insights</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-6 mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Sparkles className="w-7 h-7" /> AI Business Insights</h1>
          <p className="text-white/80 text-sm mt-1">AI-powered analysis of your business data</p>
        </div>

        <div className="flex justify-end mb-6">
          <Button variant="outline" onClick={handleExport}><Download className="w-4 h-4 mr-1" /> Export</Button>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-purple-500" /></div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {insights.map(insight => {
              const Icon = insight.icon
              return (
                <div key={insight.id} className={`p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg transition-all ${
                  insight.type === 'positive' ? 'border-l-4 border-l-green-500' :
                  insight.type === 'warning' ? 'border-l-4 border-l-amber-500' :
                  insight.type === 'negative' ? 'border-l-4 border-l-red-500' : ''
                }`}>
                  <div className="flex items-start gap-3">
                    <Icon className={`w-6 h-6 flex-shrink-0 ${
                      insight.type === 'positive' ? 'text-green-500' :
                      insight.type === 'warning' ? 'text-amber-500' :
                      insight.type === 'negative' ? 'text-red-500' : 'text-blue-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className="font-bold">{insight.title}</p>
                        <span className="text-sm font-bold text-purple-600">{insight.value}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}