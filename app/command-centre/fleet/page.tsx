import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plane, Battery, Wifi, Clock, MapPin, ArrowRight, Plus } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Fleet Management - IntelliWavve Command Centre',
  description: 'Register, monitor, and manage your autonomous drone fleet. Health monitoring, maintenance logs, and mission history.',
}

export default function FleetPage() {
  return (
    <div className="py-20">
      <div className="container">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Fleet Management</h1>
            <p className="text-xl text-muted-foreground">Register and manage your autonomous systems.</p>
          </div>
          <Link href="/command-centre/fleet/register">
            <Button size="lg" className="group">
              <Plus className="w-5 h-5 mr-2" /> Register New Drone
            </Button>
          </Link>
        </div>

        <div className="text-center py-20 rounded-3xl border-2 border-dashed border-neutral-300 dark:border-neutral-700">
          <Plane className="w-20 h-20 text-neutral-300 dark:text-neutral-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">No Drones Registered Yet</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Register your first drone to begin fleet management. You'll need the drone's serial number and specifications.
          </p>
          <Link href="/command-centre/fleet/register">
            <Button size="lg" className="group">
              Register Your First Drone <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {[
            { icon: Battery, title: 'Health Monitoring', desc: 'Real-time battery, signal, and system health for every device.' },
            { icon: Clock, title: 'Maintenance Logs', desc: 'Track firmware updates, repairs, and scheduled maintenance.' },
            { icon: MapPin, title: 'GPS Tracking', desc: 'Live position tracking with geofence alerts and flight history.' },
          ].map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="p-6 rounded-2xl border text-center">
                <Icon className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <h3 className="font-bold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{feature.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}