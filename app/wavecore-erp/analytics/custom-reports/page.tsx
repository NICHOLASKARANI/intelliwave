'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FileText, Plus, Download, Loader2, Trash2, Eye } from 'lucide-react'

interface Report {
  id: string
  name: string
  type: string
  createdAt: string
}

export default function CustomReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', type: 'Financial' })

  useEffect(() => {
    fetchReports()
  }, [period])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/wavecore/analytics/reports?period=${period}`)
      const data = await res.json()
      setReports(data.reports || [])
    } catch (error) {
      console.error('Failed to fetch reports')
    } finally {
      setLoading(false)
    }
  }

  const createReport = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await fetch('/api/wavecore/analytics/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      setFormData({ name: '', type: 'Financial' })
      setShowForm(false)
      fetchReports()
    } catch (error) {
      console.error('Failed to create report')
    }
  }

  const deleteReport = async (id: string) => {
    if (!confirm('Delete this report?')) return
    try {
      await fetch(`/api/wavecore/analytics/reports?id=${id}`, { method: 'DELETE' })
      fetchReports()
    } catch (error) {
      console.error('Failed to delete report')
    }
  }

  const downloadPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html><head><title>Custom Reports - ${period}</title>
      <style>body{font-family:Arial;padding:40px}h1{color:#333;border-bottom:3px solid #059669}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#059669;color:white;padding:12px;text-align:left}td{padding:10px;border-bottom:1px solid #ddd}</style>
      </head><body>
      <h1>Custom Reports - ${period.toUpperCase()}</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <table><thead><tr><th>Name</th><th>Type</th><th>Date</th></tr></thead><tbody>
      ${reports.map(r => `<tr><td>${r.name}</td><td>${r.type}</td><td>${new Date(r.createdAt).toLocaleDateString()}</td></tr>`).join('')}
      </tbody></table>
      <script>window.print()</script></body></html>
    `)
    printWindow.document.close()
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

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-violet-500" /> Custom Reports
          </h1>
          <div className="flex gap-2">
            <div className="flex rounded-xl border overflow-hidden">
              {['week', 'month', 'year'].map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-4 py-2 text-sm capitalize ${period === p ? 'bg-violet-600 text-white' : 'bg-white dark:bg-neutral-900'}`}>
                  {p}
                </button>
              ))}
            </div>
            <button onClick={downloadPDF} className="px-4 py-2 rounded-xl bg-blue-600 text-white flex items-center gap-2">
              <Download className="w-4 h-4" /> PDF
            </button>
            <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-xl bg-violet-600 text-white flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Report
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={createReport} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Report Name" required value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="px-4 py-2 rounded-xl border" />
              <select value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="px-4 py-2 rounded-xl border">
                <option>Financial</option><option>Inventory</option><option>Manufacturing</option><option>HR</option>
              </select>
            </div>
            <button type="submit" className="mt-4 px-6 py-2 rounded-xl bg-violet-600 text-white">Create Report</button>
          </form>
        )}

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No reports yet</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  <th className="text-left p-4 text-sm">Name</th>
                  <th className="text-left p-4 text-sm">Type</th>
                  <th className="text-left p-4 text-sm">Date</th>
                  <th className="text-left p-4 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(report => (
                  <tr key={report.id} className="border-t">
                    <td className="p-4 font-medium">{report.name}</td>
                    <td className="p-4"><span className="px-2 py-1 text-xs rounded-full bg-violet-50 text-violet-600">{report.type}</span></td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(report.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 flex gap-2">
                      <button className="text-blue-500"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => deleteReport(report.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}