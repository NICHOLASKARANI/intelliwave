import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { HeadphonesIcon, MessageSquare, Phone, Mail, Clock, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Customer Support - 24/7 Help Desk | IntelliWave',
  description: '24/7 customer support. WhatsApp, email, phone, and live chat available.',
}

export default function SupportPage() {
  return (
    <div className="py-20">
      <div className="container">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-950 text-green-600 text-sm font-medium mb-6">
            <HeadphonesIcon className="w-4 h-4" /> 24/7 Support
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Customer{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Support</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're here to help. Multiple ways to reach our support team.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-16">
          {[
            { icon: MessageSquare, title: 'Live Chat', desc: 'Chat with us instantly', action: 'Start Chat', color: 'text-blue-500' },
            { icon: Phone, title: 'WhatsApp', desc: '+254 714 694 493', action: 'Message Now', color: 'text-green-500' },
            { icon: Mail, title: 'Email', desc: 'intelliwavehr@gmail.com', action: 'Send Email', color: 'text-purple-500' },
            { icon: Clock, title: 'Response Time', desc: 'Under 2 hours', action: 'Get Help', color: 'text-orange-500' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="text-center p-6 rounded-2xl border hover:shadow-lg transition-all">
                <Icon className={`w-10 h-10 ${item.color} mx-auto mb-3`} />
                <h3 className="font-bold">{item.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{item.desc}</p>
                <Button variant="outline" size="sm">{item.action}</Button>
              </div>
            )
          })}
        </div>

        <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border">
          <h2 className="text-3xl font-bold mb-4">Need Immediate Help?</h2>
          <a href="https://wa.me/254714694493" target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="group bg-green-500 hover:bg-green-600">
              <Phone className="w-5 h-5 mr-2" /> WhatsApp: +254 714 694 493
            </Button>
          </a>
        </div>
      </div>
    </div>
  )
}