'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Percent, Plus, Trash2, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TaxRate {
  id: number
  name: string
  rate: number
  type: string
  active: boolean
}

export default function TaxesPage() {
  const [taxes, setTaxes] = useState<TaxRate[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({ name: '', rate: '', type: 'VAT', active: true })

  useEffect(() => {
    fetchTaxes()
  }, [])

  const fetchTaxes = async () => {
    try {
      const res = await fetch('/api/wavecore/taxes')
      const data = await res.json()
      setTaxes(data.taxes || [])
    } catch (err) {
      setError('Failed to load tax rates')
    } finally {
      setLoading(false)
    }
  }

  const addTax = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/taxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, rate: parseFloat(formData.rate) })
      })
      if (res.ok) {
        setFormData({ name: '', rate: '', type: 'VAT', active: true })
        setShowForm(false)
        fetchTaxes()
      }
    } catch (err) {
      setError('Failed to save tax rate')
    } finally {
      setSaving(false)
    }
  }

  const deleteTax = async (id: number) => {
    if (!confirm('Delete this tax rate?')) return
    try {
      await fetch(`/api/wavecore/taxes?id=${id}`, { method: 'DELETE' })
      fetchTaxes()
    } catch (err) {
      setError('Failed to delete tax rate')
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
          <span className="text-sm">Tax Settings</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Percent className="w-6 h-6 text-orange-500" /> Tax Rates ({taxes.length})
          </h1>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2 bg-orange-600 hover:bg-orange-700">
            <Plus className="w-4 h-4" /> Add Tax Rate
          </Button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}

        {showForm && (
          <form onSubmit={addTax} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Tax Name" required value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="px-4 py-2 rounded-xl border" />
              <input type="number" step="0.01" placeholder="Rate %" required value={formData.rate}
                onChange={(e) => setFormData({...formData, rate: e.target.value})}
                className="px-4 py-2 rounded-xl border" />
              <select value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="px-4 py-2 rounded-xl border">
                <option value="VAT">VAT</option>
                <option value="GST">GST</option>
                <option value="SALES">Sales Tax</option>
                <option value="EXCISE">Excise Duty</option>
              </select>
              <Button type="submit" disabled={saving} className="bg-orange-600">
                {saving ? 'Saving...' : 'Save Tax'}
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : taxes.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Percent className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No tax rates defined</p>
          </div>
        ) : (
          <div className="space-y-3">
            {taxes.map(tax => (
              <div key={tax.id} className="bg-white dark:bg-neutral-900 rounded-2xl border p-5 flex justify-between items-center">
                <div>
                  <p className="font-bold">{tax.name}</p>
                  <p className="text-sm text-muted-foreground">{tax.type} - {tax.rate}%</p>
                </div>
                <div className="flex items-center gap-3">
                  {tax.active && <CheckCircle className="w-4 h-4 text-green-500" />}
                  <button onClick={() => deleteTax(tax.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}