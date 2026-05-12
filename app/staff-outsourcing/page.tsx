import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Staff Outsourcing - Scale Your Team with Skilled Professionals',
  description: 'Scale your team with skilled professionals managed by Intelliwave staff outsourcing services.',
}

export default function StaffOutsourcingPage() {
  return (
    <div className="py-20 container max-w-4xl">
      <h1 className="text-5xl font-bold mb-6">Staff Outsourcing</h1>
      <p className="text-xl text-muted-foreground mb-12">
        Scale your team with skilled professionals managed by Intelliwave.
      </p>
      <div className="grid md:grid-cols-3 gap-6 text-center">
        {['IT & Software', 'Customer Support', 'Finance & HR'].map((dept) => (
          <div key={dept} className="p-6 border rounded-xl">
            <h3 className="font-bold">{dept}</h3>
          </div>
        ))}
      </div>
    </div>
  )
}