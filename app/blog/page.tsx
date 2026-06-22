'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Search, Calendar, Clock, User, Tag, TrendingUp } from 'lucide-react'

const categories = ['All', 'AI & ML', 'Web Dev', 'Cloud', 'Business', 'Security', 'Career', 'IIoT']

const posts = [
  {
    title: 'The Future of AI in African Enterprise',
    excerpt: 'How artificial intelligence is transforming businesses across Africa.',
    date: '2024-06-15', readTime: '5 min', category: 'AI & ML',
    author: 'Nicholas Karani', tags: ['AI', 'Africa', 'Enterprise'],
    featured: true,
  },
  {
    title: 'Building Scalable SaaS Platforms in 2024',
    excerpt: 'Best practices for building SaaS applications that scale to millions.',
    date: '2024-06-10', readTime: '7 min', category: 'Web Dev',
    author: 'Mark Mwangi', tags: ['SaaS', 'Architecture'],
    featured: true,
  },
  {
    title: 'Cloud Infrastructure Best Practices',
    excerpt: 'Choosing the right cloud architecture for your growing business.',
    date: '2024-06-05', readTime: '4 min', category: 'Cloud',
    author: 'IntelliWave Team', tags: ['Cloud', 'AWS'],
    featured: false,
  },
  {
    title: 'Why Kenyan Companies Are Investing in AI',
    excerpt: 'Analysis of growing AI investment among Kenyan enterprises.',
    date: '2024-05-28', readTime: '6 min', category: 'AI & ML',
    author: 'Nicholas Karani', tags: ['AI', 'Kenya'],
    featured: false,
  },
  {
    title: 'M-Pesa Integrated E-commerce Rise',
    excerpt: 'How mobile money is revolutionizing e-commerce in East Africa.',
    date: '2024-05-20', readTime: '5 min', category: 'Business',
    author: 'IntelliWave Team', tags: ['M-Pesa', 'E-commerce'],
    featured: false,
  },
  {
    title: 'Cybersecurity Essentials for Startups',
    excerpt: 'Protect your startup with enterprise-grade security on a budget.',
    date: '2024-05-15', readTime: '8 min', category: 'Security',
    author: 'IntelliWave Team', tags: ['Security', 'Startups'],
    featured: false,
  },
  {
    title: 'IIoT: The Future of Manufacturing',
    excerpt: 'How industrial IoT is transforming African manufacturing.',
    date: '2024-05-10', readTime: '6 min', category: 'IIoT',
    author: 'Gefferson Mbeere', tags: ['IIoT', 'Manufacturing'],
    featured: false,
  },
  {
    title: 'Building a Tech Career in Africa',
    excerpt: 'Guide to building a successful technology career in Africa.',
    date: '2024-05-05', readTime: '6 min', category: 'Career',
    author: 'Kelvin Muchui', tags: ['Career', 'Tech'],
    featured: false,
  },
]

const popularTags = ['AI', 'Africa', 'Cloud', 'SaaS', 'M-Pesa', 'Kenya', 'Security', 'IIoT', 'Career']

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = posts.filter(p => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory
    const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    return matchCat && matchSearch
  })

  const featured = filtered.filter(p => p.featured)
  const regular = filtered.filter(p => !p.featured)

  return (
    <div className="py-20">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Latest from{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              the Blog
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            AI insights, tutorials, and technology trends from 500+ experts.
          </p>
        </div>

        {/* Live Ticker */}
        <div className="mb-12 p-4 rounded-2xl bg-primary/5 border border-primary/10 overflow-hidden">
          <div className="flex items-center gap-2 animate-marquee whitespace-nowrap">
            <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-sm font-medium">🔥 Trending:</span>
            {popularTags.map((tag, i) => (
              <span key={i} className="text-sm text-muted-foreground">
                #{tag} {i < popularTags.length - 1 ? '•' : ''}
              </span>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-12 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat ? 'bg-primary text-white' : 'bg-muted hover:bg-primary/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text" placeholder="Search articles..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary w-64"
            />
          </div>
        </div>

        {/* Featured Posts */}
        {featured.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Featured Articles</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featured.map((post) => (
                <Link key={post.title} href={`/blog/${post.title.toLowerCase().replace(/\s+/g, '-')}`}
                  className="group p-6 rounded-2xl border hover:border-primary/50 hover:shadow-xl transition-all bg-gradient-to-br from-primary/5 to-accent/5">
                  <div className="text-sm text-primary font-medium mb-2">{post.category}</div>
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">{post.title}</h3>
                  <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{post.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{post.author}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Regular Posts */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {regular.map((post) => (
            <Link key={post.title} href={`/blog/${post.title.toLowerCase().replace(/\s+/g, '-')}`}
              className="group p-6 rounded-2xl border hover:border-primary/50 hover:shadow-xl transition-all">
              <div className="text-sm text-primary font-medium mb-2">{post.category}</div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{post.title}</h3>
              <p className="text-muted-foreground text-sm mb-4">{post.excerpt}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{post.date}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12"><p className="text-muted-foreground">No articles found.</p></div>
        )}

        {/* Tags Cloud */}
        <div className="mb-16 p-8 rounded-2xl border bg-gradient-to-br from-background to-primary/5 text-center">
          <h2 className="text-2xl font-bold mb-4">Popular Topics</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {popularTags.map((tag) => (
              <button key={tag} onClick={() => setSearchTerm(tag)}
                className="px-4 py-2 rounded-full bg-muted hover:bg-primary/10 text-sm font-medium transition-colors">
                <Tag className="w-3 h-3 inline mr-1" />{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Get the latest AI insights, tutorials, and IntelliWave news delivered to your inbox.
          </p>
          <div className="flex gap-2 max-w-md mx-auto">
            <input type="email" placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <Button className="group">Subscribe <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" /></Button>
          </div>
        </div>
      </div>
    </div>
  )
}