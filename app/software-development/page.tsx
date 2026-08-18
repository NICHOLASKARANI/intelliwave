import { Metadata } from 'next'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Code2, Cloud, Smartphone, Globe, ArrowRight, CheckCircle, Zap, Server } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Software Development Services - Custom Web & Mobile Apps | IntelliWave',
  description: 'Custom software development: web apps, mobile apps, SaaS platforms, API development. Modern tech stack.',
}

const solutions = [
  { icon: Globe, title: 'Web Applications', desc: 'Enterprise-grade web apps with Next.js, React, and TypeScript.', features: ['Responsive Design', 'SEO Optimized', 'Performance Tuned', 'WCAG Accessible'] },
  { icon: Smartphone, title: 'Mobile Apps', desc: 'Native and cross-platform apps for iOS and Android.', features: ['iOS & Android', 'Offline Support', 'Push Notifications', 'App Store Ready'] },
  { icon: Cloud, title: 'SaaS Platforms', desc: 'Multi-tenant SaaS with subscription billing and analytics.', features: ['Multi-tenant', 'Stripe/M-Pesa', 'Admin Dashboard', 'API First'] },
  { icon: Code2, title: 'API Development', desc: 'RESTful and GraphQL APIs with comprehensive documentation.', features: ['REST & GraphQL', 'Auto-documentation', 'Rate Limiting', 'Versioning'] },
]

const stats = [
  { icon: Code2, value: '500+', label: 'Developers' },
  { icon: Globe, value: '100+', label: 'Countries' },
  { icon: Zap, value: '10K+', label: 'Projects' },
]

export default function SoftwareDevelopmentPage() {
  return (
    <div className="py-20">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 text-sm font-medium mb-6"><Code2 className="w-4 h-4" /> Modern Development</div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Custom <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">Software Development</span></h1>
            <p className="text-xl text-muted-foreground mb-8">Web apps, mobile apps, and SaaS platforms built with modern technology stacks. From MVP to enterprise scale.</p>
            <Link href="/contact"><Button size="lg" className="group">Start Your Project <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" /></Button></Link>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-blue-200 shadow-2xl">
            <Image src="/images/software-development.jpg" alt="Software development team" fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 50vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white"><p className="font-semibold text-lg">Modern Software Development</p><p className="text-white/70 text-sm">Agile teams building enterprise apps</p></div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-16">
          {stats.map((s) => { const Icon = s.icon; return (<div key={s.label} className="text-center p-6 rounded-2xl border"><Icon className="w-6 h-6 text-blue-600 mx-auto mb-2" /><div className="text-3xl font-bold text-primary">{s.value}</div><div className="text-sm text-muted-foreground">{s.label}</div></div>)})}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-24">
          {solutions.map((item) => { const Icon = item.icon; return (
            <div key={item.title} className="group p-8 rounded-2xl border hover:border-blue-300 hover:shadow-xl transition-all">
              <Icon className="w-10 h-10 text-blue-600 mb-4" /><h3 className="text-xl font-bold mb-2">{item.title}</h3><p className="text-muted-foreground mb-4">{item.desc}</p>
              <div className="space-y-2">{item.features.map((f) => (<div key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" />{f}</div>))}</div>
            </div>
          )})}
        </div>

        <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white">
          <h2 className="text-3xl font-bold mb-4">Let's Build Something Great</h2>
          <p className="text-white/80 mb-6">Get a free project consultation within 24 hours.</p>
          <Link href="/contact"><Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">Get Free Consultation <ArrowRight className="ml-2" /></Button></Link>
        </div>
      </div>
    </div>
  )
}