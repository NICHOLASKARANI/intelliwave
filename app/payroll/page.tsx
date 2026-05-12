import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Payroll Services - Tax Compliance & Benefits Administration',
  description: 'Comprehensive payroll management, tax compliance, and benefits administration by Intelliwave.',
}

export default function PayrollPage() {
  return (
    <div className="py-20 container max-w-4xl">
      <h1 className="text-5xl font-bold mb-6">Payroll Services</h1>
      <p className="text-xl text-muted-foreground mb-12">
        Comprehensive payroll management, tax compliance, and benefits administration.
      </p>
      <div className="space-y-4">
        {['Payroll Processing', 'Tax Compliance', 'Benefits Administration', 'Statutory Deductions'].map((item) => (
          <div key={item} className="p-4 border rounded-xl flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="font-medium">{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}