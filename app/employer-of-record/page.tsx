import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Employer of Record (EOR) - Hire Talent Anywhere',
  description: 'Hire talent anywhere with Intelliwave EOR service handling all legal compliance and employment.',
}

export default function EmployerOfRecordPage() {
  return (
    <div className="py-20 container max-w-4xl">
      <h1 className="text-5xl font-bold mb-6">Employer of Record</h1>
      <p className="text-xl text-muted-foreground mb-12">
        Hire talent anywhere with our EOR service handling all legal compliance.
      </p>
      <p className="text-muted-foreground">
        We handle employment contracts, payroll, taxes, and compliance so you can focus on your business.
      </p>
    </div>
  )
}