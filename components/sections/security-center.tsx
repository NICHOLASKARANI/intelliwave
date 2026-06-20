'use client'

import { motion } from 'framer-motion'
import { Shield, Lock, Eye, Server, Database, Key, FileCheck, Cloud } from 'lucide-react'

const securityFeatures = [
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description: 'All data encrypted in transit using TLS 1.3 and at rest using AES-256. Encryption keys managed via AWS KMS with automatic rotation.',
    details: ['TLS 1.3', 'AES-256', 'Key rotation every 90 days'],
  },
  {
    icon: Eye,
    title: 'Audit Logs',
    description: 'Every action is logged with timestamps, user identification, and IP addresses. Logs are immutable and retained for 7 years.',
    details: ['Immutable logs', '7-year retention', 'Exportable to SIEM'],
  },
  {
    icon: Key,
    title: 'Role-Based Access Control',
    description: 'Granular permissions at the user, group, and resource level. Support for SSO, MFA, and custom roles.',
    details: ['SSO (SAML/OIDC)', 'MFA enforcement', 'Custom role creation'],
  },
  {
    icon: Cloud,
    title: 'Cloud Deployment',
    description: 'Deployed on AWS, Azure, or GCP with auto-scaling, load balancing, and multi-region failover.',
    details: ['Multi-cloud support', 'Auto-scaling', '99.99% uptime SLA'],
  },
  {
    icon: Server,
    title: 'Monitoring Systems',
    description: '24/7 automated monitoring with AI-powered anomaly detection. Instant alerts for security events.',
    details: ['AI threat detection', 'Real-time alerts', 'Automated response'],
  },
  {
    icon: FileCheck,
    title: 'Data Protection',
    description: 'Full compliance with Kenya DPA, GDPR, and SOC 2 Type II. Regular third-party penetration testing.',
    details: ['SOC 2 Type II', 'GDPR compliant', 'Quarterly pen tests'],
  },
]

export function SecurityCenter() {
  return (
    <section className="py-24 md:py-32 bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-950 text-green-600 text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Enterprise Security
          </span>
          <h2 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
            Security{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
              Center
            </span>
          </h2>
          <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto">
            Enterprise-grade security infrastructure protecting your data 24/7.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityFeatures.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border dark:border-neutral-800 hover:border-green-300 dark:hover:border-green-800 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-950 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">{feature.description}</p>
                <div className="flex flex-wrap gap-2">
                  {feature.details.map((detail) => (
                    <span key={detail} className="px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-600 dark:text-neutral-400">
                      {detail}
                    </span>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Trusted by Enterprises</h3>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Our security infrastructure meets the standards required by banks, healthcare providers, and government agencies.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="px-4 py-2 rounded-full bg-white/20 text-sm">SOC 2 Type II</span>
            <span className="px-4 py-2 rounded-full bg-white/20 text-sm">ISO 27001</span>
            <span className="px-4 py-2 rounded-full bg-white/20 text-sm">GDPR</span>
            <span className="px-4 py-2 rounded-full bg-white/20 text-sm">Kenya DPA</span>
          </div>
        </div>
      </div>
    </section>
  )
}