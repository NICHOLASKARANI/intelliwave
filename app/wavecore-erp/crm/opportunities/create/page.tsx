'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Save, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CreatePage() {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (!name) { setError('Name is required'); setLoading(false); return }
    router.back()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
        </div>
      </header>
      <main className="max-w-lg mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Create New</h1>
        {error && <div className="p-4 mb-6 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <div><label className="block text-sm font-medium mb-2">Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" required />
          </div>
          <Button type="submit" disabled={loading} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Save className="w-4 h-4" /> Submit
          </Button>
        </form>
      </main>
    </div>
  )
}