import { Metadata } from 'next'
import { EnterpriseSolutionsSections } from './sections'

export const metadata: Metadata = {
  title: 'Enterprise Solutions - AI, Digital Transformation & IT Consulting',
  description: 'Enterprise digital transformation, IT consulting, ERP systems, AI solutions, and managed services. Trusted by global organizations.',
}

export default function EnterpriseSolutionsPage() {
  return <EnterpriseSolutionsSections />
}