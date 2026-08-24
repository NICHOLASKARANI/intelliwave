'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Layers, Plus, Trash2, Edit3, Loader2 } from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editing, setEditing] = useState<Template | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('workflow-templates')
    if (saved) setTemplates(JSON.parse(saved))
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!loading) localStorage.setItem('workflow-templates', JSON.stringify(templates))
  }, [templates, loading])

  const addTemplate = () => {
    if (!name) return
    setTemplates(prev => [...prev, { id: Date.now().toString(), name, description: description || 'Custom template' }])
    setName('')
    setDescription('')
  }

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  const saveEdit = () => {
    if (!editing) return
    setTemplates(prev => prev.map(t => t.id === editing.id ? editing : t))
    setEditing(null)
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/automation" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Templates</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Layers className="w-6 h-6 text-green-500" /> Workflow Templates</h1>

        <div className="flex gap-2 mb-6">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl border" placeholder="Template name" />
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl border" placeholder="Description" />
          <button onClick={addTemplate} className="px-4 py-2.5 rounded-xl bg-green-600 text-white"><Plus className="w-4 h-4" /></button>
        </div>

        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : templates.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No templates yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map(t => (
              <div key={t.id} className="p-4 rounded-xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(t)} className="p-2 text-blue-500"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => deleteTemplate(t.id)} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Edit Template</h2>
            <input type="text" value={editing.name} onChange={(e) => setEditing({...editing, name: e.target.value})}
              className="w-full px-4 py-2.5 rounded-xl border mb-3" />
            <input type="text" value={editing.description} onChange={(e) => setEditing({...editing, description: e.target.value})}
              className="w-full px-4 py-2.5 rounded-xl border mb-4" />
            <div className="flex gap-2">
              <button onClick={saveEdit} className="flex-1 py-2.5 rounded-xl bg-green-600 text-white font-medium">Save</button>
              <button onClick={() => setEditing(null)} className="flex-1 py-2.5 rounded-xl border">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}