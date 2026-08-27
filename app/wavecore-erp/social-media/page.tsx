'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Sparkles, Calendar, BarChart3, Send, Globe, Rocket, Bot, Clock, TrendingUp, Users, Target, CheckCircle, Loader2 } from 'lucide-react'

// Real SVG logos
const FacebookLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

const InstagramLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)

const TikTokLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
)

const WhatsAppLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

const XLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

export default function SocialMediaPage() {
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([])
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [postContent, setPostContent] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [industry, setIndustry] = useState('retail')
  const [generating, setGenerating] = useState(false)
  const [posting, setPosting] = useState(false)
  const [posts, setPosts] = useState<any[]>([])
  const [generatedContent, setGeneratedContent] = useState('')

  const platforms = [
    { name: 'Facebook', icon: FacebookLogo, color: '#1877F2', desc: 'Posts, Reels, Stories' },
    { name: 'Instagram', icon: InstagramLogo, color: '#E4405F', desc: 'Posts, Reels, Highlights' },
    { name: 'WhatsApp', icon: WhatsAppLogo, color: '#25D366', desc: 'Status, Business' },
    { name: 'TikTok', icon: TikTokLogo, color: '#000000', desc: 'Videos, Trends' },
    { name: 'X (Twitter)', icon: XLogo, color: '#000000', desc: 'Posts, Threads' },
  ]

  const toggleConnect = (name: string) => {
    setConnectedPlatforms(prev => 
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    )
    setSelectedPlatform(name)
  }

  const generateContent = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/wavecore/social-media/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry, platform: selectedPlatform })
      })
      const data = await res.json()
      if (data.success) {
        setGeneratedContent(data.post.content)
        setHashtags(data.post.hashtags.join(' '))
      }
    } catch {} finally {
      setGenerating(false)
    }
  }

  const handlePost = async () => {
    if (!postContent.trim()) return
    setPosting(true)
    try {
      const newPost = {
        content: postContent,
        hashtags,
        platform: selectedPlatform,
        status: 'POSTED',
        timestamp: new Date().toISOString()
      }
      setPosts(prev => [newPost, ...prev])
      setPostContent('')
      setHashtags('')
      setGeneratedContent('')
    } catch {} finally {
      setPosting(false)
    }
  }

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
          <p className="text-white/80">Connect platforms, generate content, post automatically</p>
        </div>

        {/* Platform Selection */}
        <h2 className="text-xl font-bold mb-4">1. Select Platform</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
          {platforms.map(platform => {
            const Icon = platform.icon
            const connected = connectedPlatforms.includes(platform.name)
            const selected = selectedPlatform === platform.name
            return (
              <button key={platform.name} onClick={() => toggleConnect(platform.name)}
                className={`p-4 rounded-2xl border text-center transition-all ${selected ? 'border-blue-500 bg-blue-50' : connected ? 'border-green-500 bg-green-50' : 'bg-white dark:bg-neutral-900'}`}>
                <div className="w-10 h-10 mx-auto mb-2" style={{ color: platform.color }}>
                  <Icon />
                </div>
                <p className="font-bold text-sm">{platform.name}</p>
                <p className="text-xs text-muted-foreground">{platform.desc}</p>
                <p className={`mt-1 text-xs font-bold ${connected ? 'text-green-600' : 'text-red-600'}`}>
                  {connected ? '✓ Connected' : 'Click to Connect'}
                </p>
              </button>
            )
          })}
        </div>

        {/* Industry Selection */}
        {selectedPlatform && (
          <>
            <h2 className="text-xl font-bold mb-4">2. Select Industry</h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {['retail', 'real_estate', 'healthcare', 'legal'].map(ind => (
                <button key={ind} onClick={() => setIndustry(ind)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold ${industry === ind ? 'bg-blue-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
                  {ind.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>

            {/* Generate Content */}
            <h2 className="text-xl font-bold mb-4">3. Generate Content</h2>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-4">
              <button onClick={generateContent} disabled={generating}
                className="px-6 py-3 rounded-xl bg-purple-600 text-white font-bold flex items-center gap-2 disabled:opacity-50">
                {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {generating ? 'Generating...' : 'Generate AI Content'}
              </button>
              {generatedContent && (
                <div className="mt-4 p-3 rounded-xl bg-purple-50 text-purple-700">
                  <p className="font-bold">Generated:</p>
                  <p>{generatedContent}</p>
                  <p className="text-sm mt-2">{hashtags}</p>
                </div>
              )}
            </div>

            {/* Compose Post */}
            <h2 className="text-xl font-bold mb-4">4. Compose & Post</h2>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-6">
              <textarea
                value={postContent || generatedContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Write your post..."
                className="w-full px-4 py-3 rounded-xl border min-h-[100px] mb-3"
              />
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="Hashtags"
                className="w-full px-4 py-2 rounded-xl border mb-3"
              />
              <button onClick={handlePost} disabled={posting || !postContent.trim()}
                className="px-6 py-3 rounded-xl bg-green-600 text-white font-bold flex items-center gap-2 disabled:opacity-50">
                {posting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Post to {selectedPlatform}
              </button>
            </div>
          </>
        )}

        {/* Posted History */}
        {posts.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Posted History</h2>
            <div className="space-y-2">
              {posts.map((post, i) => (
                <div key={i} className="p-3 rounded-xl bg-white dark:bg-neutral-900 border flex justify-between">
                  <div>
                    <p className="text-sm">{post.content}</p>
                    <p className="text-xs text-muted-foreground">{post.platform} - {new Date(post.timestamp).toLocaleTimeString()}</p>
                  </div>
                  <span className="text-green-600 text-sm font-bold">✓ Posted</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}