import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Recruitment Services - Job Advertising & Placement',
  description: 'End-to-end recruitment solutions from job advertising to candidate placement by Intelliwave.',
}

export default function RecruitmentPage() {
  return (
    <div className="py-20 container max-w-4xl">
      <h1 className="text-5xl font-bold mb-6">Recruitment Services</h1>
      <p className="text-xl text-muted-foreground mb-12">
        End-to-end recruitment solutions from job advertising to candidate placement.
      </p>
      <div className="space-y-6 text-muted-foreground">
        <div className="p-6 border rounded-xl">
          <h3 className="text-xl font-bold mb-2">Job Advertising</h3>
          <p>Strategic job postings across premium platforms reaching qualified candidates.</p>
        </div>
        <div className="p-6 border rounded-xl">
          <h3 className="text-xl font-bold mb-2">Candidate Screening</h3>
          <p>AI-powered screening and assessment to identify the best talent.</p>
        </div>
        <div className="p-6 border rounded-xl">
          <h3 className="text-xl font-bold mb-2">Placement & Onboarding</h3>
          <p>Seamless placement and onboarding support for successful integration.</p>
        </div>
      </div>
    </div>
  )
}hr-consultancy