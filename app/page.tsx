'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useInView, useAnimation } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Globe, 
  Users, 
  TrendingUp, 
  Shield, 
  Cloud, 
  Code2, 
  Cpu,
  CheckCircle,
  Star,
  Clock,
  HeadphonesIcon,
  BarChart3,
  Rocket,
  ChevronRight,
  Award,
  Building2,
  Wallet,
  LineChart
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// Animated Counter Component
function AnimatedCounter({ end, duration = 2000, suffix = '', prefix = '' }: { end: number; duration?: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return

    let startTime: number
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = (timestamp - startTime) / duration

      if (progress < 1) {
        setCount(Math.floor(end * progress))
        animationFrame = requestAnimationFrame(animate)
      } else {
        setCount(end)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration, isInView])

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}

// Floating Element Component
function FloatingElement({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -20, 0],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        delay,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  )
}

const services = [
  {
    icon: Cpu,
    title: 'AI Development',
    description: 'Custom AI agents & ML models',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Globe,
    title: 'Web Development',
    description: 'Enterprise-grade websites',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Cloud,
    title: 'Cloud Infrastructure',
    description: 'Scalable cloud solutions',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Shield,
    title: 'Cybersecurity',
    description: 'Bank-grade security',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Code2,
    title: 'SaaS Platforms',
    description: 'Custom SaaS development',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: Zap,
    title: 'AI Automation',
    description: 'Intelligent automation',
    color: 'from-yellow-500 to-orange-500',
  },
]

const stats = [
  { icon: Users, value: 450000, suffix: '+', label: 'Active Users', description: 'Growing community' },
  { icon: Globe, value: 100, suffix: '+', label: 'Countries', description: 'Global presence' },
  { icon: Code2, value: 500, suffix: '+', label: 'AI Engineers', description: 'Expert team' },
  { icon: Award, value: 10000, suffix: '+', label: 'Projects Delivered', description: 'Success stories' },
]

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'CEO, TechAfrica',
    content: 'Intelliwave transformed our business with their AI solutions. The results exceeded our expectations.',
    rating: 5,
    avatar: '👩‍💼',
  },
  {
    name: 'David Mwangi',
    role: 'Founder, FinTech Kenya',
    content: 'The best software development partner in East Africa. Our fintech platform was delivered ahead of schedule.',
    rating: 5,
    avatar: '👨‍💼',
  },
  {
    name: 'Emily Chen',
    role: 'CTO, GlobalTech',
    content: 'World-class AI engineering. Their team of 500+ developers is truly impressive.',
    rating: 5,
    avatar: '👩‍🔬',
  },
]

const partners = [
  'Microsoft', 'Tesla', 'NVIDIA', 'Meta', 'SpaceX', 'GST'
]

