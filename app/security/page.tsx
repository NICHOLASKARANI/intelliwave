import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Shield, Lock, Eye, Server, Key, FileCheck, Cloud, 
  Globe, Users, ArrowRight, CheckCircle, AlertTriangle 
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Security Center - Enterprise Security & Compliance | IntelliWave',
  description: 'SOC 2 Type II certified. ISO 27001. GDPR compliant. AES-256 encryption. 24/7 threat monitoring. Enterprise security infrastructure.',
}

const securityFeatures = [
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description: 'TLS 1.3 in transit, AES-256 at rest. Keys managed via AWS KMS with automatic 90-day rotation.',
    details: ['TLS 1.3', 'AES-256', 'Auto Key Rotation'],
  },
  {
    icon: Eye,
    title: '24/7 Threat Monitoring',
    description: 'AI-powered SIEM with real-time anomaly detection. Instant alerts for security events.',
    details: ['AI Detection', 'Real-time Alerts', 'Auto Response'],
  },
  {
    icon: Key,
    title: 'Role-Based Access Control',
    description: 'Granular permissions. SSO (SAML/OIDC). MFA enforcement. Custom roles.',
    details: ['SSO Support', 'MFA Required', 'Custom Roles'],
  },
  {
    icon: Server,
    title: 'Infrastructure Security',
    description: 'Cloud-native with AWS WAF, DDoS protection, and network segmentation.',
    details: ['WAF Active', 'DDoS Protected', 'Segmented Network'],
  },
  {
    icon: FileCheck,
    title: 'Compliance & Audits',
    description: 'SOC 2 Type II, ISO 27001, GDPR, Kenya DPA. Quarterly penetration testing.',
    details: ['SOC 2', 'ISO 27001', 'GDPR', 'Kenya DPA'],
  },
  {
    icon: Cloud,
    title: 'Disaster Recovery',
    description: 'Multi-region failover. 30-minute RTO. Daily automated backups.',
    details: ['Multi-Region', '30min RTO', 'Daily Backups'],
  },
]

const complianceBadges = [
  { name: 'SOC 2 Type II', status: 'Certified', color: 'text-green-500' },
  { name: 'ISO 27001', status: 'Certified', color: 'text-blue-500' },
  { name: 'GDPR', status: 'Compliant', color: 'text-purple-500' },
  { name: 'Kenya DPA 2019', status: 'Compliant', color: 'text-orange-500' },
  { name: 'PCI DSS', status: 'Compliant', color: 'text-yellow-500' },
]

export default function SecurityPage() {
  return (
    <div className="py-20">
      <div className="container">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-950 text-green-600 text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Enterprise Security Center
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Security{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
              Center
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Bank-grade security protecting your data. SOC 2 Type II certified. 24/7 monitoring.
          </p>
        </div>

        {/* Compliance Badges */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {complianceBadges.map((badge) => (
            <div key={badge.name} className="flex items-center gap-2 px-5 py-3 rounded-full bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
              <CheckCircle className={`w-5 h-5 ${badge.color}`} />
              <span className="font-medium text-sm">{badge.name}</span>
              <span className={`text-xs ${badge.color}`}>{badge.status}</span>
            </div>
          ))}
        </div>

        {/* Security Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {securityFeatures.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="p-6 rounded-2xl border hover:border-green-300 dark:hover:border-green-800 transition-all">
                <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-950 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
                <div className="flex flex-wrap gap-2">
                  {feature.details.map((d) => (
                    <span key={d} className="px-2 py-1 rounded-md bg-muted text-xs">{d}</span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Trust Section */}
        <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-green-600 to-emerald-600 text-white mb-16">
          <Shield className="w-16 h-16 mx-auto mb-6 text-white/80" />
          <h2 className="text-3xl font-bold mb-4">Your Data is Safe With Us</h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Our security infrastructure meets the standards required by banks, healthcare providers, and government agencies.
          </p>
          <Link href="/contact">
            <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">
              Request Security Assessment <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </div>

        {/* Report Vulnerability */}
        <div className="p-8 rounded-2xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30 text-center">
          <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
          <h3 className="text-xl font-bold mb-2">Report a Vulnerability</h3>
          <p className="text-muted-foreground mb-4">
            If you discover a security vulnerability, please email us immediately.
          </p>
          <a href="mailto:intelliwavehr@gmail.com" className="text-primary font-bold hover:underline">
            intelliwavehr@gmail.com
          </a>
        </div>
      </div>
    </div>
  )
}