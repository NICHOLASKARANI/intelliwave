import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CreditCard, Calculator, FileText, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Payroll Services - Tax Compliance & Benefits Administration',
  description: 'Comprehensive payroll management, tax compliance, and benefits administration by Intelliwave.',
}

export default function PayrollPage() {
  return (
    <div className="py-20">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">Payroll Services</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive payroll management, tax compliance, and benefits administration.
          </p>
        </div>

        <div className="space-y-4 mb-12">
          {[
            { icon: CreditCard, title: 'Payroll Processing', description: 'Accurate and timely payroll processing for all employees.' },
            { icon: Calculator, title: 'Tax Compliance', description: 'Full tax calculation and remittance to relevant authorities.' },
            { icon: FileText, title: 'Benefits Administration', description: 'Management of employee benefits and statutory deductions.' },
            { icon: Shield, title: 'Statutory Deductions', description: 'NHIF, NSSF, and all regulatory compliance handled.' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="p-4 border rounded-xl flex items-center gap-4 hover:border-primary/50 transition-colors">
                <Icon className="w-6 h-6 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="text-center">
          <Link href="/contact">
            <Button size="lg">Get Payroll Quote</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}