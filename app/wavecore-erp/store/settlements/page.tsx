'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Phone, Download, Plus, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [supplierName, setSupplierName] = useState('')
  const [amount, setAmount] = useState('')

  const handleAdd = () => {
    if (!supplierName || !amount) return
    setSettlements([{
      id: Date.now().toString(),
      supplier: supplierName,
      amount: parseFloat(amount),
      date: new Date().toISOString().split('T')[0],
      status: 'PAID',
    }, ...settlements])
    setSupplierName(''); setAmount(''); setShowAdd(false)
  }

  const formatKES = (a: number) => 'KSh ' + a.toLocaleString('en-KE', { minimumFractionDigits: 2 })

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Settlements</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Phone className="w-6 h-6 text-pink-500" /> Settlements</h1>
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2"><Plus className="w-4 h-4" /> New Settlement</Button>
        </div>

        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><label className="block text-sm font-medium mb-2">Supplier Name</label>
                <input type="text" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" />
              </div>
              <div><label className="block text-sm font-medium mb-2">Amount (KSh)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" min="0" />
              </div>
            </div>
            <Button onClick={handleAdd} className="gap-2"><DollarSign className="w-4 h-4" /> Settle Payment</Button>
          </div>
        )}

        {settlements.length > 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            {settlements.map(s => (
              <div key={s.id} className="flex items-center justify-between p-4 border-b">
                <div>
                  <p className="font-medium">{s.supplier}</p>
                  <p className="text-xs text-muted-foreground">{s.date}</p>
                </div>
                <span className="font-bold text-green-600">{formatKES(s.amount)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Phone className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No settlements yet</p>
          </div>
        )}
      </main>
    </div>
  )
}