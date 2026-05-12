'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Search, Calendar, Clock, User, Tag } from 'lucide-react'

const categories = ['All', 'AI & ML', 'Web Development', 'Cloud', 'Business', 'Technology', 'Career']

const posts = [
  {
    title: 'The Future of AI in African Enterprise',
    excerpt: 'How artificial intelligence is transforming businesses across Africa and what it means for the continent\'s economic future.',
    date: '2024-01-15',
    readTime: '5 min read',
    category: 'AI & ML',
    author: 'Nicholas Karani',
    tags: ['AI', 'Africa', 'Enterprise'],
    slug: 'future-of-ai-africa',
    featured: true,
  },
  {
    title: 'Building Scalable SaaS Platforms in 2024',
    excerpt: 'Best practices for building enterprise-grade SaaS applications that can scale from 100 to 100 million users.',
    date: '2024-01-10',
    readTime: '7 min read',
    category: 'Web Development',
    author: 'Intelliwave Team',
    tags: ['SaaS', 'Architecture', 'Scaling'],
    slug: 'scalable-saas-platforms-2024',
    featured: true,
  },
  {
    title: 'Cloud Infrastructure Best Practices for African Businesses',
    excerpt: 'Choosing the right cloud architecture for your growing business with considerations for African markets.',
    date: '2024-01-05',
    readTime: '4 min read',
    category: 'Cloud',
    author: 'Intelliwave Team',
    tags: ['Cloud', 'AWS', 'Infrastructure'],
    slug: 'cloud-infrastructure-africa',
    featured: false,
  },
  {
    title: 'Why Kenyan Companies Are Investing in AI',
    excerpt: 'An analysis of the growing AI investment trend among Kenyan enterprises and the ROI they\'re seeing.',
    date: '2023-12-28',
    readTime: '6 min read',
    category: 'AI & ML',
    author: 'Nicholas Karani',
    tags: ['AI', 'Kenya', 'Investment'],
    slug: 'kenyan-companies-ai-investment',
    featured: false,
  },
  {
    title: 'The Rise of M-Pesa Integrated E-commerce',
    excerpt: 'How mobile money integration is revolutionizing e-commerce in East Africa and what it means for developers.',
    date: '2023-12-20',
    readTime: '5 min read',
    category: 'Technology',
    author: 'Intelliwave Team',
    tags: ['M-Pesa', 'E-commerce', 'FinTech'],
    slug: 'mpesa-ecommerce-rise',
    featured: false,
  },
  {
    title: 'Cybersecurity Essentials for African Startups',
    excerpt: 'Protecting your startup from cyber threats with enterprise-grade security on a startup budget.',
    date: '2023-12-15',
    readTime: '8 min read',
    category: 'Technology',
    author: 'Intelliwave Team',
    tags: ['Security', 'Startups', 'Cybersecurity'],
    slug: 'cybersecurity-african-startups',
    featured: false,
  },
  {
    title: 'How to Build a Tech Career in Africa',
    excerpt: 'A comprehensive guide to building a successful technology career in Africa\'s growing tech ecosystem.',
    date: '2023-12-10',
    readTime: '6 min read',
    category: 'Career',
    author: 'Nicholas Karani',
    tags: ['Career', 'Tech', 'Africa'],
    slug: 'tech-career-africa',
    featured: false,
  },
  {
    title: 'ERP Systems: Build vs Buy for African Enterprises',
    excerpt: 'When should African enterprises build custom ERP systems versus buying off-the-shelf solutions?',
    date: '2023-12-05',
    readTime: '7 min read',
    category: 'Business',
    author: 'Intelliwave Team',
    tags: ['ERP', 'Enterprise', 'Business'],
    slug: 'erp-build-vs-buy',
    featured: false,
  },
  {
    title: 'Mobile-First Development for African Markets',
    excerpt: 'Why mobile-first development is crucial for reaching African users and best practices for implementation.',
    date: '2023-11-28',
    readTime: '5 min read',
    category: 'Web Development',
    author: 'Intelliwave Team',
    tags: ['Mobile', 'Development', 'Africa'],
    slug: 'mobile-first-africa',
    featured: false,
  },
]

const popularTags = ['AI', 'Africa', 'Cloud', 'SaaS', 'M-Pesa', 'Kenya', 'Security', 'Career', 'Enterprise']

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPosts = posts.filter((post) => {
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const featuredPosts = filteredPosts.filter(p => p.featured)
  const regularPosts = filteredPosts.filter(p => !p.featured)

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
            AI insights, software engineering tutorials, and technology trends from our team of 500+ experts.
          </p>
        </div>

        {/* Search & Categories */}
        <div className="flex flex-col md:flex-row gap-4 mb-12 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-primary text-white'
                    : 'bg-muted hover:bg-primary/10 text-muted-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary w-64"
            />
          </div>
        </div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Featured Articles</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group p-6 rounded-2xl border hover:border-primary/50 hover:shadow-xl transition-all bg-gradient-to-br from-primary/5 to-accent/5"
                >
                  <div className="text-sm text-primary font-medium mb-2">{post.category}</div>
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {post.readTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> {post.author}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Regular Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {regularPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group p-6 rounded-2xl border hover:border-primary/50 hover:shadow-xl transition-all"
            >
              <div className="text-sm text-primary font-medium mb-2">{post.category}</div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                {post.title}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">{post.excerpt}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {post.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {post.readTime}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No articles found matching your criteria.</p>
          </div>
        )}

        {/* Popular Tags */}
        <div className="mb-16 p-8 rounded-2xl border bg-gradient-to-br from-background to-primary/5">
          <h2 className="text-2xl font-bold mb-4 text-center">Popular Topics</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {popularTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSearchTerm(tag)}
                className="px-4 py-2 rounded-full bg-muted hover:bg-primary/10 text-sm font-medium transition-colors"
              >
                <Tag className="w-3 h-3 inline mr-1" />
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <div className="text-center p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Get the latest AI insights, tutorials, and Intelliwave news delivered to your inbox.
          </p>
          <div className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button className="group">
              Subscribe
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}