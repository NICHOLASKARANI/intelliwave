'use client'

import { Metadata } from 'next'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, ExternalLink, Search } from 'lucide-react'

const categories = ['All', 'AI Development', 'Web Development', 'Mobile Apps', 'E-commerce', 'Enterprise', 'Cloud']

const projects = [
  {
    title: 'Enterprise AI Platform',
    category: 'AI Development',
    client: 'Fortune 500 Financial Institution',
    description: 'Custom AI-powered fraud detection system processing 1M+ transactions daily with 99.7% accuracy.',
    results: ['40% cost reduction', '99.7% accuracy', '1M+ daily transactions'],
    technologies: ['Python', 'TensorFlow', 'AWS', 'PostgreSQL'],
  },
  {
    title: 'E-commerce Marketplace',
    category: 'E-commerce',
    client: 'Major East African Retailer',
    description: 'Multi-vendor marketplace with M-Pesa integration serving 500K+ monthly active users.',
    results: ['500K+ users', 'KSh 200M+ transactions', '99.9% uptime'],
    technologies: ['Next.js', 'Node.js', 'M-Pesa API', 'MongoDB'],
  },
  {
    title: 'Healthcare Mobile App',
    category: 'Mobile Apps',
    client: 'Leading Hospital Network',
    description: 'Telemedicine platform connecting patients with doctors across Kenya, Tanzania, and Uganda.',
    results: ['100K+ downloads', '4.8★ rating', '50K+ consultations'],
    technologies: ['React Native', 'Firebase', 'Twilio', 'AWS'],
  },
  {
    title: 'Cloud Migration Project',
    category: 'Cloud',
    client: 'Government Agency',
    description: 'Complete cloud migration of legacy systems to AWS with zero downtime.',
    results: ['60% cost savings', 'Zero downtime', '5x performance'],
    technologies: ['AWS', 'Docker', 'Kubernetes', 'Terraform'],
  },
  {
    title: 'LMS Platform',
    category: 'Web Development',
    client: 'Pan-African University',
    description: 'Learning management system serving 200K+ students across 15 African countries.',
    results: ['200K+ students', '15 countries', '98% satisfaction'],
    technologies: ['React', 'Node.js', 'PostgreSQL', 'Redis'],
  },
  {
    title: 'FinTech Mobile App',
    category: 'Mobile Apps',
    client: 'Digital Bank',
    description: 'Mobile banking app with AI-powered financial advice and instant M-Pesa integration.',
    results: ['1M+ downloads', '4.9★ rating', 'KSh 1B+ processed'],
    technologies: ['Flutter', 'Python', 'M-Pesa API', 'AWS Lambda'],
  },
  {
    title: 'ERP System',
    category: 'Enterprise',
    client: 'Manufacturing Conglomerate',
    description: 'Custom ERP system managing supply chain across 5 countries with real-time analytics.',
    results: ['35% efficiency gain', '5 countries', 'Real-time analytics'],
    technologies: ['Next.js', 'GraphQL', 'PostgreSQL', 'Docker'],
  },
  {
    title: 'AI Chatbot Platform',
    category: 'AI Development',
    client: 'Telecom Provider',
    description: 'AI-powered customer service chatbot handling 500K+ queries monthly in English and Swahili.',
    results: ['500K+ queries/month', '80% automation', 'English & Swahili'],
    technologies: ['Python', 'NLP', 'TensorFlow', 'AWS Bedrock'],
  },
  {
    title: 'SaaS Analytics Dashboard',
    category: 'Web Development',
    client: 'Tech Startup',
    description: 'Real-time analytics dashboard processing data from 100+ sources with custom visualizations.',
    results: ['100+ data sources', 'Real-time processing', 'Custom visualizations'],
    technologies: ['React', 'D3.js', 'Node.js', 'ClickHouse'],
  },
]

export default function PortfolioPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredProjects = projects.filter((project) => {
    const matchesCategory = activeCategory === 'All' || project.category === activeCategory
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="py-20">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Our{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Portfolio
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Showcasing 10,000+ successful projects delivered to clients across 100+ countries. 
            From startups to Fortune 500 companies.
          </p>
        </div>

        {/* Filters */}
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
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary w-64"
            />
          </div>
        </div>

        {/* Project Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredProjects.map((project) => (
            <div
              key={project.title}
              className="group p-6 rounded-2xl border hover:border-primary/50 hover:shadow-xl transition-all"
            >
              <div className="text-sm text-primary font-medium mb-2">{project.category}</div>
              <h3 className="text-xl font-bold mb-2">{project.title}</h3>
              <p className="text-sm text-muted-foreground mb-1">{project.client}</p>
              <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
              
              <div className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">KEY RESULTS:</p>
                <div className="flex flex-wrap gap-2">
                  {project.results.map((result) => (
                    <span key={result} className="px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded-full">
                      {result}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">TECH STACK:</p>
                <div className="flex flex-wrap gap-1">
                  {project.technologies.map((tech) => (
                    <span key={tech} className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <Link
                href="/contact"
                className="inline-flex items-center gap-1 text-primary text-sm font-medium hover:underline"
              >
                View Case Study <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No projects found matching your criteria.</p>
          </div>
        )}

        {/* CTA */}
        <div className="text-center p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border">
          <h2 className="text-3xl font-bold mb-4">Ready to Be Our Next Success Story?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join 450,000+ businesses that trust Intelliwave for their software development needs.
          </p>
          <Link href="/contact">
            <Button size="lg" className="group">
              Start Your Project
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}