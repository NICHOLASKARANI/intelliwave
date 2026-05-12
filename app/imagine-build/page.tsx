import { Metadata } from 'next'
import { ImagineBuildSection } from '@/components/sections/imagine-build-section'

export const metadata: Metadata = {
  title: 'Imagine It, We\'ll Build It - Custom Software Development',
  description: 'From concept to deployment, our 500+ AI engineers turn your boldest ideas into enterprise-grade reality.',
}

export default function ImagineBuildPage() {
  return (
    <div className="py-20">
      <div className="container">
        <ImagineBuildSection />
      </div>
    </div>
  )
}