import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { HandshakeIcon, Building2, ArrowRight, Globe } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Technology Partners - Strategic Alliances | IntelliWave',
  description: 'Strategic technology partnerships with AWS, Microsoft, Google Cloud, Stripe, and more.',
}

const partners = [
  { name: 'Amazon Web Services', type: 'Cloud Partner', tier: 'Advanced', color: 'from-orange-500 to-yellow-500' },
  { name: 'Microsoft Azure', type: 'Cloud Partner', tier: 'Gold', color: 'from-blue-500 to-cyan-500' },
  { name: 'Google Cloud', type: 'Cloud Partner', tier: 'Premier', color: 'from-red-500 to-yellow-500' },
  { name: 'Stripe', type: 'Payments Partner', tier: 'Verified', color: 'from-purple-500 to-indigo-500' },
  { name: 'M-Pesa', type: 'Payments Partner', tier: 'Integrated', color: 'from-green-500 to-emerald-500' },
  { name: 'Docker', type: 'Technology Partner', tier: 'Certified', color: 'from-blue-500 to-indigo-500' },
  { name: 'Vercel', type: 'Platform Partner', tier: 'Pro', color: 'from-gray-500 to-black' },
  { name: 'GitHub', type: 'Development Partner', tier: 'Enterprise', color: 'from-purple-500 to-gray-500' },
]

export default function PartnersPage() {
  return (
    <div className="py-20">
      <div className="container">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 text-sm font-medium mb-6">
            <HandshakeIcon className="w-4 h-4" /> Strategic Alliances
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Technology{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Partners</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Strategic partnerships with the world's leading technology companies.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {partners.map((partner) => (
            <div key={partner.name} className="p-6 rounded-2xl border hover:shadow-lg transition-all text-center">
              <div className={`h-1.5 rounded-full bg-gradient-to-r ${partner.color} mb-4`} />
              <h3 className="font-bold">{partner.name}</h3>
              <p className="text-sm text-muted-foreground">{partner.type}</p>
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 text-xs font-medium">{partner.tier}</span>
            </div>
          ))}
        </div>

        <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border">
          <h2 className="text-3xl font-bold mb-4">Become a Partner</h2>
          <Link href="/contact"><Button size="lg" className="group">Partner With Us <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" /></Button></Link>
        </div>
      </div>
    </div>
  )
}