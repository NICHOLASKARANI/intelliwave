import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Star, TrendingUp, ArrowRight, Quote } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Client Success Stories - Real Results | IntelliWave',
  description: 'Real success stories from clients across banking, healthcare, manufacturing, and logistics.',
}

const stories = [
  { company: 'Leading Kenyan Bank', industry: 'Banking', result: 'KSh 120M saved annually', rating: 5, quote: 'IntelliWave transformed our fraud detection. 99.7% accuracy.' },
  { company: 'Hospital Network', industry: 'Healthcare', result: '50K+ consultations', rating: 5, quote: 'Telemedicine platform serving patients across 3 countries.' },
  { company: 'Manufacturing Plant', industry: 'Manufacturing', result: '71% less downtime', rating: 5, quote: 'IIoT predictive maintenance paid for itself in 3 months.' },
  { company: 'Logistics Company', industry: 'Logistics', result: '92% fewer delays', rating: 5, quote: 'AI route optimization saved us KSh 28M in fuel costs.' },
  { company: 'Pan-African University', industry: 'Education', result: '200K+ students', rating: 5, quote: 'LMS platform now serving students across 15 countries.' },
  { company: 'Tech Startup', industry: 'Technology', result: '100+ data sources', rating: 5, quote: 'Real-time analytics dashboard transformed our decision-making.' },
]

export default function SuccessStoriesPage() {
  return (
    <div className="py-20">
      <div className="container">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Client{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Success Stories</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Real results from real clients across industries.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {stories.map((story) => (
            <div key={story.company} className="p-6 rounded-2xl border hover:shadow-lg transition-all">
              <div className="flex gap-1 mb-3">
                {[...Array(story.rating)].map((_, i) => (<Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />))}
              </div>
              <Quote className="w-8 h-8 text-primary/30 mb-2" />
              <p className="text-muted-foreground italic mb-4">"{story.quote}"</p>
              <div className="border-t pt-4">
                <p className="font-bold">{story.company}</p>
                <p className="text-sm text-muted-foreground">{story.industry}</p>
                <p className="text-sm text-green-600 font-medium mt-1">✅ {story.result}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border">
          <h2 className="text-3xl font-bold mb-4">Be Our Next Success Story</h2>
          <Link href="/contact"><Button size="lg" className="group">Start Your Project <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" /></Button></Link>
        </div>
      </div>
    </div>
  )
}