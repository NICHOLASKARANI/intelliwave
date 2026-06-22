import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Shield, Lock, Eye, Server, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cybersecurity Services - Enterprise Security Operations',
  description: 'Enterprise cybersecurity: SOC operations, threat monitoring, penetration testing, compliance. SOC 2 Type II certified.',
}

const services = [
  { icon: Eye, title: '24/7 Threat Monitoring', desc: 'AI-powered SOC monitoring your systems around the clock.' },
  { icon: Lock, title: 'Penetration Testing', desc: 'Regular security assessments to identify vulnerabilities.' },
  { icon: Shield, title: 'Compliance Management', desc: 'SOC 2, ISO 27001, GDPR, Kenya DPA compliance.' },
  { icon: Server, title: 'Infrastructure Security', desc: 'Cloud and on-premise security with zero-trust architecture.' },
]

export default function CybersecurityPage() {
  return (
    <div className="py-20">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-950 text-green-600 text-sm font-medium mb-6">
              <Shield className="w-4 h-4" /> SOC 2 Type II Certified
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Enterprise <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">Cybersecurity</span></h1>
            <p className="text-xl text-muted-foreground mb-8">Bank-grade security with AI-powered threat detection, 24/7 monitoring, and compliance management.</p>
            <Link href="/contact"><Button size="lg" className="group">Request Security Audit <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" /></Button></Link>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border shadow-2xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
            <Shield className="w-32 h-32 text-white/30" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <p className="font-semibold text-lg">Enterprise Security Operations</p>
              <p className="text-white/70 text-sm">24/7 AI-powered threat monitoring</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-24">
          {services.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="p-8 rounded-2xl border hover:border-green-300 transition-all">
                <Icon className="w-10 h-10 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            )
          })}
        </div>

        <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-green-600 to-emerald-600 text-white">
          <h2 className="text-3xl font-bold mb-4">Protect Your Enterprise Today</h2>
          <p className="text-white/80 mb-6">Get a comprehensive security assessment from our certified team.</p>
          <Link href="/contact"><Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">Get Security Assessment <ArrowRight className="ml-2" /></Button></Link>
        </div>
      </div>
    </div>
  )
}