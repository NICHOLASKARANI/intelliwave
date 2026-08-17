'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Users, Plus, Search, Trash2, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [formData, setFormData] = useState({
    employeeId: '', firstName: '', lastName: '', email: '', phone: '', department: '', position: '', salary: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function fetchEmployees() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/hr/employees')
      if (res.ok) { const data = await res.json(); setEmployees(data.employees || []) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchEmployees() }, [])

  const update = (field: string, value: string) => setFormData({ ...formData, [field]: value })

  const handleAdd = async () => {
    setError(''); setSuccess('')
    if (!formData.firstName || !formData.lastName || !formData.employeeId) {
      setError('Employee ID, First Name, and Last Name required'); return
    }
    try {
      const res = await fetch('/api/wavecore/hr/employees', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, salary: parseFloat(formData.salary) || 0 }),
      })
      const data = await res.json()
      if (res.ok) { setSuccess('Employee added!'); setShowAdd(false); setFormData({ employeeId: '', firstName: '', lastName: '', email: '', phone: '', department: '', position: '', salary: '' }); fetchEmployees() }
      else { setError(data.error || 'Failed') }
    } catch { setError('Network error') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this employee?')) return
    try { await fetch(`/api/wavecore/hr/employees/${id}`, { method: 'DELETE' }); fetchEmployees() } catch {}
  }

  const filtered = employees.filter(e =>
    e.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    e.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/hr" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Employees</span>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-blue-500" /> Employees</h1>
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-blue-600"><Plus className="w-4 h-4" /> Add Employee</Button>
        </div>

        {error && <div className="p-4 mb-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
        {success && <div className="p-4 mb-4 rounded-xl bg-green-50 text-green-600 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {success}</div>}

        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <h3 className="font-bold mb-4">Add Employee</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <input type="text" value={formData.employeeId} onChange={(e) => update('employeeId', e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Employee ID *" />
              <input type="text" value={formData.firstName} onChange={(e) => update('firstName', e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="First Name *" />
              <input type="text" value={formData.lastName} onChange={(e) => update('lastName', e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Last Name *" />
              <input type="text" value={formData.department} onChange={(e) => update('department', e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Department" />
              <input type="email" value={formData.email} onChange={(e) => update('email', e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Email" />
              <input type="text" value={formData.phone} onChange={(e) => update('phone', e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Phone" />
              <input type="text" value={formData.position} onChange={(e) => update('position', e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Position" />
              <input type="number" value={formData.salary} onChange={(e) => update('salary', e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Salary" />
            </div>
            <Button onClick={handleAdd} className="mt-4">Add Employee</Button>
          </div>
        )}

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl border text-sm w-full" placeholder="Search employees..." />
        </div>

        {loading ? <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></div> :
          filtered.length > 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                  <th className="text-left p-4">ID</th><th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Email</th><th className="text-left p-4">Department</th>
                  <th className="text-left p-4">Position</th><th className="text-right p-4">Salary</th>
                  <th className="text-center p-4">Actions</th>
                </tr></thead>
                <tbody>{filtered.map(e => (
                  <tr key={e.id} className="border-b hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <td className="p-4 font-mono">{e.employeeId}</td>
                    <td className="p-4 font-medium">{e.firstName} {e.lastName}</td>
                    <td className="p-4">{e.email || '-'}</td>
                    <td className="p-4">{e.department || '-'}</td>
                    <td className="p-4">{e.position || '-'}</td>
                    <td className="p-4 text-right">{e.salary?.toLocaleString()}</td>
                    <td className="p-4 text-center"><button onClick={() => handleDelete(e.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border"><Users className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No employees yet</p></div>
        }
      </main>
    </div>
  )
}