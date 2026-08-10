'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, ArrowLeft, Save, HeadphonesIcon,
  AlertCircle, Tag, AlignLeft, Paperclip, Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CreateTicketPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'MEDIUM',
    category: 'TECHNICAL',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/wavecore/helpdesk/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error('Failed to create ticket')
      
      const ticket = await res.json()
      router.push(`/wavecore-erp/helpdesk/tickets/${ticket.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-800 shadow-lg">
                <Image src="/images/Wavecore.jpeg" alt="WaveCore ERP" width={40} height={40} className="object-cover" priority />
              </div>
              <span className="font-bold text-xl text-neutral-900 dark:text-white">WaveCore</span>
              <span className="ml-2 px-2 py-0.5 text-[10px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-medium">ERP</span>
            </Link>
            <span className="text-neutral-300">/</span>
            <span className="text-sm font-medium">New Ticket</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <div className="mb-8">
          <Link href="/wavecore-erp/helpdesk" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-indigo-600 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Helpdesk
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Create Support Ticket</h1>
          <p className="text-muted-foreground mt-1">Submit a new support request</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 mb-6 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <HeadphonesIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Brief summary of your issue"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <AlignLeft className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <textarea
                  rows={6}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Describe your issue in detail..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <div className="relative">
                  <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="TECHNICAL">Technical Support</option>
                    <option value="BILLING">Billing</option>
                    <option value="FEATURE">Feature Request</option>
                    <option value="BUG">Bug Report</option>
                    <option value="ACCOUNT">Account</option>
                    <option value="GENERAL">General Inquiry</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Attachments</label>
              <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-indigo-300 transition-colors cursor-pointer">
                <Paperclip className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Drag and drop files here, or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">Max file size: 10MB</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link href="/wavecore-erp/helpdesk">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button type="submit" className="gap-2 bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
              <Send className="w-4 h-4" />
              {loading ? 'Submitting...' : 'Submit Ticket'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}