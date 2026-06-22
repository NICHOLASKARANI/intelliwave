import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Video, Calendar, Clock, Users, Play, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Webinars - Live & On-Demand Training | IntelliWave',
  description: 'Free AI and technology webinars. Live sessions and on-demand recordings.',
}

const upcomingWebinars = [
  { title: 'AI for Business Leaders', date: 'July 15, 2024', time: '2:00 PM EAT', speaker: 'Nicholas Karani', attendees: 250 },
  { title: 'Building Scalable SaaS on AWS', date: 'July 22, 2024', time: '3:00 PM EAT', speaker: 'Mark Mwangi', attendees: 180 },
  { title: 'Cybersecurity Essentials', date: 'July 29, 2024', time: '11:00 AM EAT', speaker: 'IntelliWave Security Team', attendees: 300 },
]

const pastWebinars = [
  { title: 'Introduction to Machine Learning', date: 'June 10, 2024', views: '1,200+', duration: '45 min' },
  { title: 'M-Pesa Integration Guide', date: 'May 25, 2024', views: '950+', duration: '30 min' },
  { title: 'Cloud Migration Strategies', date: 'May 15, 2024', views: '800+', duration: '60 min' },
  { title: 'IIoT for Manufacturing', date: 'April 28, 2024', views: '650+', duration: '45 min' },
]

export default function WebinarsPage() {
  return (
    <div className="py-20">
      <div className="container">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 dark:bg-red-950 text-red-600 text-sm font-medium mb-6">
            <Video className="w-4 h-4" /> Live & On-Demand
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Free{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Webinars</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Learn from industry experts. Live sessions and recorded webinars available.
          </p>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Upcoming Webinars</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {upcomingWebinars.map((w) => (
              <div key={w.title} className="p-6 rounded-2xl border hover:shadow-xl hover:border-primary/30 transition-all">
                <Video className="w-10 h-10 text-red-500 mb-4" />
                <h3 className="font-bold text-lg mb-2">{w.title}</h3>
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />{w.date}</div>
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4" />{w.time}</div>
                  <div className="flex items-center gap-2"><Users className="w-4 h-4" />{w.attendees} registered</div>
                </div>
                <Button className="w-full group">Register Free <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" /></Button>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Past Webinars</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {pastWebinars.map((w) => (
              <div key={w.title} className="flex items-center justify-between p-4 rounded-xl border hover:border-primary/30 transition-all">
                <div className="flex items-center gap-3">
                  <Play className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium">{w.title}</p>
                    <p className="text-xs text-muted-foreground">{w.date} • {w.duration} • {w.views} views</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Watch</Button>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border">
          <h2 className="text-3xl font-bold mb-4">Never Miss a Webinar</h2>
          <Link href="/contact"><Button size="lg" className="group">Subscribe for Updates <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" /></Button></Link>
        </div>
      </div>
    </div>
  )
}