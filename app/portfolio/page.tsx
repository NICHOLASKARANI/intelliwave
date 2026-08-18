'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight, Search, ExternalLink, TrendingUp, 
  Clock, Users, Zap, Filter, X
} from 'lucide-react'

const categories = ['All', 'AI & ML', 'Web Apps', 'Mobile', 'E-commerce', 'Enterprise', 'Cloud', 'IIoT', 'Cybersecurity']

const projects = [
  {
    title: 'AI Fraud Detection System',
    category: 'AI & ML',
    client: 'Leading Kenyan Bank',
    description: 'Real-time fraud detection processing 1M+ transactions daily with 99.7% accuracy.',
    results: ['99.7% Accuracy', '1M+ Transactions/Day', 'KSh 120M Saved Annually'],
    tech: ['Python', 'TensorFlow', 'AWS', 'PostgreSQL'],
    color: 'from-blue-600 to-cyan-600',
  },
  {
    title: 'E-Commerce Marketplace',
    category: 'E-commerce',
    client: 'Major East African Retailer',
    description: 'Multi-vendor marketplace with M-Pesa integration serving 500K+ monthly users.',
    results: ['500K+ Users', 'KSh 200M+ Transactions', '99.9% Uptime'],
    tech: ['Next.js', 'Node.js', 'M-Pesa API', 'MongoDB'],
    color: 'from-purple-600 to-pink-600',
  },
  {
    title: 'Telemedicine Platform',
    category: 'Mobile',
    client: 'Hospital Network',
    description: 'Healthcare app connecting patients with doctors across Kenya, Tanzania, Uganda.',
    results: ['100K+ Downloads', '4.8★ Rating', '50K+ Consultations'],
    tech: ['React Native', 'Firebase', 'Twilio', 'AWS'],
    color: 'from-green-600 to-emerald-600',
  },
  {
    title: 'Cloud Migration',
    category: 'Cloud',
    client: 'Government Agency',
    description: 'Complete legacy-to-cloud migration with zero downtime and 5x performance boost.',
    results: ['60% Cost Savings', 'Zero Downtime', '5x Performance'],
    tech: ['AWS', 'Docker', 'Kubernetes', 'Terraform'],
    color: 'from-orange-600 to-red-600',
  },
  {
    title: 'IIoT Predictive Maintenance',
    category: 'IIoT',
    client: 'Manufacturing Plant',
    description: 'Sensor-based predictive maintenance reducing downtime by 71% across 3 factories.',
    results: ['71% Less Downtime', 'KSh 45M Saved', 'Real-time Monitoring'],
    tech: ['IoT Sensors', 'MQTT', 'InfluxDB', 'Grafana'],
    color: 'from-yellow-600 to-orange-600',
  },
  {
    title: 'SOC Security Operations',
    category: 'Cybersecurity',
    client: 'Financial Institution',
    description: '24/7 AI-powered security operations center with real-time threat detection.',
    results: ['Zero Breaches', '24/7 Monitoring', 'SOC 2 Compliant'],
    tech: ['SIEM', 'AI Detection', 'WAF', 'IDS/IPS'],
    color: 'from-red-600 to-rose-600',
  },
  {
    title: 'LMS Platform',
    category: 'Web Apps',
    client: 'Pan-African University',
    description: 'Learning management system serving 200K+ students across 15 countries.',
    results: ['200K+ Students', '15 Countries', '98% Satisfaction'],
    tech: ['React', 'Node.js', 'PostgreSQL', 'Redis'],
    color: 'from-indigo-600 to-blue-600',
  },
  {
    title: 'ERP System',
    category: 'Enterprise',
    client: 'Manufacturing Conglomerate',
    description: 'Custom ERP managing supply chain across 5 countries with real-time analytics.',
    results: ['35% Efficiency', '5 Countries', 'Real-time Analytics'],
    tech: ['Next.js', 'GraphQL', 'PostgreSQL', 'Docker'],
    color: 'from-pink-600 to-rose-600',
  },
  {
    title: 'SaaS Analytics Dashboard',
    category: 'Cloud',
    client: 'Tech Startup',
    description: 'Real-time analytics processing data from 100+ sources with custom visuals.',
    results: ['100+ Sources', 'Real-time', 'Custom Dashboards'],
    tech: ['React', 'D3.js', 'Node.js', 'ClickHouse'],
    color: 'from-cyan-600 to-blue-600',
  },
]

export default function PortfolioPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProject, setSelectedProject] = useState<number | null>(null)

  const filtered = projects.filter(p => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory
    const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client.toLowerCase().includes(searchTerm.toLowerCase())
    return matchCat && matchSearch
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
            10,000+ successful projects delivered across 100+ countries. Enterprise-grade solutions.
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
                    ? 'bg-primary text-white shadow-lg'
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
              className="pl-10 pr-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary w-64"
            />
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filtered.map((project, index) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              className="group cursor-pointer rounded-2xl border hover:border-primary/50 hover:shadow-xl transition-all overflow-hidden"
              onClick={() => setSelectedProject(selectedProject === index ? null : index)}
            >
              <div className={`h-2 bg-gradient-to-r ${project.color}`} />
              <div className="p-6">
                <div className="text-xs text-primary font-medium mb-2">{project.category}</div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{project.title}</h3>
                <p className="text-sm text-muted-foreground mb-1">{project.client}</p>
                <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {project.tech.map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-muted rounded text-xs">{t}</span>
                  ))}
                </div>

                <AnimatePresence>
                  {selectedProject === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 pt-4 border-t"
                    >
                      {project.results.map((r) => (
                        <div key={r} className="flex items-center gap-2 text-sm text-green-600">
                          <TrendingUp className="w-4 h-4" />
                          {r}
                        </div>
                      ))}
                      <Link href="/contact" className="inline-flex items-center gap-1 text-primary text-sm font-medium mt-2 hover:underline">
                        View Case Study <ExternalLink className="w-3 h-3" />
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No projects found.</p>
            <button onClick={() => { setActiveCategory('All'); setSearchTerm('') }} className="text-primary mt-2 hover:underline">Clear filters</button>
          </div>
        )}

        {/* CTA */}
        <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border">
          <h2 className="text-3xl font-bold mb-4">Ready to Be Our Next Success Story?</h2>
          <p className="text-muted-foreground mb-6">Join 450,000+ businesses that trust IntelliWave.</p>
          <Link href="/contact">
            <Button size="lg" className="group">
              Start Your Project <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}