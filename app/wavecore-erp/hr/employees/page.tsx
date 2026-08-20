'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Users, Plus, Search, Download, Loader2, Edit3, Trash2, UserPlus } from 'lucide-react'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<any>(null)
  const [showEdit, setShowEdit] = useState(false)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/wavecore/hr/employees')
      if (res.ok) {
        const data = await res.json()
        setEmployees(data.employees || [])
      }
    } catch {} finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this employee?')) return
    try {
      await fetch(`/api/wavecore/hr/employees?id=${id}`, { method: 'DELETE' })
      fetchEmployees()
    } catch {}
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    try {
      await fetch('/api/wavecore/hr/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      })
      setShowEdit(false)
      fetchEmployees()
    } catch {}
  }

  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - Employees',
      '='.repeat(50),
      'Generated: ' + new Date().toLocaleString(),
      'Total: ' + filtered.length,
      '='.repeat(50),
      '',
      ...filtered.map((e: any, i) => 
        `Employee #${i+1}\n  Name: ${e.firstName} ${e.lastName}\n  ID: ${e.employeeId || 'N/A'}\n  Email: ${e.email || 'N/A'}\n  Department: ${e.department || 'N/A'}\n` + '-'.repeat(30)
      ),
      '',
      '© 2026 IntelliWavve'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'employees.pdf'; a.click()
  }

  const filtered = employees.filter((e: any) =>
    (e.firstName + ' ' + e.lastName).toLowerCase().includes(search.toLowerCase()) ||
    e.employeeId?.toLowerCase().includes(search.toLowerCase())
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
      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-blue-500" /> Employees ({filtered.length})</h1>
          <div className="flex gap-2">
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm"><UserPlus className="w-4 h-4" /> Add</button>
          </div>
        </div>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search employees..." />
        </div>
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                <th className="p-3 text-left">Employee</th><th className="p-3">ID</th><th className="p-3">Department</th><th className="p-3 text-center">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map((e: any) => (
                  <tr key={e.id} className="border-b hover:bg-neutral-50">
                    <td className="p-3 font-medium">{e.firstName} {e.lastName}</td>
                    <td className="p-3">{e.employeeId || '-'}</td>
                    <td className="p-3">{e.department || '-'}</td>
                    <td className="p-3"><div className="flex justify-center gap-2">
                      <button onClick={() => { setEditing(e); setShowEdit(true) }} className="p-1.5 text-blue-500"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(e.id)} className="p-1.5 text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div></td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No employees</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showEdit && editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Edit Employee</h2>
            <div className="space-y-3">
              <input type="text" value={editing.firstName} onChange={(e) => setEditing({...editing, firstName: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border" placeholder="First Name" />
              <input type="text" value={editing.lastName} onChange={(e) => setEditing({...editing, lastName: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border" placeholder="Last Name" />
              <input type="text" value={editing.email} onChange={(e) => setEditing({...editing, email: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border" placeholder="Email" />
              <input type="text" value={editing.department} onChange={(e) => setEditing({...editing, department: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border" placeholder="Department" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleSaveEdit} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium">Save</button>
              <button onClick={() => setShowEdit(false)} className="flex-1 py-2.5 rounded-xl border font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}