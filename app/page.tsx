import { Metadata } from 'next'
import { HeroSection } from '@/components/sections/hero-section'
import { ServicesOverview } from '@/components/sections/services-overview'
import { GlobalStats } from '@/components/sections/global-stats'
import { TrustedBy } from '@/components/sections/trusted-by'
import { WhyIntelliwave } from '@/components/sections/why-intelliwave'
import { BuyerMandates } from '@/components/sections/buyer-mandates'
import { ClosedDeals } from '@/components/sections/closed-deals'
import { Testimonials } from '@/components/sections/testimonials'
import { AIFeatures } from '@/components/sections/ai-features'
import { InsightsPreview } from '@/components/sections/insights-preview'
import { BlogPreview } from '@/components/sections/blog-preview'
import { PricingPreview } from '@/components/sections/pricing-preview'
import { CTASection } from '@/components/sections/cta-section'
import { PartnersSection } from '@/components/sections/partners-section'
import { AnimatedBackground } from '@/components/animations/animated-background'

export const metadata: Metadata = {
  title: 'Engineering the Future with AI | Enterprise Software & AI Solutions',
  description: 'Intelliwave - Building Africa\'s Global AI Giant. Trusted by 450,000+ businesses. AI SaaS, Cloud, Enterprise Solutions.',
}

export default function HomePage() {
  return (
    <>
      <AnimatedBackground />
      <HeroSection />
      <PartnersSection />
      <ServicesOverview />
      <WhyIntelliwave />
      <AIFeatures />
      <GlobalStats />
      <BuyerMandates />
      <ClosedDeals />
      <InsightsPreview />
      <Testimonials />
      <TrustedBy />
      <PricingPreview />
      <BlogPreview />
      <CTASection />
    </>
  )
}