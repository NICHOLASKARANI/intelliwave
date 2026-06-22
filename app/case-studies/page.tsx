import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, TrendingDown, TrendingUp, Clock, DollarSign, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Case Studies - Detailed Project Breakdowns | IntelliWave',
  description: 'Detailed case studies showing project challenges, solutions, and measurable results.',
}

const caseStudies = [
  {
    company: 'Leading Kenyan Bank', industry: 'Financial Services',
    challenge: 'Manual fraud detection missing 40% of cases with 45-min average response time.',
    solution: 'AI-powered real-time fraud detection system processing 1M+ transactions daily.',
    results: [
      { icon: TrendingUp, value: '99.7%', label: 'Detection Rate' },
      { icon: Clock, value: '<10ms', label: 'Response Time' },
      { icon: DollarSign, value: 'KSh 120M', label: 'Saved Annually' },
    ],
    color: 'from-blue-600 to-cyan-600',
  },
  {
    company: 'East African Manufacturer', industry: 'Manufacturing',
    challenge: '120 hours/month downtime from reactive maintenance across 3 factories.',
    solution: 'IIoT predictive maintenance with real-time sensor monitoring and AI alerts.',
    results: [
      { icon: TrendingDown, value: '-71%', label: 'Downtime Reduction' },
      { icon: DollarSign, value: 'KSh 45M', label: 'Annual Savings' },
      { icon: TrendingUp, value: '+40%', label: 'Productivity Gain' },
    ],
    color: 'from-green-600 to-emerald-600',
  },
  {
    company: 'Pan-African Logistics', industry: 'Logistics',
    challenge: '25% delivery delays and 15% fuel wastage across 500+ vehicle fleet.',
    solution: 'AI route optimization and fleet management with real-time GPS tracking.',
    results: [
      { icon: TrendingDown, value: '-92%', label: 'Delivery Delays' },
      { icon: DollarSign, value: 'KSh 28M', label: 'Fuel Savings' },
      { icon: TrendingUp, value: '98%', label: 'On-Time Rate' },
    ],
    color: 'from-purple-600 to-pink-600',
  },
]

export default function CaseStudiesPage() {
  return (
    <div className="py-20">
      <div className="container">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Detailed{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Case Studies</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            In-depth breakdowns of how we solved complex enterprise challenges.
          </p>
        </div>

        <div className="space-y-8">
          {caseStudies.map((study) => (
            <div key={study.company} className="rounded-3xl border overflow-hidden">
              <div className={`p-8 bg-gradient-to-br ${study.color} text-white`}>
                <h3 className="text-2xl font-bold">{study.company}</h3>
                <p className="text-white/70">{study.industry}</p>
              </div>
              <div className="p-8 grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold text-red-500 mb-2">❌ Challenge</h4>
                  <p className="text-muted-foreground">{study.challenge}</p>
                  <h4 className="font-bold text-green-500 mt-4 mb-2">✅ Solution</h4>
                  <p className="text-muted-foreground">{study.solution}</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {study.results.map((r) => {
                    const Icon = r.icon
                    return (
                      <div key={r.label} className="text-center p-4 rounded-xl bg-muted/50">
                        <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                        <div className="text-2xl font-bold text-primary">{r.value}</div>
                        <div className="text-xs text-muted-foreground">{r.label}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16 p-12 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border">
          <h2 className="text-3xl font-bold mb-4">Want Similar Results?</h2>
          <Link href="/contact"><Button size="lg" className="group">Start Your Project <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" /></Button></Link>
        </div>
      </div>
    </div>
  )
}