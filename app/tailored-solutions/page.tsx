import { Metadata } from 'next'
import { TailoredSolutionsSection } from '@/components/sections/tailored-solutions-section'

export const metadata: Metadata = {
  title: 'Tailored Software Solutions for Modern Business',
  description: 'Custom software solutions including web apps, mobile apps, cloud platforms, e-commerce, LMS, and ERP systems for modern enterprises.',
}

export default function TailoredSolutionsPage() {
  return (
    <div className="py-20">
      <div className="container">
        <TailoredSolutionsSection />
      </div>
    </div>
  )
}