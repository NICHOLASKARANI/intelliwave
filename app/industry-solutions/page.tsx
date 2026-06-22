import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Building2, Heart, GraduationCap, Factory, Truck, Banknote, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Industry Solutions - Banking, Healthcare, Manufacturing | IntelliWave',
  description: 'AI solutions for banking, healthcare, manufacturing, logistics, education, and government.',
}

const industries = [
  { icon: Banknote, title: 'Banking & Finance', desc: 'Fraud detection, risk analysis, customer service AI', clients: '50+' },
  { icon: Heart, title: 'Healthcare', desc: 'Patient management, telemedicine, AI diagnostics', clients: '30+' },
  { icon: Factory, title: 'Manufacturing', desc: 'IIoT, predictive maintenance, quality control', clients: '40+' },
  { icon: Truck, title: 'Logistics', desc: 'Route optimization, fleet management, tracking', clients: '35+' },
  { icon: GraduationCap, title: 'Education', desc: 'LMS platforms, student analytics, AI tutoring', clients: '25+' },
  { icon: Building2, title: 'Government', desc: 'Digital transformation, citizen services, security', clients: '15+' },
]

export default function IndustrySolutionsPage() {
  return (
    <div className="py-20">
      <div className="container">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Industry{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Solutions</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Specialized AI solutions tailored for your industry.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {industries.map((ind) => {
            const Icon = ind.icon
            return (
              <div key={ind.title} className="p-6 rounded-2xl border hover:shadow-lg hover:border-primary/30 transition-all">
                <Icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">{ind.title}</h3>
                <p className="text-muted-foreground text-sm mb-3">{ind.desc}</p>
                <span className="text-xs text-primary font-medium">{ind.clients} clients served</span>
              </div>
            )
          })}
        </div>

        <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border">
          <h2 className="text-3xl font-bold mb-4">Find Your Solution</h2>
          <Link href="/contact"><Button size="lg" className="group">Get Industry Consultation <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" /></Button></Link>
        </div>
      </div>
    </div>
  )
}