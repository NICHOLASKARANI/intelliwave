import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Users, Code2, HeadphonesIcon, Briefcase } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Staff Outsourcing - Scale Your Team with Skilled Professionals',
  description: 'Scale your team with skilled professionals managed by Intelliwave staff outsourcing services.',
}

export default function StaffOutsourcingPage() {
  return (
    <div className="py-20">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">Staff Outsourcing</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Scale your team with skilled professionals managed by Intelliwave.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Code2, title: 'IT & Software', description: 'Skilled developers and engineers.' },
            { icon: HeadphonesIcon, title: 'Customer Support', description: 'Professional support teams.' },
            { icon: Briefcase, title: 'Finance & HR', description: 'Experienced finance and HR professionals.' },
            { icon: Users, title: 'Sales & Marketing', description: 'Results-driven sales teams.' },
            { icon: Code2, title: 'Data Science', description: 'AI and data analytics experts.' },
            { icon: HeadphonesIcon, title: 'Admin Support', description: 'Efficient administrative professionals.' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="p-6 border rounded-xl text-center hover:border-primary/50 transition-colors">
                <Icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-bold">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
              </div>
            )
          })}
        </div>

        <div className="text-center">
          <Link href="/contact">
            <Button size="lg">Request Staff Outsourcing</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}