'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Loader2, TrendingUp, Download, FileText, Calendar } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const PRESETS = [
  { key: '7', label: 'Last 7 Days' },
  { key: '30', label: 'Last 30 Days' },
  { key: '90', label: 'Last 90 Days' },
  { key: 'custom', label: 'Custom' },
]

export default function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10)
  const thirtyAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

  const [start, setStart] = useState(thirtyAgo)
  const [end, setEnd] = useState(today)
  const [preset, setPreset] = useState('30')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchReports = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/marketplace/seller/reports?start=${start}&end=${end}`)
      if (res.ok) setData(await res.json())
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchReports() }, [start, end])

  const applyPreset = (key: string) => {
    setPreset(key)
    if (key === 'custom') return
    const days = parseInt(key, 10)
    const s = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
    setStart(s)
    setEnd(today)
  }

  const downloadCsv = () => {
    if (!data?.daily || data.daily.length === 0) { alert('No data to export'); return }
    const lines = ['Date,Orders,Revenue,Units']
    for (const row of data.daily) {
      lines.push(`${row.day},${row.orders},${row.revenue},${row.units}`)
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-report-${start}-to-${end}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadPdf = () => {
    window.open(`/api/marketplace/seller/reports/pdf?start=${start}&end=${end}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/marketplace/seller/dashboard" className="flex items-center gap-2 font-bold">
              <ChevronLeft className="w-5 h-5" /> Back
            </Link>
            <span className="text-neutral-700">|</span>
            <span className="font-bold text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" /> Sales Reports
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={downloadCsv} disabled={!data} className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold flex items-center gap-1 disabled:opacity-50">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button onClick={downloadPdf} disabled={!data} className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-xs font-bold flex items-center gap-1 disabled:opacity-50">
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-6 space-y-4">
        {/* Date filter */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
          <div className="flex gap-1 flex-wrap">
            {PRESETS.map(p => (
              <button
                key={p.key}
                onClick={() => applyPreset(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${preset === p.key ? 'bg-cyan-500 text-white' : 'bg-neutral-800 text-neutral-400'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {preset === 'custom' && (
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="w-4 h-4 text-neutral-500" />
              <input
                type="date"
                value={start}
                onChange={e => setStart(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm"
              />
              <span className="text-neutral-500">to</span>
              <input
                type="date"
                value={end}
                onChange={e => setEnd(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm"
              />
            </div>
          )}
        </div>

        {loading || !data ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800">
                <p className="text-2xl font-bold">KES {Number(data.kpi.revenue).toLocaleString()}</p>
                <p className="text-xs opacity-80">Revenue</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800">
                <p className="text-2xl font-bold">{data.kpi.orders}</p>
                <p className="text-xs opacity-80">Orders</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-800">
                <p className="text-2xl font-bold">{data.kpi.units}</p>
                <p className="text-xs opacity-80">Units Sold</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-700">
                <p className="text-2xl font-bold">KES {Number(data.kpi.avgOrderItem).toLocaleString()}</p>
                <p className="text-xs opacity-80">Avg Item Value</p>
              </div>
            </div>

            {/* Chart */}
            <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
              <h2 className="text-lg font-bold mb-4">Daily Revenue</h2>
              {data.daily.length === 0 ? (
                <p className="text-center text-neutral-500 py-8 text-sm">No sales in this period</p>
              ) : (
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <LineChart data={data.daily}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="day" stroke="#71717a" fontSize={11} />
                      <YAxis stroke="#71717a" fontSize={11} />
                      <Tooltip
                        contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                        formatter={(v: any) => [`KES ${Number(v).toLocaleString()}`, 'Revenue']}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Daily table */}
            <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
              <h2 className="text-lg font-bold mb-4">Daily Breakdown</h2>
              {data.daily.length === 0 ? (
                <p className="text-center text-neutral-500 py-4 text-sm">No data</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase text-neutral-500 border-b border-neutral-800">
                        <th className="py-2">Date</th>
                        <th className="py-2 text-right">Orders</th>
                        <th className="py-2 text-right">Revenue</th>
                        <th className="py-2 text-right">Units</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.daily.map((row: any) => (
                        <tr key={row.day} className="border-b border-neutral-800/50">
                          <td className="py-2">{new Date(row.day).toLocaleDateString('en-KE')}</td>
                          <td className="py-2 text-right">{row.orders}</td>
                          <td className="py-2 text-right text-green-400 font-bold">KES {Number(row.revenue).toLocaleString()}</td>
                          <td className="py-2 text-right">{row.units}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Top products */}
            {data.topProducts.length > 0 && (
              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
                <h2 className="text-lg font-bold mb-4">Top Products</h2>
                <div className="space-y-2">
                  {data.topProducts.map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-neutral-950">
                      <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center justify-center flex-shrink-0">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{p.title}</p>
                        <p className="text-xs text-neutral-500">{p.unitsSold} sold</p>
                      </div>
                      <span className="font-bold text-sm text-green-400">KES {Number(p.revenue).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}