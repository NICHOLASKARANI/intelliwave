import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'For Employers - HR & Talent Solutions',
  description: 'Complete HR solutions for employers including recruitment, payroll, training, and staff outsourcing.',
}

export default function EmployersPage() {
  return (
    <div className="py-20 container">
      <h1 className="text-5xl font-bold mb-6">For Employers</h1>
      <p className="text-xl text-muted-foreground mb-12">
        Complete HR and talent solutions for modern enterprises.
      </p>
      <div className="grid md:grid-cols-2 gap-6">
        {[
          { title: 'Find Talent', desc: 'Access our network of 50,000+ professionals', href: '/recruitment' },
          { title: 'Train Teams', desc: 'Corporate training programs for all levels', href: '/corporate-training' },
          { title: 'Manage Payroll', desc: 'Comprehensive payroll and compliance', href: '/payroll' },
          { title: 'Scale Fast', desc: 'Staff outsourcing and EOR services', href: '/staff-outsourcing' },
        ].map((item) => (
          <Link key={item.title} href={item.href} className="p-6 border rounded-xl hover:border-primary/50 transition-colors">
            <h3 className="text-xl font-bold mb-2">{item.title}</h3>
            <p className="text-muted-foreground mb-4">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}