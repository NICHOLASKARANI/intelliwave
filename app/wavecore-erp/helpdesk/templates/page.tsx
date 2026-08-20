'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FileText, Download, Plus, Trash2 } from 'lucide-react'

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [name, setName] = useState('')
  const [body, setBody] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('helpdesk-templates')
    if (saved) setTemplates(JSON.parse(saved))
    else setTemplates([
      { id: '1', name: 'Welcome Response', body: 'Thank you for contacting support. We will respond shortly.' },
      { id: '2', name: 'Resolution Confirmation', body: 'Your issue has been resolved. Please let us know if you need further assistance.' },
    ])
  }, [])

  useEffect(() => {
    localStorage.setItem('helpdesk-templates', JSON.stringify(templates))
  }, [templates])

  const addTemplate = () => {
    if (!name || !body) return
    setTemplates(prev => [...prev, { id: Date.now().toString(), name, body }])
    setName(''); setBody('')
  }

  const deleteTemplate = (id: string) => setTemplates(prev => prev.filter(t => t.id !== id))

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Response Templates', '='.repeat(50), `Templates: ${templates.length}`, '', ...templates.map(t => `${t.name}: ${t.body}`), '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'templates.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/helpdesk" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Templates</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6 text-teal-500" /> Response Templates</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
        </div>
        <div className="space-y-2 mb-6">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" placeholder="Template name" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} className="w-full px-4 py-2.5 rounded-xl border" placeholder="Response body" />
          <button onClick={addTemplate} className="w-full py-2.5 rounded-xl bg-teal-600 text-white font-medium"><Plus className="w-4 h-4 inline" /> Add Template</button>
        </div>
        <div className="space-y-2">
          {templates.map(t => (
            <div key={t.id} className="p-4 rounded-xl bg-white dark:bg-neutral-900 border flex justify-between items-center">
              <div><p className="font-medium">{t.name}</p><p className="text-xs text-muted-foreground">{t.body}</p></div>
              <button onClick={() => deleteTemplate(t.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}