export default function HomePage() {
  const servicesRef = useRef(null)
  const isServicesInView = useInView(servicesRef, { once: true })

  return (
    <div className="overflow-hidden">
      {/* ========== HERO SECTION ========== */}
      <section className="relative min-h-screen flex items-center">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          
          {/* Animated grid */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(0 102 255 / 0.3) 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Floating orbs */}
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl"
            animate={{
              x: [0, -100, 0],
              y: [0, 50, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/10 to-accent/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, 360],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="container relative mx-auto px-4 py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              {/* CEO & Company Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-4"
              >
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-xl border border-primary/20">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Africa&apos;s #1 AI Company</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 backdrop-blur-xl border border-green-500/20">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-green-500">500+ Developers Ready</span>
                </div>
              </motion.div>

              {/* Main Heading */}
              <div>
                <motion.h1 
                  className="font-bold text-5xl md:text-7xl lg:text-8xl leading-tight"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-accent animate-pulse-slow">
                    Engineering
                  </span>
                  <br />
                  <span className="relative">
                    the Future
                    <motion.div
                      className="absolute -bottom-2 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-accent rounded-full"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 1, duration: 0.8 }}
                    />
                  </span>
                  <br />
                  <span className="relative">
                    with AI
                    <motion.div
                      className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-accent/20 blur-xl -z-10"
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 0.8, 0.5]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                  </span>
                </motion.h1>
              </div>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-xl md:text-2xl text-muted-foreground max-w-xl"
              >
                Building Africa&apos;s Global AI Giant. Enterprise SaaS, Cloud Infrastructure, 
                AI Agents, and Custom Software Solutions.
              </motion.p>

              {/* Live Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-4 gap-4"
              >
                {stats.map((stat) => {
                  const Icon = stat.icon
                  return (
                    <div key={stat.label} className="text-center">
                      <div className="flex items-center justify-center gap-1 text-2xl md:text-3xl font-bold text-primary">
                        <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                    </div>
                  )
                })}
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link href="/contact">
                  <Button size="lg" className="group bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg relative overflow-hidden">
                    <span className="relative z-10 flex items-center">
                      Start Your Project
                      <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-primary via-blue-500 to-accent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ opacity: 0.3 }}
                    />
                  </Button>
                </Link>
                <Link href="/services">
                  <Button size="lg" variant="outline" className="px-8 py-6 text-lg backdrop-blur-xl border-2">
                    <Rocket className="mr-2" />
                    Explore Services
                  </Button>
                </Link>
              </motion.div>

              {/* Trust Badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="flex items-center gap-6 pt-4"
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full border-2 border-background bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold"
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm">
                    <span className="font-bold">4.9/5</span> rating
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Enterprise Security</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm">24/7 Support</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Side - 3D Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                {/* Main Orb */}
                <motion.div
                  className="w-[500px] h-[500px] mx-auto relative"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                >
                  {/* Outer Ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-primary/30" />
                  <motion.div
                    className="absolute inset-4 rounded-full border-2 border-accent/20"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute inset-8 rounded-full border border-primary/10"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  />

                  {/* Glowing Center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      className="w-48 h-48 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center glow"
                      animate={{
                        scale: [1, 1.1, 1],
                        boxShadow: [
                          '0 0 40px rgba(0,102,255,0.5)',
                          '0 0 80px rgba(124,58,237,0.5)',
                          '0 0 40px rgba(0,102,255,0.5)',
                        ]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <Image
                        src="/logo.png"
                        alt="Intelliwave"
                        width={120}
                        height={120}
                        className="object-contain"
                      />
                    </motion.div>
                  </div>

                  {/* Orbiting Elements */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center"
                      style={{
                        top: `${50 + 40 * Math.sin(i * 60 * Math.PI / 180)}%`,
                        left: `${50 + 40 * Math.cos(i * 60 * Math.PI / 180)}%`,
                      }}
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 360],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: i * 0.5,
                      }}
                    >
                      {i === 0 && <Zap className="w-6 h-6 text-yellow-400" />}
                      {i === 1 && <Globe className="w-6 h-6 text-blue-400" />}
                      {i === 2 && <Shield className="w-6 h-6 text-green-400" />}
                      {i === 3 && <Code2 className="w-6 h-6 text-purple-400" />}
                      {i === 4 && <Cloud className="w-6 h-6 text-cyan-400" />}
                      {i === 5 && <Cpu className="w-6 h-6 text-red-400" />}
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== PARTNERS BAR ========== */}
      <section className="py-12 border-y bg-secondary/5 backdrop-blur-xl">
        <div className="container">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-muted-foreground mb-6"
          >
            TRUSTED BY INDUSTRY LEADERS
          </motion.p>
          <div className="flex flex-wrap justify-center items-center gap-12">
            {partners.map((partner, index) => (
              <motion.div
                key={partner}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent"
              >
                {partner}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SERVICES SECTION ========== */}
      <section ref={servicesRef} className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isServicesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              Our{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Services
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive AI-powered solutions for modern enterprises
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => {
              const Icon = service.icon
              return (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isServicesInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="group relative p-6 rounded-2xl border bg-background/50 backdrop-blur-xl hover:border-primary/50 transition-all cursor-pointer overflow-hidden"
                >
                  {/* Gradient background on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} p-3 mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-full h-full text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                    <p className="text-muted-foreground mb-4">{service.description}</p>
                    <Link href="/services" className="inline-flex items-center text-primary hover:underline text-sm font-medium">
                      Learn more <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ========== WHY INTELLIWAVE ========== */}
      <section className="py-24 bg-gradient-to-b from-secondary/5 to-background">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              Why{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Intelliwave
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join more than 450,000 successful business owners who trust us
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: 'Lightning Fast', desc: 'Ultra-fast delivery with 99.9% uptime SLA' },
              { icon: Shield, title: 'Enterprise Security', desc: 'Bank-grade encryption and compliance' },
              { icon: HeadphonesIcon, title: '24/7 Support', desc: 'Round-the-clock expert assistance' },
              { icon: Wallet, title: 'Affordable Pricing', desc: 'Competitive rates starting from KSh 100K' },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-6 rounded-2xl border bg-background/50 backdrop-blur-xl hover:border-primary/50 transition-all"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <section className="py-24">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              Client{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Success Stories
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl border bg-background/50 backdrop-blur-xl hover:border-primary/50 transition-all"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6">&ldquo;{testimonial.content}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== BUYER MANDATES SECTION ========== */}
      <section className="py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                World&apos;s Largest{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                  Buyer Community
                </span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                See what buyers search for and compare trending assets and categories. 
                Join 450,000+ successful business owners making informed decisions.
              </p>
              <div className="space-y-4">
                {[
                  'Access to global buyer network',
                  'Real-time market insights',
                  'Trending asset categories',
                  'Verified investor community',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/insights" className="inline-block mt-8">
                <Button size="lg" className="group">
                  Discover Insights
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { icon: TrendingUp, label: 'Market Growth', value: '+156%' },
                { icon: Users, label: 'Active Buyers', value: '450K+' },
                { icon: BarChart3, label: 'Monthly Deals', value: '2,500+' },
                { icon: LineChart, label: 'Success Rate', value: '98%' },
              ].map((stat, index) => {
                const Icon = stat.icon
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="p-6 rounded-2xl border bg-background/50 backdrop-blur-xl text-center"
                  >
                    <Icon className="w-8 h-8 text-primary mx-auto mb-3" />
                    <div className="text-2xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== CLOSED DEALS SECTION ========== */}
      <section className="py-24">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              Recently{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Closed Deals
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Over 100,000 online acquisitions globally
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Company</th>
                  <th className="text-left p-4">Service</th>
                  <th className="text-left p-4">Value</th>
                  <th className="text-left p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { company: 'TechAfrica Ltd', service: 'AI Platform', value: 'KSh 45M', status: 'Completed' },
                  { company: 'FinTech Kenya', service: 'Mobile App', value: 'KSh 28M', status: 'Completed' },
                  { company: 'EduTech Pro', service: 'LMS System', value: 'KSh 15M', status: 'Completed' },
                  { company: 'HealthPlus', service: 'ERP System', value: 'KSh 52M', status: 'In Progress' },
                  { company: 'LogiTrans', service: 'SaaS Platform', value: 'KSh 38M', status: 'Completed' },
                ].map((deal, index) => (
                  <motion.tr
                    key={deal.company}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="border-b hover:bg-primary/5 transition-colors"
                  >
                    <td className="p-4 font-medium">{deal.company}</td>
                    <td className="p-4 text-muted-foreground">{deal.service}</td>
                    <td className="p-4 font-bold text-primary">{deal.value}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        deal.status === 'Completed' 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {deal.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ========== CTA SECTION ========== */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 animate-pulse-slow" />
        <div className="container relative text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Ready to{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Build the Future
              </span>
              ?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join 450,000+ businesses already growing with Intelliwave. 
              Our 500+ AI engineers are ready to support your project.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="bg-primary hover:bg-primary/90 px-8 py-6 text-lg group">
                  Get Free Consultation
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="https://wa.me/254714694493" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg backdrop-blur-xl">
                  <HeadphonesIcon className="mr-2" />
                  WhatsApp: +254 714 694 493
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========== BLOG PREVIEW ========== */}
      <section className="py-24">
        <div className="container">
          <div className="flex items-center justify-between mb-16">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Latest from{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                  the Blog
                </span>
              </h2>
              <p className="text-xl text-muted-foreground">
                AI insights, tutorials, and industry updates
              </p>
            </div>
            <Link href="/blog">
              <Button variant="outline" className="group">
                View All Posts
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'The Future of AI in African Enterprise', date: 'Jan 15, 2024', readTime: '5 min read' },
              { title: 'Building Scalable SaaS Platforms in 2024', date: 'Jan 10, 2024', readTime: '7 min read' },
              { title: 'Cloud Infrastructure Best Practices', date: 'Jan 5, 2024', readTime: '4 min read' },
            ].map((post, index) => (
              <motion.div
                key={post.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="group cursor-pointer"
              >
                <div className="p-6 rounded-2xl border bg-background/50 backdrop-blur-xl hover:border-primary/50 transition-all">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span>{post.date}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-4 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <Link href="/blog" className="inline-flex items-center text-primary text-sm font-medium">
                    Read More <ChevronRight className="w-4 h-4 ml-1" />
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