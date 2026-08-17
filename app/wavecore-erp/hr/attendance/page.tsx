'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { UserCheck, Plus, Search, Trash2, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [employeeId, setEmployeeId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [status, setStatus] = useState('PRESENT')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function fetchAttendance() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/hr/attendance')
      if (res.ok) { const data = await res.json(); setAttendance(data.attendance || []) }
    } catch {} finally { setLoading(false) }
  }

  async function fetchEmployees() {
    try {
      const res = await fetch('/api/wavecore/hr/employees')
      if (res.ok) { const data = await res.json(); setEmployees(data.employees || []) }
    } catch {}
  }

  useEffect(() => { fetchAttendance(); fetchEmployees() }, [])

  const handleAdd = async () => {
    setError(''); setSuccess('')
    if (!employeeId) { setError('Select employee'); return }
    try {
      const res = await fetch('/api/wavecore/hr/attendance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, date, status }),
      })
      const data = await res.json()
      if (res.ok) { setSuccess('Attendance recorded!'); setShowAdd(false); setEmployeeId(''); fetchAttendance() }
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
          <span className="text-sm">Attendance</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><UserCheck className="w-6 h-6 text-green-500" /> Attendance</h1>
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-green-600"><Plus className="w-4 h-4" /> Record Attendance</Button>
        </div>

        {error && <div className="p-4 mb-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
        {success && <div className="p-4 mb-4 rounded-xl bg-green-50 text-green-600 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {success}</div>}

        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <h3 className="font-bold mb-4">Record Attendance</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium mb-2">Employee *</label>
                <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border">
                  <option value="">Select employee...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium mb-2">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" />
              </div>
              <div><label className="block text-sm font-medium mb-2">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border">
                  <option value="PRESENT">Present</option><option value="ABSENT">Absent</option>
                  <option value="LATE">Late</option><option value="HALF_DAY">Half Day</option>
                  <option value="EXCUSED">Excused</option>
                </select>
              </div>
            </div>
            <Button onClick={handleAdd} className="mt-4">Record</Button>
          </div>
        )}

        {loading ? <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-green-500" /></div> :
          attendance.length > 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                  <th className="text-left p-4">Employee</th><th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Status</th>
                </tr></thead>
                <tbody>{attendance.map(a => (
                  <tr key={a.id} className="border-b">
                    <td className="p-4 font-medium">{a.firstName} {a.lastName}</td>
                    <td className="p-4">{new Date(a.date).toLocaleDateString()}</td>
                    <td className="p-4"><span className={`px-2 py-1 text-xs rounded-full ${a.status === 'PRESENT' ? 'bg-green-50 text-green-600' : a.status === 'ABSENT' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>{a.status}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border"><UserCheck className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No attendance records</p></div>
        }
      </main>
    </div>
  )
}