import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'HR Consultancy - Strategic Advisory & Organizational Design',
  description: 'Strategic HR advisory, organizational design, and workforce planning by Intelliwave.',
}

export default function HRConsultancyPage() {
  return (
    <div className="py-20 container max-w-4xl">
      <h1 className="text-5xl font-bold mb-6">HR Consultancy</h1>
      <p className="text-xl text-muted-foreground mb-12">
        Strategic HR advisory, organizational design, and workforce planning.
      </p>
      <div className="grid md:grid-cols-2 gap-6">
        {['Organizational Design', 'Workforce Planning', 'Performance Systems', 'Policy Development'].map((item) => (
          <div key={item} className="p-6 border rounded-xl">
            <h3 className="font-bold mb-2">{item}</h3>
            <p className="text-sm text-muted-foreground">Expert consultancy tailored to your enterprise needs.</p>
          </div>
        ))}
      </div>
    </div>
  )
}