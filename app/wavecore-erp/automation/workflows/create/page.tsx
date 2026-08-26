'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, ArrowLeft, Save, Workflow,
  Play, GitBranch, Zap, Mail, Bell, FileText,
  Calculator, Users, Package, Factory, Globe,
  Webhook, Layers, Clock, Plus, Trash2, MoveUp,
  MoveDown, Settings, AlertCircle
, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WorkflowStep {
  id: string
  type: string
  config: any
}

export default function CreateWorkflowPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger: 'manual',
    status: 'draft',
  })
  const [steps, setSteps] = useState<WorkflowStep[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addStep = () => {
    const newStep: WorkflowStep = {
      id: Date.now().toString(),
      type: 'notification',
      config: {},
    }
    setSteps([...steps, newStep])
  }

  const removeStep = (id: string) => {
    setSteps(steps.filter(step => step.id !== id))
  }

  const moveStep = (id: string, direction: 'up' | 'down') => {
    const index = steps.findIndex(step => step.id === id)
    if (direction === 'up' && index > 0) {
      const newSteps = [...steps]
      ;[newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]]
      setSteps(newSteps)
    } else if (direction === 'down' && index < steps.length - 1) {
      const newSteps = [...steps]
      ;[newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]]
      setSteps(newSteps)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/wavecore/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, steps }),
      })

      if (!res.ok) throw new Error('Failed to create workflow')
      
      router.push('/wavecore-erp/automation')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const actionTypes = [
    { value: 'notification', label: 'Send Notification', icon: Bell },
    { value: 'email', label: 'Send Email', icon: Mail },
    { value: 'create_record', label: 'Create Record', icon: Plus },
    { value: 'update_record', label: 'Update Record', icon: FileText },
    { value: 'webhook', label: 'Call Webhook', icon: Globe },
    { value: 'approval', label: 'Request Approval', icon: Users },
    { value: 'calculation', label: 'Calculation', icon: Calculator },
  ]

  const triggerTypes = [
    { value: 'manual', label: 'Manual Trigger', icon: Play },
    { value: 'schedule', label: 'Scheduled', icon: Clock },
    { value: 'webhook', label: 'Webhook', icon: Webhook },
    { value: 'email', label: 'Incoming Email', icon: Mail },
    { value: 'record_created', label: 'Record Created', icon: Plus },
    { value: 'record_updated', label: 'Record Updated', icon: FileText },
    { value: 'form_submit', label: 'Form Submitted', icon: FileText },
  ]

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
            <span className="text-sm font-medium">New Workflow</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="mb-8">
          <Link href="/wavecore-erp/automation" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-indigo-600 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Automation
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Create Workflow</h1>
          <p className="text-muted-foreground mt-1">Build an automated workflow with triggers and actions</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 mb-6 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-500" /> Workflow Details
            </h3>
            <div>
              <label className="block text-sm font-medium mb-2">Workflow Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Invoice Approval Flow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Describe what this workflow does..."
              />
            </div>
          </div>

          {/* Trigger */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" /> Trigger
            </h3>
            <p className="text-sm text-muted-foreground mb-4">What starts this workflow?</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {triggerTypes.map((trigger) => {
                const Icon = trigger.icon
                return (
                  <button
                    key={trigger.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, trigger: trigger.value })}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                      formData.trigger === trigger.value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                        : 'hover:border-indigo-200'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${formData.trigger === trigger.value ? 'text-indigo-500' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">{trigger.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Steps / Actions */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-green-500" /> Actions ({steps.length})
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={addStep}>
                <Plus className="w-4 h-4 mr-1" /> Add Step
              </Button>
            </div>

            {steps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No actions added yet</p>
                <p className="text-xs mt-1">Click "Add Step" to define what this workflow does</p>
              </div>
            ) : (
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-3 p-4 rounded-xl border bg-neutral-50 dark:bg-neutral-800">
                    <div className="flex flex-col gap-1">
                      <button type="button" onClick={() => moveStep(step.id, 'up')} className="p-1 rounded hover:bg-muted" disabled={index === 0}>
                        <MoveUp className="w-3 h-3" />
                      </button>
                      <span className="text-xs text-center font-bold text-muted-foreground">{index + 1}</span>
                      <button type="button" onClick={() => moveStep(step.id, 'down')} className="p-1 rounded hover:bg-muted" disabled={index === steps.length - 1}>
                        <MoveDown className="w-3 h-3" />
                      </button>
                    </div>
                    <select
                      value={step.type}
                      onChange={(e) => {
                        const newSteps = [...steps]
                        newSteps[index].type = e.target.value
                        setSteps(newSteps)
                      }}
                      className="flex-1 px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      {actionTypes.map((action) => (
                        <option key={action.value} value={action.value}>{action.label}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => removeStep(step.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Link href="/wavecore-erp/automation">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button type="submit" className="gap-2 bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
              <Save className="w-4 h-4" />
              {loading ? 'Creating...' : 'Create Workflow'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}