'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Package } from 'lucide-react'

export default function StoreModulePage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <Link href="/wavecore-erp/store" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Store
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 lg:p-8 text-center">
        <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <h1 className="text-2xl font-bold mb-2">Module Coming Soon</h1>
        <p className="text-muted-foreground">This store module is being built. Check back soon!</p>
      </main>
    </div>
  )
}