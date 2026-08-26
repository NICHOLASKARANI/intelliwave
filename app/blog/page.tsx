'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight, Search, Calendar, Clock, User, Tag, TrendingUp,
  Sparkles, Globe, Shield, Zap, BarChart3, Rocket, Star,
  ChevronRight, BookOpen, Award, Target, Eye, Heart, Users
 } from 'lucide-react'

// Animated Counter Component
function AnimatedCounter({ end, duration = 2500, suffix = '', prefix = '' }: { end: number; duration?: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true)
          let startTime: number
          let animationId: number
          const easeOutExpo = (t: number): number => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))
          const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp
            const elapsed = timestamp - startTime
            const progress = Math.min(elapsed / duration, 1)
            setCount(Math.floor(easeOutExpo(progress) * end))
            if (progress < 1) animationId = requestAnimationFrame(animate)
          }
          animationId = requestAnimationFrame(animate)
          return () => cancelAnimationFrame(animationId)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration, hasStarted])

  return (
    <div ref={ref} className="inline-flex">
      {prefix}{count.toLocaleString()}{suffix}
    </div>
  )
}

const categories = ['All', 'AI & ML', 'Web Dev', 'Cloud', 'Business', 'Security', 'Career', 'IIoT', 'ERP']

const posts = [
  { id: 1, title: 'The Future of AI in African Enterprise: 2026-2030 Vision', excerpt: 'How AI is transforming businesses across Africa.', date: '2026-08-18', readTime: '5 min', category: 'AI & ML', author: 'Nicholas Karani', featured: true, views: 12500, likes: 890 },
  { id: 2, title: 'Building Scalable SaaS Platforms for Millions in 2026', excerpt: 'Best practices for SaaS that scale to millions.', date: '2026-08-15', readTime: '7 min', category: 'Web Dev', author: 'Mark Mwangi', featured: true, views: 9800, likes: 756 },
  { id: 3, title: 'Cloud Infrastructure: Multi-Tenant ERP Architecture', excerpt: 'Neon PostgreSQL, Vercel Edge, 100+ connections.', date: '2026-08-12', readTime: '4 min', category: 'Cloud', author: 'IntelliWavve Team', featured: false, views: 7200, likes: 543 },
  { id: 4, title: 'Why Kenyan Companies Invest in AI: 2026 Stats', excerpt: 'KSh 500 ERP subscriptions democratizing access.', date: '2026-08-10', readTime: '6 min', category: 'AI & ML', author: 'Nicholas Karani', featured: false, views: 6300, likes: 421 },
  { id: 5, title: 'AI-Native ERP: Oracle, Epicor, Acumatica vs WaveCore', excerpt: 'Combining NetSuite + Kinetic + Acumatica + Fusion.', date: '2026-08-08', readTime: '8 min', category: 'ERP', author: 'Nicholas Karani', featured: false, views: 8500, likes: 634 },
  { id: 6, title: 'Cybersecurity 2026: Protecting Multi-Tenant SaaS', excerpt: 'SOC 2 Type II, ISO 27001, GDPR compliance.', date: '2026-08-05', readTime: '5 min', category: 'Security', author: 'IntelliWavve Team', featured: false, views: 5400, likes: 389 },
  { id: 7, title: 'From Idea to IPO: IntelliWavve Journey to 2030', excerpt: 'Becoming the world\'s largest AI-native ERP platform.', date: '2026-08-01', readTime: '10 min', category: 'Business', author: 'Nicholas Karani', featured: true, views: 15000, likes: 1200 },
]

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [visiblePosts, setVisiblePosts] = useState(6)

  const filteredPosts = posts.filter(post => {
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-neutral-950 relative overflow-hidden">
      {/* Starry Orbiting Background */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDuration: Math.random() * 3 + 2 + 's',
              animationDelay: Math.random() * 2 + 's',
              opacity: Math.random() * 0.5 + 0.3,
            }}
          />
        ))}
        {/* Orbiting rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-indigo-500/20 rounded-full animate-spin" style={{ animationDuration: '60s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-purple-500/10 rounded-full animate-spin" style={{ animationDuration: '80s', animationDirection: 'reverse' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] border border-pink-500/5 rounded-full animate-spin" style={{ animationDuration: '100s' }} />
      </div>

      {/* Hero */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm mb-6">
            <Sparkles className="w-4 h-4 text-amber-400" /> IntelliWavve Insights
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6">
            Enterprise <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">AI Blog</span>
          </h1>
          <p className="text-xl text-neutral-300 max-w-3xl mx-auto mb-10">
            Insights on AI, ERP, Cloud, and the Future of Enterprise Technology
          </p>
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input type="text" placeholder="Search articles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-400 text-lg" />
          </div>
        </div>
      </section>

      {/* 2026 Stats with Animated Counters */}
      <section className="relative py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-10">2026 Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white/5 text-center">
              <Globe className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
              <p className="text-3xl font-extrabold text-white"><AnimatedCounter end={450000} suffix="+" /></p>
              <p className="text-sm text-neutral-400">Businesses Served</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 text-center">
              <Globe className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <p className="text-3xl font-extrabold text-white"><AnimatedCounter end={100} suffix="+" /></p>
              <p className="text-sm text-neutral-400">Countries</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 text-center">
              <Zap className="w-8 h-8 text-purple-400 mx-auto mb-3" />
              <p className="text-3xl font-extrabold text-white"><AnimatedCounter end={2500} suffix="+" /></p>
              <p className="text-sm text-neutral-400">AI Models Deployed</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 text-center">
              <Shield className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <p className="text-3xl font-extrabold text-white"><AnimatedCounter end={99} suffix=".99%" /></p>
              <p className="text-sm text-neutral-400">Uptime SLA</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="relative py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map(category => (
              <button key={category} onClick={() => setActiveCategory(category)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeCategory === category
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white/10 text-neutral-300 hover:bg-white/20'
                }`}>
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Posts */}
      <section className="relative py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.slice(0, visiblePosts).map(post => (
              <motion.article key={post.id} whileHover={{ y: -5 }}
                className={`bg-white/5 rounded-3xl overflow-hidden p-8 border border-white/10 ${
                  post.featured ? 'lg:col-span-2' : ''
                }`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400">
                    {post.category}
                  </span>
                  {post.featured && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 flex items-center gap-1">
                      <Star className="w-3 h-3" /> Featured
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold mb-3 text-white">{post.title}</h2>
                <p className="text-neutral-400 mb-6">{post.excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-neutral-500 mb-6">
                  <span className="flex items-center gap-1"><User className="w-4 h-4" /> {post.author}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {post.date}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {post.readTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-neutral-500">
                    <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> <AnimatedCounter end={post.views} /></span>
                    <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {post.likes}</span>
                  </div>
                  <Link href="/contact" className="flex items-center gap-1 text-indigo-400 font-medium hover:gap-2 transition-all">
                    Read More <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}