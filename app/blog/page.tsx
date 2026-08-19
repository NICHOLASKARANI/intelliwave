'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight, Search, Calendar, Clock, User, Tag, TrendingUp,
  Sparkles, Globe, Shield, Zap, BarChart3, Rocket, Star,
  ChevronRight, BookOpen, Award, Target, Eye, Heart, Share2
} from 'lucide-react'

const categories = ['All', 'AI & ML', 'Web Dev', 'Cloud', 'Business', 'Security', 'Career', 'IIoT', 'ERP']

const posts = [
  {
    id: 1,
    title: 'The Future of AI in African Enterprise: 2026-2030 Vision',
    excerpt: 'How artificial intelligence is transforming businesses across Africa. From KSh 500 ERP subscriptions to enterprise AI platforms serving 1M+ businesses.',
    date: '2026-08-18', readTime: '5 min', category: 'AI & ML',
    author: 'Nicholas Karani', tags: ['AI', 'Africa', 'Enterprise', '2030 Vision'],
    featured: true,
    views: 12500, likes: 890,
  },
  {
    id: 2,
    title: 'Building Scalable SaaS Platforms for Millions of Users in 2026',
    excerpt: 'Best practices for building SaaS applications that scale to millions. WaveCore ERP architecture deep dive.',
    date: '2026-08-15', readTime: '7 min', category: 'Web Dev',
    author: 'Mark Mwangi', tags: ['SaaS', 'Architecture', 'WaveCore'],
    featured: true,
    views: 9800, likes: 756,
  },
  {
    id: 3,
    title: 'Cloud Infrastructure: Multi-Tenant Architecture for Enterprise ERP',
    excerpt: 'How WaveCore ERP achieves tenant isolation with Neon PostgreSQL, Vercel Edge, and 100+ connection pooling.',
    date: '2026-08-12', readTime: '4 min', category: 'Cloud',
    author: 'IntelliWavve Team', tags: ['Cloud', 'Multi-Tenant', 'PostgreSQL'],
    featured: false,
    views: 7200, likes: 543,
  },
  {
    id: 4,
    title: 'Why Kenyan Companies Are Investing in AI: 2026 Statistics',
    excerpt: 'Analysis of growing AI investment among Kenyan enterprises. KSh 500 ERP subscriptions democratizing access.',
    date: '2026-08-10', readTime: '6 min', category: 'AI & ML',
    author: 'Nicholas Karani', tags: ['AI', 'Kenya', 'Statistics'],
    featured: false,
    views: 6300, likes: 421,
  },
  {
    id: 5,
    title: 'The Rise of AI-Native ERP: Oracle, Epicor, Acumatica vs WaveCore',
    excerpt: 'How WaveCore ERP combines NetSuite business management + Kinetic manufacturing + Acumatica flexibility + Fusion enterprise controls.',
    date: '2026-08-08', readTime: '8 min', category: 'ERP',
    author: 'Nicholas Karani', tags: ['ERP', 'WaveCore', 'Competitive'],
    featured: false,
    views: 8500, likes: 634,
  },
  {
    id: 6,
    title: 'Cybersecurity in 2026: Protecting Multi-Tenant SaaS Platforms',
    excerpt: 'Enterprise security for AI-native ERP systems. SOC 2 Type II, ISO 27001, GDPR compliance.',
    date: '2026-08-05', readTime: '5 min', category: 'Security',
    author: 'IntelliWavve Team', tags: ['Security', 'SOC 2', 'GDPR'],
    featured: false,
    views: 5400, likes: 389,
  },
  {
    id: 7,
    title: 'From Idea to IPO: The IntelliWavve Journey to 2030',
    excerpt: 'Our vision to become the world\'s largest AI-native ERP platform. 450,000+ businesses, 100+ countries.',
    date: '2026-08-01', readTime: '10 min', category: 'Business',
    author: 'Nicholas Karani', tags: ['Vision', '2030', 'Growth'],
    featured: true,
    views: 15000, likes: 1200,
  },
]

const stats2026 = [
  { label: 'Businesses Served', value: '450,000+', icon: Globe },
  { label: 'Countries', value: '100+', icon: Globe },
  { label: 'AI Models Deployed', value: '2,500+', icon: Zap },
  { label: 'Uptime SLA', value: '99.99%', icon: Shield },
]

