import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { FileText, MessageSquare, CreditCard } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Client Portal',
  description: 'Intelliwave client portal for project tracking and management.',
}

export default function ClientPortal() {
  return (
    <div className="py-20">
      <div className="container">
        <h1 className="text-4xl font-bold mb-8">Client Portal</h1>
        
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 border rounded-xl">
            <FileText className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">My Projects</h3>
            <p className="text-muted-foreground mb-4">Track your active projects</p>
            <Button variant="outline" className="w-full">View Projects</Button>
          </div>
          <div className="p-6 border rounded-xl">
            <MessageSquare className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">Messages</h3>
            <p className="text-muted-foreground mb-4">Communicate with your team</p>
            <Button variant="outline" className="w-full">Open Messages</Button>
          </div>
          <div className="p-6 border rounded-xl">
            <CreditCard className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">Payments</h3>
            <p className="text-muted-foreground mb-4">View invoices and pay</p>
            <Button variant="outline" className="w-full">Manage Payments</Button>
          </div>
        </div>
      </div>
    </div>
  )
}