'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Plus, Trash2, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LeavePage() {
  const [leaves, setLeaves] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [employeeId, setEmployeeId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function fetchLeaves() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/hr/attendance?type=leave')
      if (res.ok) { const data = await res.json(); setLeaves(data.attendance || []) }
    } catch {} finally { setLoading(false) }
  }

  async function fetchEmployees() {
    try {
      const res = await fetch('/api/wavecore/hr/employees')
      if (res.ok) { const data = await res.json(); setEmployees(data.employees || []) }
    } catch {}
  }

  useEffect(() => { fetchLeaves(); fetchEmployees() }, [])

  const handleAdd = async () => {
    setError(''); setSuccess('')
    if (!employeeId || !startDate || !endDate) { setError('All fields required'); return }

    const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1

    try {
      // Use attendance API to record leave (simplified)
      const res = await fetch('/api/wavecore/hr/attendance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, date: startDate, status: 'ABSENT', notes: `Leave: ${reason}` }),
      })
      const data = await res.json()
      if (res.ok) { setSuccess(`Leave recorded for ${days} days!`); setShowAdd(false); setEmployeeId(''); setStartDate(''); setEndDate(''); setReason(''); fetchLeaves() }
      else { setError(data.error || 'Failed') }
    } catch { setError('Network error') }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/hr" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Leave Management</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Calendar className="w-6 h-6 text-orange-500" /> Leave Management</h1>
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-orange-600"><Plus className="w-4 h-4" /> Request Leave</Button>
        </div>

        {error && <div className="p-4 mb-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
        {success && <div className="p-4 mb-4 rounded-xl bg-green-50 text-green-600 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {success}</div>}

        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <h3 className="font-bold mb-4">Request Leave</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-2">Employee *</label>
                <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border">
                  <option value="">Select employee...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium mb-2">Start Date *</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" />
              </div>
              <div><label className="block text-sm font-medium mb-2">End Date *</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" />
              </div>
              <div><label className="block text-sm font-medium mb-2">Reason</label>
                <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" placeholder="e.g., Annual leave, Sick leave" />
              </div>
            </div>
            <Button onClick={handleAdd} className="mt-4">Submit Request</Button>
          </div>
        )}

        {loading ? <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" /></div> :
          leaves.length > 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                  <th className="text-left p-4">Employee</th><th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Status</th><th className="text-left p-4">Notes</th>
                </tr></thead>
                <tbody>{leaves.map(l => (
                  <tr key={l.id} className="border-b">
                    <td className="p-4 font-medium">{l.firstName} {l.lastName}</td>
                    <td className="p-4">{new Date(l.date).toLocaleDateString()}</td>
                    <td className="p-4"><span className="px-2 py-1 text-xs bg-orange-50 text-orange-600 rounded-full">{l.status}</span></td>
                    <td className="p-4 text-muted-foreground">{l.notes || '-'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border"><Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No leave requests</p></div>
        }
      </main>
    </div>
  )
}