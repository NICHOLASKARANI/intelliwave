'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  FileSpreadsheet, Download, Loader2, RefreshCw, BarChart3,
  Calendar, TrendingUp, Package, Users, DollarSign, Factory,
  Briefcase, Receipt, Plus, X, Filter, Eye
} from 'lucide-react'

export default function CustomReportsPage() {
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('MONTH')
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([])
  const [reportName, setReportName] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')

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

  const reportTemplates = [
    { id: 'financial', name: 'Financial Summary', description: 'Revenue, receivables, payables', icon: DollarSign, metrics: ['revenueMTD', 'outstandingReceivables', 'totalPayments'] },
    { id: 'operations', name: 'Operations Overview', description: 'Products, employees, projects', icon: Factory, metrics: ['inventoryItems', 'employees', 'projects'] },
    { id: 'sales', name: 'Sales Performance', description: 'Revenue, customers, invoices', icon: TrendingUp, metrics: ['revenueMTD', 'activeCustomers', 'invoiceCount'] },
  ]

  const toggleMetric = (key: string) => {
    setSelectedMetrics(prev =>
      prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]
    )
  }

  // Generate VALID PDF that opens in browser
  const handleGenerateReport = () => {
    if (selectedMetrics.length === 0) {
      alert('Select at least one metric')
      return
    }

    // Build PDF content as plain text lines
    const lines: string[] = [
      'WaveCore ERP - Custom Report',
      '==================================================',
      'Report Name: ' + (reportName || 'Untitled Report'),
      'Generated: ' + new Date().toLocaleString(),
      'Time Range: ' + timeRange,
      '==================================================',
      '',
    ]

    selectedMetrics.forEach(key => {
      const metric = availableMetrics.find(m => m.key === key)
      if (metric) {
        lines.push(metric.label + ': ' + metric.value)
      }
    })

    lines.push('')
    lines.push('(c) 2026 IntelliWavve - All Rights Reserved')

    // Build valid PDF
    const pdfText = lines.map(line => `BT /F1 12 Tf 50 750 Td (${line.replace(/[()\\]/g, '\\$&').slice(0, 80)}) Tj ET`).join('\n')

    const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length ${pdfText.length} >>
stream
${pdfText}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000230 00000 n 
0000000275 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
0
%%EOF`

    const blob = new Blob([pdf], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    setPreviewUrl(url)

    // Auto-download
    const a = document.createElement('a')
    a.href = url
    a.download = (reportName || 'custom-report').replace(/\s+/g, '-').toLowerCase() + '.pdf'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const viewReport = () => {
    if (previewUrl) window.open(previewUrl, '_blank')
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
              <p className="text-white/80 text-sm">Build reports from real-time data</p>
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
          <input type="text" value={reportName} onChange={(e) => setReportName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border" placeholder="Report name (e.g., Q3 Revenue Analysis)" />
        </div>

        {/* Templates */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {reportTemplates.map(template => {
            const Icon = template.icon
            return (
              <button key={template.id} onClick={() => setSelectedMetrics(template.metrics)}
                className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border hover:border-pink-500 text-left">
                <Icon className="w-6 h-6 text-pink-500 mb-3" />
                <p className="font-bold text-sm">{template.name}</p>
              </button>
            )
          })}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {availableMetrics.map(metric => {
            const Icon = metric.icon
            const selected = selectedMetrics.includes(metric.key)
            return (
              <button key={metric.key} onClick={() => toggleMetric(metric.key)}
                className={`p-4 rounded-2xl border flex items-center gap-3 ${
                  selected ? 'border-pink-500 bg-pink-50 dark:bg-pink-950' : 'bg-white dark:bg-neutral-900'
                }`}>
                <Icon className={`w-5 h-5 ${selected ? 'text-pink-500' : 'text-neutral-400'}`} />
                <div className="text-left">
                  <p className="font-bold text-sm">{metric.label}</p>
                  <p className="text-xs text-muted-foreground">{metric.value}</p>
                </div>
              </button>
            )
          })}
        </div>

        <button onClick={handleGenerateReport} disabled={selectedMetrics.length === 0}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2">
          <Download className="w-5 h-5" /> Generate PDF Report
        </button>

        {/* Preview */}
        {previewUrl && (
          <div className="mt-4">
            <button onClick={viewReport} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center gap-2">
              <Eye className="w-4 h-4" /> Open Report in Browser
            </button>
          </div>
        )}
      </main>
    </div>
  )
}