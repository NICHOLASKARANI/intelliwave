import { Metadata } from 'next'
import { MissionVisionSection } from '@/components/sections/mission-vision-section'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Mission & Vision - Building Africa\'s Global AI Giant',
  description: 'Intelliwave mission to democratize AI across Africa and vision to become a trillion-dollar global technology company.',
}

export default function MissionVisionPage() {
  return (
    <div className="py-20">
      <div className="container">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Our{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Mission & Vision
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Engineering the future with AI — Building Africa's Global AI Giant
          </p>
        </div>

        <MissionVisionSection />

        <div className="text-center mt-16">
          <Link href="/contact">
            <Button size="lg" className="group">
              Partner With Us
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}