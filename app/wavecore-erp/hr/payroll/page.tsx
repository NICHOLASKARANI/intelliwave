'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { DollarSign, Plus, Loader2, Download, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PayrollPage() {
  const [periods, setPeriods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function fetchPeriods() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/hr/payroll')
      if (res.ok) { const data = await res.json(); setPeriods(data.payrollPeriods || []) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchPeriods() }, [])

  const handleAdd = async () => {
    setError(''); setSuccess('')
    if (!name) { setError('Payroll name required'); return }
    try {
      const res = await fetch('/api/wavecore/hr/payroll', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, startDate, endDate, paymentDate }),
      })
      const data = await res.json()
      if (res.ok) { setSuccess('Payroll period created! ' + data.employeesProcessed + ' employees processed'); setShowAdd(false); setName(''); fetchPeriods() }
      else { setError(data.error || 'Failed') }
    } catch { setError('Network error') }
  }

  const formatKES = (a: number) => 'KSh ' + (a || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/hr" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Payroll</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="w-6 h-6 text-purple-500" /> Payroll</h1>
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-purple-600"><Plus className="w-4 h-4" /> Run Payroll</Button>
        </div>

        {error && <div className="p-4 mb-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
        {success && <div className="p-4 mb-4 rounded-xl bg-green-50 text-green-600 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {success}</div>}

        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <h3 className="font-bold mb-4">Create Payroll Period</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-2">Period Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" placeholder="e.g., August 2026 Payroll" />
              </div>
              <div><label className="block text-sm font-medium mb-2">Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" />
              </div>
              <div><label className="block text-sm font-medium mb-2">End Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" />
              </div>
              <div><label className="block text-sm font-medium mb-2">Payment Date</label>
                <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" />
              </div>
            </div>
            <Button onClick={handleAdd} className="mt-4">Create & Process Payroll</Button>
          </div>
        )}

        {loading ? <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500" /></div> :
          periods.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {periods.map(p => (
                <div key={p.id} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                  <div className="flex justify-between items-start mb-3">
                    <div><p className="font-bold">{p.name}</p><p className="text-xs text-muted-foreground">{p.status}</p></div>
                    <DollarSign className="w-5 h-5 text-purple-500" />
                  </div>
                  <p className="text-xl font-bold">{formatKES(p.total_net_salary)}</p>
                  <p className="text-xs text-muted-foreground">{p.employee_count} employees</p>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border"><DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No payroll periods yet</p></div>
        }
      </main>
    </div>
  )
}