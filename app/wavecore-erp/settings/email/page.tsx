'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Mail, Plus, Trash2, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmailTemplate {
  id: number
  name: string
  subject: string
  body: string
  active: boolean
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({ name: '', subject: '', body: '', active: true })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/wavecore/email-templates')
      const data = await res.json()
      setTemplates(data.templates || [])
    } catch (err) {
      setError('Failed to load email templates')
    } finally {
      setLoading(false)
    }
  }

  const addTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/wavecore/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setFormData({ name: '', subject: '', body: '', active: true })
        setShowForm(false)
        fetchTemplates()
      }
    } catch (err) {
      setError('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const deleteTemplate = async (id: number) => {
    if (!confirm('Delete this template?')) return
    try {
      await fetch(`/api/wavecore/email-templates?id=${id}`, { method: 'DELETE' })
      fetchTemplates()
    } catch (err) {
      setError('Failed to delete template')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/settings" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Email Templates</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="w-6 h-6 text-pink-500" /> Email Templates ({templates.length})
          </h1>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2 bg-pink-600 hover:bg-pink-700">
            <Plus className="w-4 h-4" /> New Template
          </Button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}

        {showForm && (
          <form onSubmit={addTemplate} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <div className="space-y-4">
              <input type="text" placeholder="Template Name" required value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border" />
              <input type="text" placeholder="Subject" required value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border" />
              <textarea placeholder="Email body..." value={formData.body}
                onChange={(e) => setFormData({...formData, body: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border min-h-[150px]" />
              <Button type="submit" disabled={saving} className="bg-pink-600">
                {saving ? 'Saving...' : 'Save Template'}
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No email templates</p>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map(template => (
              <div key={template.id} className="bg-white dark:bg-neutral-900 rounded-2xl border p-5 flex justify-between items-center">
                <div>
                  <p className="font-bold">{template.name}</p>
                  <p className="text-sm text-muted-foreground">{template.subject}</p>
                </div>
                <div className="flex items-center gap-3">
                  {template.active && <CheckCircle className="w-4 h-4 text-green-500" />}
                  <button onClick={() => deleteTemplate(template.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}