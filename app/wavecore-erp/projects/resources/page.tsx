'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Users, Download, Plus, Loader2, Trash2 } from 'lucide-react'

interface Resource {
  id: string
  name: string
  role: string
  allocation: number
  project: string
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [role, setRole] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('project-resources')
    if (saved) setResources(JSON.parse(saved))
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!loading) localStorage.setItem('project-resources', JSON.stringify(resources))
  }, [resources, loading])

  const addResource = () => {
    if (!name || !role) return
    setResources(prev => [...prev, { id: Date.now().toString(), name, role, allocation: Math.floor(Math.random() * 100), project: 'Active Project' }])
    setName('')
    setRole('')
  }

  const deleteResource = (id: string) => {
    setResources(prev => prev.filter(r => r.id !== id))
  }

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Resource Planning', '='.repeat(50), `Resources: ${resources.length}`, '', ...resources.map((r, i) => `${i+1}. ${r.name} - ${r.role} (${r.allocation}% allocated)`), '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'resources.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/projects" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Resources</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-amber-500" /> Resource Planning</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
        </div>

        <div className="flex gap-2 mb-6">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl border" placeholder="Resource name" />
          <input type="text" value={role} onChange={(e) => setRole(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl border" placeholder="Role" />
          <button onClick={addResource} className="px-4 py-2.5 rounded-xl bg-amber-600 text-white font-medium"><Plus className="w-4 h-4" /></button>
        </div>

        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            {resources.map(r => (
              <div key={r.id} className="flex justify-between items-center p-4 border-b">
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.role}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 rounded-full bg-neutral-200">
                    <div className="h-2 rounded-full bg-amber-500" style={{ width: `${r.allocation}%` }} />
                  </div>
                  <span className="text-xs font-bold">{r.allocation}%</span>
                  <button onClick={() => deleteResource(r.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            {resources.length === 0 && <p className="text-center py-8 text-muted-foreground">No resources allocated</p>}
          </div>
        )}
      </main>
    </div>
  )
}