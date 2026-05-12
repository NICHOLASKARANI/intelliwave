import { Metadata } from 'next'
import { ExecutiveInsightsSection } from '@/components/sections/executive-insights-section'

export const metadata: Metadata = {
  title: 'Executive Insights - What Kenyan Leaders Say',
  description: 'Hear from Kenyan executives and business leaders about their experience with Intelliwave AI and software solutions.',
}

export default function ExecutiveInsightsPage() {
  return (
    <div className="py-20">
      <div className="container">
        <ExecutiveInsightsSection />
      </div>
    </div>
  )
}