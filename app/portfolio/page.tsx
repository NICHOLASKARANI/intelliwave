'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  ArrowRight, Search, TrendingUp, Sparkles, Globe,
  Shield, Rocket, Award, Star, X
} from 'lucide-react'

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

  return <div ref={ref} className="inline-flex">{prefix}{count.toLocaleString()}{suffix}</div>
}

const categories = ['All', 'AI & ML', 'Web Apps', 'Mobile', 'E-commerce', 'Enterprise', 'Cloud', 'IIoT', 'Cybersecurity', 'ERP']

const projects = [
  { id: 1, title: 'WaveCore ERP Platform', category: 'ERP', client: 'IntelliWavve', description: 'AI-Native Multi-Tenant ERP serving 450K+ businesses.', results: ['450K+ Businesses', '14 Modules', '99.99% Uptime'], tech: ['Next.js', 'PostgreSQL', 'Neon'], color: 'from-indigo-600 to-purple-600', featured: true },
  { id: 2, title: 'AI Fraud Detection', category: 'AI & ML', client: 'Leading Kenyan Bank', description: 'Real-time fraud detection 1M+ daily transactions.', results: ['99.7% Accuracy', '1M+ Transactions'], tech: ['Python', 'TensorFlow'], color: 'from-blue-600 to-cyan-600', featured: true },
  { id: 3, title: 'WavveMarket', category: 'E-commerce', client: 'IntelliWavve', description: 'Facebook-style marketplace with 32 categories.', results: ['32 Categories', 'Real-time Chat'], tech: ['Next.js', 'PostgreSQL'], color: 'from-pink-600 to-rose-600', featured: true },
  { id: 4, title: 'WavveRide', category: 'Mobile', client: 'IntelliWavve', description: 'Bolt-style ride hailing with Boda, Car, Delivery.', results: ['3 Ride Types', 'GPS Tracking'], tech: ['Next.js', 'Geolocation'], color: 'from-green-600 to-emerald-600', featured: false },
  { id: 5, title: 'Telemedicine Platform', category: 'Mobile', client: 'Hospital Network', description: 'Connecting patients with doctors across Africa.', results: ['100K+ Downloads', '4.8★ Rating'], tech: ['React Native', 'Firebase'], color: 'from-teal-600 to-emerald-600', featured: false },
  { id: 6, title: 'Enterprise Security', category: 'Cybersecurity', client: 'Financial Institution', description: 'SOC 2 Type II security platform.', results: ['SOC 2 Type II', 'Zero Breaches'], tech: ['Python', 'SIEM'], color: 'from-red-600 to-orange-600', featured: false },
]

export default function PortfolioPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProject, setSelectedProject] = useState<any>(null)

  const filteredProjects = projects.filter(project => {
    const matchesCategory = activeCategory === 'All' || project.category === activeCategory
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-neutral-950 relative overflow-hidden">
      {/* Starry Orbiting Background */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: Math.random() * 3 + 1 + 'px', height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + '%', left: Math.random() * 100 + '%',
              animationDuration: Math.random() * 3 + 2 + 's', animationDelay: Math.random() * 2 + 's',
              opacity: Math.random() * 0.5 + 0.3,
            }} />
        ))}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-indigo-500/20 rounded-full animate-spin" style={{ animationDuration: '60s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-purple-500/10 rounded-full animate-spin" style={{ animationDuration: '80s', animationDirection: 'reverse' }} />
      </div>

      {/* Hero */}
      <section className="relative py-20 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm mb-6">
            <Award className="w-4 h-4 text-amber-400" /> World-Class Portfolio
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6">
            Our <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Work</span>
          </h1>
          <p className="text-xl text-neutral-300 mb-10">Enterprise projects trusted by 450,000+ businesses</p>
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input type="text" placeholder="Search projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-400 text-lg" />
          </div>
        </div>
      </section>

      {/* Animated Stats */}
      <section className="relative py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center"><Rocket className="w-8 h-8 text-indigo-400 mx-auto mb-3" /><p className="text-3xl font-extrabold text-white"><AnimatedCounter end={2500} suffix="+" /></p><p className="text-sm text-neutral-400">Projects</p></div>
            <div className="text-center"><Star className="w-8 h-8 text-amber-400 mx-auto mb-3" /><p className="text-3xl font-extrabold text-white"><AnimatedCounter end={99} suffix=".7%" /></p><p className="text-sm text-neutral-400">Satisfaction</p></div>
            <div className="text-center"><Globe className="w-8 h-8 text-blue-400 mx-auto mb-3" /><p className="text-3xl font-extrabold text-white"><AnimatedCounter end={100} suffix="+" /></p><p className="text-sm text-neutral-400">Countries</p></div>
            <div className="text-center"><TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-3" /><p className="text-3xl font-extrabold text-white"><AnimatedCounter end={5} prefix="KSh " suffix="B+" /></p><p className="text-sm text-neutral-400">Revenue</p></div>
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
                  activeCategory === category ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'bg-white/10 text-neutral-300 hover:bg-white/20'
                }`}>
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="relative py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map(project => (
              <motion.div key={project.id} whileHover={{ y: -8 }} onClick={() => setSelectedProject(project)}
                className="bg-white/5 rounded-3xl overflow-hidden border border-white/10 cursor-pointer">
                <div className={`h-32 bg-gradient-to-br ${project.color} flex items-center justify-center`}>
                  {project.featured && <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold flex items-center gap-1"><Star className="w-3 h-3" /> Featured</span>}
                </div>
                <div className="p-6">
                  <span className="text-xs font-bold text-indigo-400">{project.category}</span>
                  <h3 className="text-xl font-bold text-white mt-2">{project.title}</h3>
                  <p className="text-sm text-neutral-400 mt-1">{project.client}</p>
                  <p className="text-neutral-300 mt-3 text-sm">{project.description}</p>
                  <div className="mt-4 space-y-1.5">
                    {project.results.map(result => (
                      <div key={result} className="flex items-center gap-2 text-sm text-green-400">
                        <TrendingUp className="w-3.5 h-3.5" /> {result}
                      </div>
                    ))}
                  </div>
                  <Link href="/contact" className="mt-4 flex items-center gap-1 text-indigo-400 font-medium hover:gap-2 transition-all text-sm">
                    Learn More <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}