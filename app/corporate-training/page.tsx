import { Metadata } from 'next'
import { CorporateTrainingSection } from '@/components/sections/corporate-training-section'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Corporate Training - Leadership, Sales, HR & Compliance',
  description: 'Professional development programs including leadership, sales management, customer service, labour laws, and HR policies.',
}

export default function CorporateTrainingPage() {
  return (
    <div className="py-20">
      <div className="container">
        <CorporateTrainingSection />
        <div className="text-center mt-12">
          <Link href="/contact">
            <Button size="lg">Book Corporate Training</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}