import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Briefcase, MapPin, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Careers - Join 500+ AI Engineers at Intelliwave',
  description: 'Join our team of AI engineers and software developers. Explore career opportunities at Intelliwave.',
}

const jobs = [
  {
    title: 'Senior AI Engineer',
    department: 'Engineering',
    location: 'Nairobi, Kenya',
    type: 'Full-time',
  },
  {
    title: 'Full Stack Developer',
    department: 'Development',
    location: 'Remote',
    type: 'Full-time',
  },
  {
    title: 'DevOps Engineer',
    department: 'Infrastructure',
    location: 'Nairobi, Kenya',
    type: 'Full-time',
  },
  {
    title: 'UI/UX Designer',
    department: 'Design',
    location: 'Hybrid',
    type: 'Full-time',
  },
]

export default function CareersPage() {
  return (
    <div className="py-20">
      <div className="container">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">Join Our Team</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join 500+ AI engineers building Africa&apos;s Global AI Giant
          </p>
        </div>

        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.title}
              className="flex items-center justify-between p-6 border rounded-xl hover:border-primary/50 transition-colors"
            >
              <div>
                <h3 className="text-xl font-bold mb-2">{job.title}</h3>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" /> {job.department}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {job.type}
                  </span>
                </div>
              </div>
              <Link href={`/careers/${job.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <Button>Apply Now</Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}