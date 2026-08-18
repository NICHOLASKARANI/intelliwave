'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart } from 'lucide-react'

export default function SavedPage() {
  const [saved] = useState<any[]>([])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/marketplace" className="font-bold text-lg">← Marketplace</Link>
          <span className="font-bold">Saved</span>
          <div className="w-16"></div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500" /> Saved Listings
        </h1>
        {saved.length > 0 ? (
          <div className="space-y-3">
            {saved.map(item => (
              <div key={item.id} className="p-4 rounded-xl border bg-white dark:bg-neutral-900">
                <p className="font-medium">{item.listing?.title || 'Saved item'}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No saved items yet</p>
            <p className="text-sm text-muted-foreground mt-1">Save items you like to find them later</p>
          </div>
        )}
      </main>
    </div>
  )
}