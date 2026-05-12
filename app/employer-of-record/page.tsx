import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Globe, Shield, Users, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Employer of Record (EOR) - Hire Talent Anywhere',
  description: 'Hire talent anywhere with Intelliwave EOR service handling all legal compliance and employment.',
}

export default function EmployerOfRecordPage() {
  return (
    <div className="py-20">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">Employer of Record</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Hire talent anywhere with our EOR service handling all legal compliance.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {[
            { icon: Globe, title: 'Global Hiring', description: 'Hire talent in any African country without setting up local entities.' },
            { icon: Shield, title: 'Legal Compliance', description: 'Full compliance with local labour laws and regulations.' },
            { icon: Users, title: 'Employee Management', description: 'We handle contracts, payroll, taxes, and benefits.' },
            { icon: FileText, title: 'Risk Mitigation', description: 'Reduce employment risks with our compliant EOR framework.' },
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
            <Button size="lg">Learn More About EOR</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}