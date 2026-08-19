'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ArrowRight, Search, ExternalLink, TrendingUp,
  Clock, Users, Zap, Filter, X, Sparkles, Globe,
  Shield, Rocket, Award, BarChart3, Star
} from 'lucide-react'

const categories = ['All', 'AI & ML', 'Web Apps', 'Mobile', 'E-commerce', 'Enterprise', 'Cloud', 'IIoT', 'Cybersecurity', 'ERP']

const projects = [
  {
    id: 1,
    title: 'WaveCore ERP Platform',
    category: 'ERP',
    client: 'IntelliWavve (Internal)',
    description: 'AI-Native Multi-Tenant ERP serving 450K+ businesses. KSh 500/month subscription with M-Pesa integration.',
    results: ['450K+ Businesses', '14 Modules', '99.99% Uptime', 'KSh 500/mo Subscription'],
    tech: ['Next.js', 'PostgreSQL', 'Neon', 'Vercel', 'AI Copilot'],
    color: 'from-indigo-600 to-purple-600',
    featured: true,
  },
  {
    id: 2,
    title: 'AI Fraud Detection System',
    category: 'AI & ML',
    client: 'Leading Kenyan Bank',
    description: 'Real-time fraud detection processing 1M+ transactions daily with 99.7% accuracy.',
    results: ['99.7% Accuracy', '1M+ Transactions/Day', 'KSh 120M Saved Annually'],
    tech: ['Python', 'TensorFlow', 'AWS', 'PostgreSQL'],
    color: 'from-blue-600 to-cyan-600',
    featured: true,
  },
  {
    id: 3,
    title: 'WavveMarket - Marketplace Platform',
    category: 'E-commerce',
    client: 'IntelliWavve (Internal)',
    description: 'Facebook-style marketplace with 32 categories, buyer/seller chat, and M-Pesa integration.',
    results: ['32 Categories', 'Real-time Chat', 'M-Pesa Payments'],
    tech: ['Next.js', 'PostgreSQL', 'WebSocket'],
    color: 'from-pink-600 to-rose-600',
    featured: true,
  },
  {
    id: 4,
    title: 'WavveRide - Ride Hailing',
    category: 'Mobile',
    client: 'IntelliWavve (Internal)',
    description: 'Bolt-style ride hailing with Boda, Car, and Delivery options. GPS tracking and M-Pesa.',
    results: ['3 Ride Types', 'GPS Tracking', 'M-Pesa Payments'],
    tech: ['Next.js', 'Geolocation', 'PostgreSQL'],
    color: 'from-green-600 to-emerald-600',
    featured: false,
  },
  {
    id: 5,
    title: 'Telemedicine Platform',
    category: 'Mobile',
    client: 'Hospital Network',
    description: 'Healthcare app connecting patients with doctors across Kenya, Tanzania, Uganda.',
    results: ['100K+ Downloads', '4.8★ Rating', '50K+ Consultations'],
    tech: ['React Native', 'Firebase', 'Twilio', 'AWS'],
    color: 'from-teal-600 to-emerald-600',
    featured: false,
  },
  {
    id: 6,
    title: 'Enterprise Security Suite',
    category: 'Cybersecurity',
    client: 'Financial Institution',
    description: 'SOC 2 Type II compliant security platform with real-time threat detection.',
    results: ['SOC 2 Type II', 'ISO 27001', 'Zero Breaches'],
    tech: ['Python', 'SIEM', 'Blockchain'],
    color: 'from-red-600 to-orange-600',
    featured: false,
  },
]

const stats = [
  { label: 'Projects Delivered', value: '2,500+', icon: Rocket },
  { label: 'Client Satisfaction', value: '99.7%', icon: Star },
  { label: 'Countries Served', value: '100+', icon: Globe },
  { label: 'Revenue Generated', value: 'KSh 5B+', icon: TrendingUp },
]

export default function PortfolioPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProject, setSelectedProject] = useState<any>(null)

  const filteredProjects = projects.filter(project => {
    const matchesCategory = activeCategory === 'All' || project.category === activeCategory
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          project.client.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-indigo-950 to-purple-950" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-96 h-96 bg-indigo-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm mb-6">
              <Award className="w-4 h-4 text-amber-400" /> World-Class Portfolio
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6">
              Our <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Work</span>
            </h1>
            <p className="text-xl text-neutral-300 max-w-2xl mx-auto mb-10">
              Enterprise projects trusted by 450,000+ businesses across 100+ countries
            </p>
            
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-400 text-lg"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map(stat => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="text-center">
                  <Icon className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
                  <p className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">{stat.value}</p>
                  <p className="text-sm text-neutral-500">{stat.label}</p>
                </div>
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
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white dark:bg-neutral-900 text-neutral-600 hover:bg-neutral-100'
                }`}>
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map(project => (
              <motion.div key={project.id} whileHover={{ y: -8 }}
                className="bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl cursor-pointer"
                onClick={() => setSelectedProject(project)}>
                <div className={`h-40 bg-gradient-to-br ${project.color} flex items-center justify-center`}>
                  {project.featured && (
                    <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold flex items-center gap-1">
                      <Star className="w-3 h-3" /> Featured
                    </span>
                  )}
                </div>
                <div className="p-6">
                  <span className="text-xs font-bold text-indigo-500">{project.category}</span>
                  <h3 className="text-xl font-bold mt-2">{project.title}</h3>
                  <p className="text-sm text-neutral-500 mt-1">{project.client}</p>
                  <p className="text-neutral-600 dark:text-neutral-300 mt-3 text-sm">{project.description}</p>
                  
                  <div className="mt-4 space-y-1.5">
                    {project.results.map(result => (
                      <div key={result} className="flex items-center gap-2 text-sm text-green-600">
                        <TrendingUp className="w-3.5 h-3.5" /> {result}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.tech.map(tech => (
                      <span key={tech} className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Project Modal */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedProject(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white dark:bg-neutral-900 rounded-3xl max-w-2xl w-full p-8"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{selectedProject.title}</h2>
                <button onClick={() => setSelectedProject(null)} className="p-2 rounded-xl hover:bg-neutral-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-neutral-500 mb-4">{selectedProject.client}</p>
              <p className="mb-6">{selectedProject.description}</p>
              <div className="space-y-2 mb-6">
                {selectedProject.results.map(result => (
                  <div key={result} className="flex items-center gap-2 text-green-600">
                    <TrendingUp className="w-4 h-4" /> {result}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedProject.tech.map(tech => (
                  <span key={tech} className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium">
                    {tech}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}