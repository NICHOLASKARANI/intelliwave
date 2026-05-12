import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Search, Users, Briefcase, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Recruitment Services - Job Advertising & Placement',
  description: 'End-to-end recruitment solutions from job advertising to candidate placement by Intelliwave.',
}

export default function RecruitmentPage() {
  return (
    <div className="py-20">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">Recruitment Services</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            End-to-end recruitment solutions from job advertising to candidate placement.
          </p>
        </div>

        <div className="space-y-6 mb-12">
          {[
            {
              icon: Search,
              title: 'Job Advertising',
              description: 'Strategic job postings across premium platforms reaching qualified candidates across Africa.',
            },
            {
              icon: Users,
              title: 'Candidate Screening',
              description: 'AI-powered screening and assessment to identify the best talent for your organization.',
            },
            {
              icon: Briefcase,
              title: 'Placement & Onboarding',
              description: 'Seamless placement and onboarding support for successful integration.',
            },
            {
              icon: CheckCircle,
              title: 'Background Verification',
              description: 'Comprehensive background checks and reference verification for all candidates.',
            },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="p-6 border rounded-xl hover:border-primary/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="text-center">
          <Link href="/contact">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Request Recruitment Service
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}