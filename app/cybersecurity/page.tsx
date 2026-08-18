import { Metadata } from 'next'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Shield, Lock, Eye, Server, ArrowRight, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cybersecurity Services - Enterprise Security Operations & Threat Protection',
  description: 'Enterprise cybersecurity services including SOC operations, threat monitoring, penetration testing, and compliance. SOC 2 Type II certified.',
}

const services = [
  {
    icon: Eye,
    title: '24/7 Threat Monitoring',
    description: 'AI-powered security operations center monitoring your systems around the clock.',
  },
  {
    icon: Lock,
    title: 'Penetration Testing',
    description: 'Regular security assessments to identify and fix vulnerabilities before attackers do.',
  },
  {
    icon: Shield,
    title: 'Compliance Management',
    description: 'SOC 2, ISO 27001, GDPR, and Kenya DPA compliance auditing and implementation.',
  },
  {
    icon: Server,
    title: 'Infrastructure Security',
    description: 'Cloud and on-premise security architecture with zero-trust principles.',
  },
]

export default function CybersecurityPage() {
  return (
    <div className="py-20">
      <div className="container">
        {/* Hero */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-950 text-green-600 text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              SOC 2 Type II Certified
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              Enterprise{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
                Cybersecurity
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Bank-grade security operations with AI-powered threat detection, 24/7 monitoring, 
              and compliance management for enterprises.
            </p>
            <Link href="/contact">
              <Button size="lg" className="group">
                Request Security Audit
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border shadow-2xl">
            <Image
              src="/images/cybersecurity.jpg"
              alt="Enterprise security operations center with threat monitoring dashboard"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="text-white font-semibold text-lg">Enterprise Security Operations</p>
              <p className="text-white/70 text-sm">24/7 AI-powered threat monitoring</p>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="grid md:grid-cols-2 gap-6 mb-24">
          {services.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="p-8 rounded-2xl border hover:border-green-300 dark:hover:border-green-800 transition-all">
                <Icon className="w-10 h-10 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-green-600 to-emerald-600 text-white">
          <h2 className="text-3xl font-bold mb-4">Protect Your Enterprise Today</h2>
          <p className="text-white/80 mb-6">Get a comprehensive security assessment from our certified team.</p>
          <Link href="/contact">
            <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">
              Get Security Assessment
              <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}