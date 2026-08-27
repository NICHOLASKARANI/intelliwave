'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Facebook, Instagram, MessageCircle, Twitter, Music2, Sparkles, Zap, Calendar, BarChart3, Send, Globe, Rocket, Bot } from 'lucide-react'

export default function SocialMediaPage() {
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([])

  const platforms = [
    { name: 'Facebook', icon: Facebook, color: 'bg-blue-600', desc: 'Posts, Reels, Stories' },
    { name: 'Instagram', icon: Instagram, color: 'bg-pink-600', desc: 'Posts, Reels, Highlights' },
    { name: 'WhatsApp', icon: MessageCircle, color: 'bg-green-600', desc: 'Status, Business Posts' },
    { name: 'TikTok', icon: Music2, color: 'bg-black', desc: 'Videos, Trends' },
    { name: 'X (Twitter)', icon: Twitter, color: 'bg-neutral-800', desc: 'Posts, Threads' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">AI Social Media</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-6 lg:p-8 mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Rocket className="w-8 h-8" /> AI Social Media Management
          </h1>
          <p className="text-white/80">Autonomous posting across all platforms - 24/7</p>
        </div>

        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-500" /> Connect Your Platforms
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {platforms.map(platform => {
            const Icon = platform.icon
            return (
              <div key={platform.name} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
                <div className={`w-12 h-12 rounded-xl ${platform.color} flex items-center justify-center mx-auto mb-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="font-bold">{platform.name}</p>
                <p className="text-xs text-muted-foreground">{platform.desc}</p>
                <button 
                  onClick={() => setConnectedPlatforms(prev => 
                    prev.includes(platform.name) ? prev.filter(p => p !== platform.name) : [...prev, platform.name]
                  )}
                  className={`mt-3 px-4 py-2 rounded-lg text-sm font-bold ${connectedPlatforms.includes(platform.name) ? 'bg-green-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
                  {connectedPlatforms.includes(platform.name) ? '✓ Connected' : 'Connect'}
                </button>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-center">
            <Bot className="w-6 h-6 mx-auto mb-3" />
            <p className="font-bold">AI Content Generation</p>
            <p className="text-xs mt-1">Auto-generate posts from business info</p>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-white text-center">
            <Calendar className="w-6 h-6 mx-auto mb-3" />
            <p className="font-bold">Smart Scheduling</p>
            <p className="text-xs mt-1">Post at optimal times 24/7</p>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 text-white text-center">
            <BarChart3 className="w-6 h-6 mx-auto mb-3" />
            <p className="font-bold">Analytics</p>
            <p className="text-xs mt-1">Track engagement and growth</p>
          </div>
        </div>
      </main>
    </div>
  )
}