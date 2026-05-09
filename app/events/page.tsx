import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Events - AI & Tech Conferences and Workshops',
  description: 'Join Intelliwave events, webinars, workshops, and conferences about AI and software engineering.',
}

const events = [
  {
    title: 'AI in Enterprise Summit 2024',
    date: 'March 15, 2024',
    location: 'Nairobi, Kenya',
    type: 'Conference',
    attendees: 500,
  },
  {
    title: 'Building SaaS Platforms Workshop',
    date: 'April 20, 2024',
    location: 'Virtual',
    type: 'Workshop',
    attendees: 200,
  },
  {
    title: 'Tech Career Fair Nairobi',
    date: 'May 10, 2024',
    location: 'Nairobi, Kenya',
    type: 'Meetup',
    attendees: 1000,
  },
]

export default function EventsPage() {
  return (
    <div className="py-20">
      <div className="container">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">Upcoming Events</h1>
          <p className="text-xl text-muted-foreground">
            Join our events and connect with the AI community
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {events.map((event) => (
            <div key={event.title} className="border rounded-xl overflow-hidden">
              <div className="p-6">
                <div className="text-sm text-primary mb-2">{event.type}</div>
                <h3 className="text-xl font-bold mb-4">{event.title}</h3>
                <div className="space-y-2 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> {event.date}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> {event.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" /> {event.attendees} attendees
                  </div>
                </div>
                <Button className="w-full">Register Now</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}