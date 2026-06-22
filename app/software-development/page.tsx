import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Code2, Cloud, Smartphone, Globe, ArrowRight, CheckCircle, Zap, Server } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Software Development Services - Custom Web & Mobile Apps',
  description: 'Custom software development: web apps, mobile apps, SaaS platforms, API development. Modern tech stack.',
}

const solutions = [
  { icon: Globe, title: 'Web Applications', desc: 'Enterprise-grade web apps with Next.js, React, TypeScript.', features: ['Responsive', 'SEO Optimized', 'Performance Tuned', 'Accessible'] },
  { icon: Smartphone, title: 'Mobile Apps', desc: 'Native and cross-platform apps for iOS and Android.', features: ['iOS & Android', 'Offline Support', 'Push Notifications', 'App Store Ready'] },
  { icon: Cloud, title: 'SaaS Platforms', desc: 'Multi-tenant SaaS with subscription billing.', features: ['Multi-tenant', 'Stripe/M-Pesa', 'Admin Dashboard', 'API First'] },
  { icon: Code2, title: 'API Development', desc: 'RESTful and GraphQL APIs with documentation.', features: ['REST & GraphQL', 'Auto-docs', 'Rate Limiting', 'Versioning'] },
]

export default function SoftwareDevelopmentPage() {
  return (
    <div className="py-20">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 text-sm font-medium mb-6">
              <Code2 className="w-4 h-4" /> Modern Development
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Custom <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">Software Development</span></h1>
            <p className="text-xl text-muted-foreground mb-8">Web apps, mobile apps, and SaaS platforms built with modern stacks. From MVP to enterprise scale.</p>
            <Link href="/contact"><Button size="lg" className="group">Start Your Project <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" /></Button></Link>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border shadow-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
            <Code2 className="w-32 h-32 text-white/30" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <p className="font-semibold text-lg">Modern Software Development</p>
              <p className="text-white/70 text-sm">Agile teams building enterprise applications</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-24">
          {solutions.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="p-8 rounded-2xl border hover:border-blue-300 transition-all">
                <Icon className="w-10 h-10 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground mb-4">{item.desc}</p>
                <div className="space-y-2">
                  {item.features.map((f) => (<div key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" />{f}</div>))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white">
          <h2 className="text-3xl font-bold mb-4">Let&apos;s Build Something Great</h2>
          <p className="text-white/80 mb-6">Get a free project consultation and estimate within 24 hours.</p>
          <Link href="/contact"><Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">Get Free Consultation <ArrowRight className="ml-2" /></Button></Link>
        </div>
      </div>
    </div>
  )
}