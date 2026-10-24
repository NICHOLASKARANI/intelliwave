'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Search, Calendar, Clock, User, Tag, BookOpen } from 'lucide-react'

const categories = ['All', 'AI & ML', 'ERP', 'E-commerce', 'Cybersecurity', 'Cloud']

const posts = [
  {
    id: 1,
    title: 'The Future of AI in African Enterprise',
    excerpt: 'How artificial intelligence is reshaping the operational landscape for businesses across East Africa, from supply chain to customer experience.',
    date: 'Aug 18, 2026',
    readTime: '5 min read',
    category: 'AI & ML',
    author: 'Nicholas Karani',
    featured: true,
    image: '/images/blog/ai-automation.jpeg',
  },
  {
    id: 2,
    title: 'Building a High-Trust Marketplace',
    excerpt: 'Lessons learned from scaling WavveMarket. How we balance buyer protection with frictionless seller onboarding.',
    date: 'Aug 15, 2026',
    readTime: '7 min read',
    category: 'E-commerce',
    author: 'Mark Mwangi',
    featured: false,
    image: '/images/blog/ecommerce.jpeg',
  },
  {
    id: 3,
    title: 'Multi-Tenant ERP: Architecture at Scale',
    excerpt: 'Deep dive into the database architecture powering WaveCore ERP. Why we chose PostgreSQL, Neon, and strict tenant isolation.',
    date: 'Aug 12, 2026',
    readTime: '8 min read',
    category: 'ERP',
    author: 'IntelliWavve Team',
    featured: false,
    image: '/images/blog/cloud-devops.jpg',
  },
  {
    id: 4,
    title: 'Securing the Modern Enterprise',
    excerpt: 'Beyond firewalls. How we approach security and data sovereignty for financial and healthcare clients in Kenya.',
    date: 'Aug 10, 2026',
    readTime: '6 min read',
    category: 'Cybersecurity',
    author: 'IntelliWavve Team',
    featured: false,
    image: '/images/blog/cybersecurity.jpg',
  },
  {
    id: 5,
    title: 'Digital Transformation for Real Estate',
    excerpt: 'Moving away from spreadsheets. How property managers are using digital platforms to manage thousands of tenants.',
    date: 'Aug 05, 2026',
    readTime: '4 min read',
    category: 'Business',
    author: 'Nicholas Karani',
    featured: false,
    image: '/images/blog/real-estate.jpeg',
  },
  {
    id: 6,
    title: 'The Evolution of Kenyan SaaS',
    excerpt: 'A look at the growing software ecosystem in Nairobi and the shift towards global-grade, locally-built platforms.',
    date: 'Aug 01, 2026',
    readTime: '10 min read',
    category: 'Business',
    author: 'Nicholas Karani',
    featured: false,
    image: '/images/blog/corporate.jpeg',
  },
]

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPosts = posts.filter(post => {
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const featuredPost = filteredPosts.find(p => p.featured)
  const regularPosts = filteredPosts.filter(p => !p.featured)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* ================= HERO ================= */}
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-sm mb-6 border border-blue-100">
              <BookOpen className="w-4 h-4" /> IntelliWavve Insights
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              Ideas for <span className="text-blue-600">What's Next</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10">
              Thoughtful perspectives on AI, enterprise software, and the future of African business.
            </p>
            
            <div className="max-w-xl mx-auto relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search articles..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm" 
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= CATEGORIES ================= */}
      <section className="sticky top-0 z-30 bg-slate-50/90 backdrop-blur-md border-b border-slate-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map(category => (
              <button 
                key={category} 
                onClick={() => setActiveCategory(category)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeCategory === category
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}>
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURED POST ================= */}
      <section className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {featuredPost && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Link href={`/blog/${featuredPost.id}`} className="group block relative rounded-3xl overflow-hidden bg-slate-900 aspect-[16/9] lg:aspect-[21/9] shadow-2xl">
                <Image 
                  src={featuredPost.image} 
                  alt={featuredPost.title} 
                  fill 
                  className="object-cover opacity-60 group-hover:opacity-40 group-hover:scale-105 transition-all duration-700" 
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-sm">
                      Featured
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm">
                      {featuredPost.category}
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight group-hover:text-blue-300 transition-colors">
                    {featuredPost.title}
                  </h2>
                  <p className="text-lg text-slate-300 mb-8 max-w-2xl hidden md:block">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center gap-6 text-sm text-slate-400 font-medium">
                    <span className="flex items-center gap-2"><User className="w-4 h-4" /> {featuredPost.author}</span>
                    <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {featuredPost.date}</span>
                    <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {featuredPost.readTime}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* ================= GRID POSTS ================= */}
      <section className="py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularPosts.map((post, i) => (
              <motion.article 
                key={post.id} 
                initial={{ opacity: 0, y: 20 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }} 
                transition={{ delay: i * 0.1 }}
              >
                <Link href={`/blog/${post.id}`} className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-xl transition-all duration-300">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image 
                      src={post.image} 
                      alt={post.title} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                    />
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                        {post.category}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-slate-600 mb-6 flex-1 line-clamp-2">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-100">
                      <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {post.author}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {post.readTime}</span>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
          
          {filteredPosts.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No articles found</h3>
              <p className="text-slate-500">Try adjusting your search or category filter.</p>
            </div>
          )}
        </div>
      </section>

      {/* ================= NEWSLETTER ================= */}
      <section className="py-20 lg:py-28 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Stay ahead of the curve</h2>
          <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">
            Join our newsletter for exclusive insights on AI, software engineering, and enterprise transformation.
          </p>
          <form 
            onSubmit={(e) => { e.preventDefault(); window.location.href = '/contact' }}
            className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
          >
            <input 
              type="email" 
              required 
              placeholder="Enter your work email" 
              className="flex-1 px-5 py-4 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
            />
            <button 
              type="submit" 
              className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all flex items-center justify-center gap-2"
            >
              Subscribe <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </section>

    </div>
  )
}