import { Metadata } from 'next'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Shield, Lock, Eye, Server, ArrowRight, CheckCircle, Zap, Globe } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cybersecurity Services - Enterprise Security Operations | IntelliWave',
  description: 'Enterprise cybersecurity: SOC operations, 24/7 threat monitoring, penetration testing, compliance. SOC 2 Type II certified.',
}

const services = [
  { icon: Eye, title: '24/7 Threat Monitoring', desc: 'AI-powered SOC monitoring your systems with real-time anomaly detection and instant alerts.', features: ['AI Detection', 'Real-time Alerts', 'Auto Response', 'SIEM Integration'] },
  { icon: Lock, title: 'Penetration Testing', desc: 'Quarterly security assessments to identify and fix vulnerabilities before attackers exploit them.', features: ['Web App Testing', 'Network Testing', 'API Security', 'Social Engineering'] },
  { icon: Shield, title: 'Compliance Management', desc: 'SOC 2, ISO 27001, GDPR, Kenya DPA compliance auditing and implementation support.', features: ['SOC 2 Type II', 'ISO 27001', 'GDPR', 'Kenya DPA 2019'] },
  { icon: Server, title: 'Infrastructure Security', desc: 'Cloud and on-premise security with zero-trust architecture, WAF, and DDoS protection.', features: ['Zero Trust', 'WAF Active', 'DDoS Protected', 'Network Segmentation'] },
]

const stats = [
  { icon: Shield, value: 'Zero', label: 'Security Breaches' },
  { icon: Globe, value: '24/7', label: 'Monitoring' },
  { icon: Zap, value: '<1min', label: 'Alert Response' },
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
            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              Enterprise{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">Cybersecurity</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Bank-grade security with AI-powered threat detection, 24/7 monitoring, and compliance management for enterprises across Africa.
            </p>
            <div className="flex gap-4">
              <Link href="/contact"><Button size="lg" className="group">Request Security Audit <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" /></Button></Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-green-200 dark:border-green-800 shadow-2xl">
            <Image src="/images/cybersecurity.jpg" alt="Enterprise security operations center with threat monitoring" fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 50vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-green-900/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <p className="font-semibold text-lg">Enterprise Security Operations</p>
              <p className="text-white/70 text-sm">24/7 AI-powered threat monitoring</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-16">
          {stats.map((s) => { const Icon = s.icon; return (
            <div key={s.label} className="text-center p-6 rounded-2xl border bg-background/50"><Icon className="w-6 h-6 text-green-600 mx-auto mb-2" /><div className="text-3xl font-bold text-primary">{s.value}</div><div className="text-sm text-muted-foreground mt-1">{s.label}</div></div>
          )})}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-24">
          {services.map((item) => { const Icon = item.icon; return (
            <div key={item.title} className="group p-8 rounded-2xl border hover:border-green-300 hover:shadow-xl transition-all">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 p-3 mb-4 group-hover:scale-110 transition-transform"><Icon className="w-full h-full text-white" /></div>
              <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
              <p className="text-muted-foreground mb-6">{item.desc}</p>
              <div className="flex flex-wrap gap-2">{item.features.map((f) => (<span key={f} className="px-2 py-1 rounded-md bg-green-50 dark:bg-green-950 text-green-700 text-xs font-medium">{f}</span>))}</div>
            </div>
          )})}
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