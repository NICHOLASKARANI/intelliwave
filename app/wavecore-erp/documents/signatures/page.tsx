'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Pen, Plus, ArrowLeft, CheckCircle, FileText, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SignaturesPage() {
  const [signatures, setSignatures] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [docName, setDocName] = useState('')
  const [signerName, setSignerName] = useState('')
  const [signerEmail, setSignerEmail] = useState('')

  const handleAdd = () => {
    if (!docName || !signerName || !signerEmail) return
    setSignatures([{ id: Date.now().toString(), docName, signerName, signerEmail, status: 'PENDING', date: new Date().toISOString() }, ...signatures])
    setShowAdd(false); setDocName(''); setSignerName(''); setSignerEmail('')
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/documents" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <Link href="/wavecore-erp/documents" className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="w-4 h-4" /> Back</Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Pen className="w-6 h-6 text-emerald-500" /> E-Signatures</h1>
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-emerald-600"><Plus className="w-4 h-4" /> Request Signature</Button>
        </div>

        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <input type="text" value={docName} onChange={(e) => setDocName(e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Document name *" />
              <input type="text" value={signerName} onChange={(e) => setSignerName(e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Signer name *" />
              <input type="email" value={signerEmail} onChange={(e) => setSignerEmail(e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Signer email *" />
            </div>
            <Button onClick={handleAdd}>Send Request</Button>
          </div>
        )}

        {signatures.length > 0 ? (
          <div className="space-y-3">
            {signatures.map(s => (
              <div key={s.id} className="p-4 rounded-xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="font-medium">{s.docName}</p>
                    <p className="text-xs text-muted-foreground">{s.signerName} • {s.signerEmail}</p>
                  </div>
                </div>
                <span className="px-3 py-1 text-xs bg-amber-50 text-amber-600 rounded-full">{s.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No signature requests yet</p>
          </div>
        )}
      </main>
    </div>
  )
}