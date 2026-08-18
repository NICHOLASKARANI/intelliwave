'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'

export default function InboxPage() {
  const [conversations] = useState<any[]>([])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/marketplace" className="font-bold text-lg">← Marketplace</Link>
          <span className="font-bold">Inbox</span>
          <div className="w-16"></div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-blue-500" /> Messages
        </h1>
        {conversations.length > 0 ? (
          <div className="space-y-3">
            {conversations.map(conv => (
              <div key={conv.id} className="p-4 rounded-xl border bg-white dark:bg-neutral-900">
                <p className="font-medium">{conv.listing?.title || 'Conversation'}</p>
                <p className="text-sm text-muted-foreground">{conv.lastMessage || 'No messages yet'}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No conversations yet</p>
            <p className="text-sm text-muted-foreground mt-1">Start chatting with buyers or sellers</p>
          </div>
        )}
      </main>
    </div>
  )
}