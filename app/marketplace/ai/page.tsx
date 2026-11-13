'use client'

import Link from 'next/link'
import { ChevronLeft, Sparkles } from 'lucide-react'
import AIChatWidget from '@/components/marketplace/AIChatWidget'

export default function AIPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur border-b border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/marketplace" className="flex items-center gap-2 font-bold">
            <ChevronLeft className="w-5 h-5" /> Marketplace
          </Link>
          <span className="font-bold text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" /> AI Shopping Assistant
          </span>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8 text-center">
        <div className="py-12">
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-2xl">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-3">Meet your AI shopping assistant</h1>
          <p className="text-neutral-400 mb-8 max-w-2xl mx-auto">
            Describe what you need in plain language. Ask for "laptops under 50K" or "cheapest smartphones".
            I'll find matching products, compare them, and help you buy.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto mb-8 text-left">
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
              <p className="text-cyan-400 font-bold text-sm mb-1">🔍 Find products</p>
              <p className="text-xs text-neutral-400">"Show me gaming laptops under 80K"</p>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
              <p className="text-cyan-400 font-bold text-sm mb-1">💰 Compare prices</p>
              <p className="text-xs text-neutral-400">"Cheapest phone with 4GB RAM"</p>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
              <p className="text-cyan-400 font-bold text-sm mb-1">🎯 Shop by use case</p>
              <p className="text-xs text-neutral-400">"Camera for photography under 30K"</p>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
              <p className="text-cyan-400 font-bold text-sm mb-1">🛒 One-click buy</p>
              <p className="text-xs text-neutral-400">Add products to cart directly from chat</p>
            </div>
          </div>

          <p className="text-sm text-neutral-500">
            Click the <Sparkles className="w-4 h-4 inline text-cyan-400" /> button in the bottom-right corner to start chatting.
          </p>
        </div>
      </main>

      <AIChatWidget />
    </div>
  )
}