'use client'

import { motion } from 'framer-motion'
import { 
  Shield, Lock, Key, Server, Cloud, Eye, 
  FileCheck, Database, Globe, Zap 
} from 'lucide-react'

const trustFeatures = [
  { icon: Shield, title: 'Enterprise Security', desc: 'SOC 2 Type II certified infrastructure' },
  { icon: Lock, title: 'Data Encryption', desc: 'AES-256 encryption at rest and in transit' },
  { icon: Key, title: 'Multi-Factor Auth', desc: 'MFA, SSO, and biometric authentication' },
  { icon: Server, title: 'Zero Trust Architecture', desc: 'Never trust, always verify' },
  { icon: Cloud, title: 'Disaster Recovery', desc: '30-minute RTO with multi-region failover' },
  { icon: Eye, title: 'Continuous Monitoring', desc: '24/7 AI-powered threat detection' },
  { icon: FileCheck, title: 'Compliance Ready', desc: 'GDPR, ISO 27001, Kenya DPA' },
  { icon: Database, title: 'Automated Backups', desc: 'Daily backups with point-in-time recovery' },
  { icon: Globe, title: 'High Availability', desc: '99.99% uptime SLA guarantee' },
  { icon: Zap, title: 'Scalable Infrastructure', desc: 'Auto-scaling to handle any workload' },
]

export function EnterpriseTrust() {
  return (
    <section className="py-24 bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-950 text-green-600 text-sm font-medium mb-6">
            <Shield className="w-4 h-4" /> Enterprise Trust Center
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-4">
            Built for{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">Enterprise</span>
          </h2>
          <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto">
            Bank-grade security, compliance, and reliability trusted by governments and Fortune 500 companies.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          {trustFeatures.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                className="p-6 rounded-2xl border hover:border-green-300 dark:hover:border-green-800 hover:shadow-lg transition-all text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-950 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-sm mb-1">{feature.title}</h3>
                <p className="text-xs text-muted-foreground">{feature.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}