const vision2027 = [
  { label: 'Businesses', value: '1M+', icon: Rocket },
  { label: 'Countries', value: '150+', icon: Globe },
  { label: 'ERP Users', value: '500K+', icon: Users },
  { label: 'Revenue', value: 'KSh 5B+', icon: TrendingUp },
]

const roadmap2030 = [
  { phase: 'Phase 1 (2026)', goal: 'AI-Native ERP Launch', status: 'COMPLETE', color: 'text-green-400' },
  { phase: 'Phase 2 (2027)', goal: '1M Businesses Served', status: 'IN PROGRESS', color: 'text-blue-400' },
  { phase: 'Phase 3 (2028)', goal: 'Global Expansion - 150+ Countries', status: 'PLANNED', color: 'text-purple-400' },
  { phase: 'Phase 4 (2030)', goal: 'World\'s #1 AI-Native ERP', status: 'VISION', color: 'text-amber-400' },
]

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [visiblePosts, setVisiblePosts] = useState(6)

  const filteredPosts = posts.filter(post => {
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-neutral-950" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 text-amber-400" /> IntelliWavve Insights
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6">
              Enterprise <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">AI Blog</span>
            </h1>
            <p className="text-xl text-neutral-300 max-w-3xl mx-auto mb-10">
              Insights on AI, ERP, Cloud, and the Future of Enterprise Technology
            </p>
            
            {/* Search */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-400 text-lg"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2026 Statistics */}
      <section className="py-12 bg-white dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">2026 Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats2026.map(stat => {
              const Icon = stat.icon
              return (
                <motion.div key={stat.label} whileHover={{ scale: 1.05 }}
                  className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 text-center">
                  <Icon className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
                  <p className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">{stat.value}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{stat.label}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map(category => (
              <button key={category} onClick={() => setActiveCategory(category)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeCategory === category
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100'
                }`}>
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.slice(0, visiblePosts).map(post => (
              <motion.article key={post.id} whileHover={{ y: -5 }}
                className={`bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all ${
                  post.featured ? 'lg:col-span-2' : ''
                }`}>
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                      {post.category}
                    </span>
                    {post.featured && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center gap-1">
                        <Star className="w-3 h-3" /> Featured
                      </span>
                    )}
                  </div>
                  
                  <h2 className="text-2xl font-bold mb-3 text-neutral-900 dark:text-white">
                    {post.title}
                  </h2>
                  
                  <p className="text-neutral-600 dark:text-neutral-300 mb-6">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-neutral-500 mb-6">
                    <span className="flex items-center gap-1"><User className="w-4 h-4" /> {post.author}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {post.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {post.readTime}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-neutral-500">
                      <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {post.views?.toLocaleString()}</span>
                      <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {post.likes}</span>
                    </div>
                    <Link href="#" className="flex items-center gap-1 text-indigo-600 font-medium hover:gap-2 transition-all">
                      Read More <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
          
          {visiblePosts < filteredPosts.length && (
            <div className="text-center mt-10">
              <Button onClick={() => setVisiblePosts(visiblePosts + 6)} variant="outline" size="lg">
                Load More Articles
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* 2027 Vision */}
      <section className="py-16 bg-gradient-to-br from-indigo-950 to-purple-950">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">2027 Vision</h2>
          <p className="text-neutral-300 mb-10">Scaling to 1 Million Businesses</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {vision2027.map(item => {
              const Icon = item.icon
              return (
                <div key={item.label} className="p-6 rounded-2xl bg-white/5 text-center">
                  <Icon className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-white">{item.value}</p>
                  <p className="text-sm text-neutral-400">{item.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 2030 Roadmap */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-10">Roadmap to 2030</h2>
          <div className="space-y-4">
            {roadmap2030.map(item => (
              <div key={item.phase} className="p-6 rounded-2xl bg-white dark:bg-neutral-900 shadow-lg flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${item.color} animate-pulse`} />
                <div>
                  <p className="font-bold text-lg">{item.phase}</p>
                  <p className="text-neutral-500">{item.goal}</p>
                </div>
                <span className={`ml-auto text-sm font-bold ${item.color}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}