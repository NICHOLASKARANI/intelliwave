import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Briefcase, Users, BarChart3, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'HR Consultancy - Strategic Advisory & Organizational Design',
  description: 'Strategic HR advisory, organizational design, and workforce planning by Intelliwave.',
}

export default function HRConsultancyPage() {
  return (
    <div className="py-20">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">HR Consultancy</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Strategic HR advisory, organizational design, and workforce planning.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {[
            { icon: Briefcase, title: 'Organizational Design', description: 'Expert consultancy tailored to your enterprise needs.' },
            { icon: Users, title: 'Workforce Planning', description: 'Strategic workforce planning for optimal team structure.' },
            { icon: BarChart3, title: 'Performance Systems', description: 'Performance management frameworks and tools.' },
            { icon: FileText, title: 'Policy Development', description: 'Comprehensive HR policy creation and implementation.' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="p-6 border rounded-xl hover:border-primary/50 transition-colors">
                <Icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            )
          })}
        </div>

        <div className="text-center">
          <Link href="/contact">
            <Button size="lg">Book HR Consultation</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}