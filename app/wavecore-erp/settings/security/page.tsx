'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Shield, Lock, Eye, EyeOff, Save, CheckCircle, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SecurityPage() {
  const [twoFA, setTwoFA] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/settings" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Security</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Shield className="w-6 h-6 text-red-500" /> Security Settings</h1>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 space-y-6">
          <div>
            <h2 className="font-bold mb-4 flex items-center gap-2"><Lock className="w-5 h-5 text-red-500" /> Password Policy</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Minimum password length</span>
                <input type="number" defaultValue="8" className="w-20 px-3 py-2 rounded-xl border text-center" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Require special characters</span>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Password expiry (days)</span>
                <input type="number" defaultValue="90" className="w-20 px-3 py-2 rounded-xl border text-center" />
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-bold mb-4 flex items-center gap-2"><Key className="w-5 h-5 text-amber-500" /> Two-Factor Authentication</h2>
            <div className="flex justify-between items-center">
              <span className="text-sm">Enable 2FA for all users</span>
              <button onClick={() => setTwoFA(!twoFA)} className={`w-12 h-6 rounded-full ${twoFA ? 'bg-red-500' : 'bg-neutral-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-all ${twoFA ? 'ml-6' : 'ml-1'}`} />
              </button>
            </div>
          </div>

          <Button onClick={handleSave} className="gap-2 bg-red-600 w-full">
            {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Security Settings</>}
          </Button>
        </div>
      </main>
    </div>
  )
}