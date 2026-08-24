'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Hash, Save, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Numbering {
  id: number
  documenttype: string
  prefix: string
  nextnumber: number
}

export default function NumberingPage() {
  const [numbering, setNumbering] = useState<Numbering[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const docTypes = ['INVOICE', 'QUOTATION', 'PURCHASE_ORDER', 'SALES_ORDER', 'RECEIPT', 'PAYMENT']

  useEffect(() => {
    fetchNumbering()
  }, [])

  const fetchNumbering = async () => {
    try {
      const res = await fetch('/api/wavecore/numbering')
      const data = await res.json()
      setNumbering(data.numbering || [])
    } catch (err) {
      setError('Failed to load numbering settings')
    } finally {
      setLoading(false)
    }
  }

  const saveNumbering = async (docType: string, prefix: string, nextNumber: number) => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/numbering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documenttype: docType, prefix, nextnumber: nextNumber })
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        fetchNumbering()
      }
    } catch (err) {
      setError('Failed to save numbering')
    } finally {
      setSaving(false)
    }
  }

  const getNumbering = (docType: string) => {
    return numbering.find(n => n.documenttype === docType) || { prefix: '', nextnumber: 1 }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/settings" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Document Numbering</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Hash className="w-6 h-6 text-teal-500" /> Document Numbering
        </h1>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}
        {saved && <div className="mb-4 p-3 rounded-xl bg-green-50 text-green-600 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Saved!</div>}

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : (
          <div className="space-y-4">
            {docTypes.map(docType => {
              const num = getNumbering(docType)
              return (
                <div key={docType} className="bg-white dark:bg-neutral-900 rounded-2xl border p-5">
                  <p className="font-bold mb-3">{docType.replace('_', ' ')}</p>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Prefix (e.g. INV-)"
                      defaultValue={num.prefix}
                      onChange={(e) => {
                        const updated = numbering.map(n => 
                          n.documenttype === docType ? {...n, prefix: e.target.value} : n
                        )
                        setNumbering(updated)
                      }}
                      className="flex-1 px-4 py-2 rounded-xl border"
                    />
                    <input
                      type="number"
                      placeholder="Next Number"
                      defaultValue={num.nextnumber}
                      onChange={(e) => {
                        const updated = numbering.map(n => 
                          n.documenttype === docType ? {...n, nextnumber: parseInt(e.target.value) || 1} : n
                        )
                        setNumbering(updated)
                      }}
                      className="w-32 px-4 py-2 rounded-xl border"
                    />
                    <Button 
                      onClick={() => saveNumbering(docType, num.prefix, num.nextnumber)}
                      disabled={saving}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}