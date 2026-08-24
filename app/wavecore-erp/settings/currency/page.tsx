'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Coins, Plus, Trash2, Loader2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Currency {
  id: number
  code: string
  name: string
  rate: number
  isdefault: boolean
}

export default function CurrencyPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({ code: '', name: '', rate: '', isdefault: false })

  useEffect(() => {
    fetchCurrencies()
  }, [])

  const fetchCurrencies = async () => {
    try {
      const res = await fetch('/api/wavecore/currency')
      const data = await res.json()
      setCurrencies(data.currencies || [])
    } catch (err) {
      setError('Failed to load currencies')
    } finally {
      setLoading(false)
    }
  }

  const addCurrency = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/wavecore/currency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, rate: parseFloat(formData.rate) })
      })
      if (res.ok) {
        setFormData({ code: '', name: '', rate: '', isdefault: false })
        setShowForm(false)
        fetchCurrencies()
      }
    } catch (err) {
      setError('Failed to save currency')
    } finally {
      setSaving(false)
    }
  }

  const deleteCurrency = async (id: number) => {
    if (!confirm('Delete this currency?')) return
    try {
      await fetch(`/api/wavecore/currency?id=${id}`, { method: 'DELETE' })
      fetchCurrencies()
    } catch (err) {
      setError('Failed to delete currency')
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
          <span className="text-sm">Currency Settings</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Coins className="w-6 h-6 text-amber-500" /> Currencies ({currencies.length})
          </h1>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2 bg-amber-600 hover:bg-amber-700">
            <Plus className="w-4 h-4" /> Add Currency
          </Button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}

        {showForm && (
          <form onSubmit={addCurrency} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Code (e.g. USD)" required value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                className="px-4 py-2 rounded-xl border" />
              <input type="text" placeholder="Name (e.g. US Dollar)" required value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="px-4 py-2 rounded-xl border" />
              <input type="number" step="0.0001" placeholder="Exchange Rate" required value={formData.rate}
                onChange={(e) => setFormData({...formData, rate: e.target.value})}
                className="px-4 py-2 rounded-xl border" />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.isdefault}
                  onChange={(e) => setFormData({...formData, isdefault: e.target.checked})}
                  className="w-4 h-4" />
                <span className="text-sm">Default Currency</span>
              </label>
            </div>
            <Button type="submit" disabled={saving} className="mt-4 bg-amber-600">
              {saving ? 'Saving...' : 'Save Currency'}
            </Button>
          </form>
        )}

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : currencies.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Coins className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No currencies defined</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currencies.map(currency => (
              <div key={currency.id} className="bg-white dark:bg-neutral-900 rounded-2xl border p-5 flex justify-between items-center">
                <div>
                  <p className="font-bold flex items-center gap-2">
                    {currency.code} 
                    {currency.isdefault && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                  </p>
                  <p className="text-sm text-muted-foreground">{currency.name} - Rate: {currency.rate}</p>
                </div>
                <button onClick={() => deleteCurrency(currency.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}