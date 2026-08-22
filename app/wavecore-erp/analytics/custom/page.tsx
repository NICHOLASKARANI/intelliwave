'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  FileSpreadsheet, Download, Loader2, RefreshCw, BarChart3,
  Calendar, TrendingUp, Package, Users, DollarSign, Factory,
  Briefcase, Receipt, Plus, X, Filter
} from 'lucide-react'

interface ReportTemplate {
  id: string
  name: string
  description: string
  icon: any
  metrics: string[]
}

export default function CustomReportsPage() {
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('MONTH')
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([])
  const [reportName, setReportName] = useState('')

  async function fetchStats() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/analytics?range=' + timeRange)
      if (res.ok) { const data = await res.json(); setStats(data.kpis || {}) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => {
    fetchStats()
  }, [timeRange])

  const formatKES = (a: number) => 'KSh ' + (a || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

  const availableMetrics = [
    { key: 'revenueMTD', label: 'Revenue', value: formatKES(stats.revenueMTD), icon: DollarSign },
    { key: 'outstandingReceivables', label: 'Receivables', value: formatKES(stats.outstandingReceivables), icon: Receipt },
    { key: 'totalPayments', label: 'Payments', value: formatKES(stats.totalPayments), icon: TrendingUp },
    { key: 'activeCustomers', label: 'Customers', value: stats.activeCustomers || 0, icon: Users },
    { key: 'inventoryItems', label: 'Products', value: stats.inventoryItems || 0, icon: Package },
    { key: 'employees', label: 'Employees', value: stats.employees || 0, icon: Briefcase },
    { key: 'invoiceCount', label: 'Invoices', value: stats.invoiceCount || 0, icon: FileSpreadsheet },
    { key: 'projects', label: 'Projects', value: stats.projects || 0, icon: Factory },
    { key: 'journalEntries', label: 'Journal Entries', value: stats.journalEntries || 0, icon: BarChart3 },
  ]

  const reportTemplates: ReportTemplate[] = [
    { id: 'financial', name: 'Financial Summary', description: 'Revenue, receivables, payables overview', icon: DollarSign, metrics: ['revenueMTD', 'outstandingReceivables', 'totalPayments'] },
    { id: 'operations', name: 'Operations Overview', description: 'Products, employees, projects metrics', icon: Factory, metrics: ['inventoryItems', 'employees', 'projects'] },
    { id: 'sales', name: 'Sales Performance', description: 'Revenue, customers, invoices', icon: TrendingUp, metrics: ['revenueMTD', 'activeCustomers', 'invoiceCount'] },
  ]

  const toggleMetric = (key: string) => {
    setSelectedMetrics(prev =>
      prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]
    )
  }

  const handleGenerateReport = () => {
    if (selectedMetrics.length === 0) {
      alert('Select at least one metric')
      return
    }

    const content = [
      'WaveCore ERP - Custom Report',
      '='.repeat(50),
      'Report Name: ' + (reportName || 'Untitled Report'),
      'Generated: ' + new Date().toLocaleString(),
      'Time Range: ' + timeRange,
      '='.repeat(50),
      '',
      ...selectedMetrics.map(key => {
        const metric = availableMetrics.find(m => m.key === key)
        return metric ? metric.label + ': ' + metric.value : ''
      }),
      '',
      '(c) 2026 IntelliWavve - All Rights Reserved'
    ].join('\n')

    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (reportName || 'custom-report').replace(/\s+/g, '-').toLowerCase() + '.pdf'
    a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/analytics" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Custom Reports</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-pink-600 via-rose-600 to-red-600 p-6 lg:p-8 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8" /> Custom Reports
              </h1>
              <p className="text-white/80 text-sm">Build your own reports from real-time data</p>
            </div>
            <button onClick={fetchStats} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {/* Time Range */}
        <div className="flex gap-2 mb-6">
          {['DAY', 'WEEK', 'MONTH', 'YEAR'].map(range => (
            <button key={range} onClick={() => setTimeRange(range)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                timeRange === range ? 'bg-pink-600 text-white shadow-lg scale-105' : 'bg-white dark:bg-neutral-900 text-neutral-500 border'
              }`}>
              {range}
            </button>
          ))}
        </div>

        {/* Report Name */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-6">
          <label className="text-xs font-medium mb-1 block">Report Name</label>
          <input type="text" value={reportName} onChange={(e) => setReportName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border" placeholder="e.g., Q3 Revenue Analysis" />
        </div>

        {/* Templates */}
        <h2 className="text-lg font-bold mb-4">Quick Templates</h2>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {reportTemplates.map(template => {
            const Icon = template.icon
            return (
              <button key={template.id} onClick={() => setSelectedMetrics(template.metrics)}
                className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border hover:border-pink-500 transition-all text-left">
                <Icon className="w-6 h-6 text-pink-500 mb-3" />
                <p className="font-bold text-sm">{template.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
              </button>
            )
          })}
        </div>

        {/* Available Metrics */}
        <h2 className="text-lg font-bold mb-4">Select Metrics ({selectedMetrics.length} selected)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {availableMetrics.map(metric => {
            const Icon = metric.icon
            const selected = selectedMetrics.includes(metric.key)
            return (
              <button key={metric.key} onClick={() => toggleMetric(metric.key)}
                className={`p-4 rounded-2xl border transition-all flex items-center gap-3 ${
                  selected ? 'border-pink-500 bg-pink-50 dark:bg-pink-950' : 'bg-white dark:bg-neutral-900'
                }`}>
                <Icon className={`w-5 h-5 ${selected ? 'text-pink-500' : 'text-neutral-400'}`} />
                <div className="text-left">
                  <p className="font-bold text-sm">{metric.label}</p>
                  <p className="text-xs text-muted-foreground">{metric.value}</p>
                </div>
                {selected && <X className="w-4 h-4 text-pink-500 ml-auto" />}
              </button>
            )
          })}
        </div>

        {/* Generate Button */}
        <button onClick={handleGenerateReport} disabled={selectedMetrics.length === 0}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2">
          <Download className="w-5 h-5" /> Generate PDF Report
        </button>
      </main>
    </div>
  )
}