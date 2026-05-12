import { Metadata } from 'next'
import { ExecutiveInsightsSection } from '@/components/sections/executive-insights-section'

export const metadata: Metadata = {
  title: 'Testimonials - Client Success Stories',
  description: 'See what our clients say about Intelliwave AI and software solutions.',
}

export default function TestimonialsPage() {
  return (
    <div className="py-20 container">
      <ExecutiveInsightsSection />
    </div>
  )
}