import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Register Drone - IntelliWavve Command Centre',
  description: 'Register a new drone or autonomous device in the IntelliWavve Command Centre platform.',
}

export default function RegisterDronePage() {
  return (
    <div className="py-20">
      <div className="container max-w-2xl">
        <h1 className="text-4xl font-bold mb-6">Register New Drone</h1>
        <p className="text-xl text-muted-foreground mb-10">
          Enter your drone's details to connect it to the IntelliWavve Command Centre.
        </p>

        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Drone Name</label>
            <input type="text" placeholder="e.g., Survey Drone Alpha" className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Serial Number / Model</label>
            <input type="text" placeholder="Enter serial number or model" className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Manufacturer</label>
            <input type="text" placeholder="e.g., DJI, custom PX4 build, ArduPilot" className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Flight Controller</label>
            <select className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select flight controller</option>
              <option value="px4">PX4</option>
              <option value="ardupilot">ArduPilot</option>
              <option value="dji">DJI</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Communication Protocol</label>
            <select className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select protocol</option>
              <option value="mqtt">MQTT</option>
              <option value="websocket">WebSocket</option>
              <option value="http">HTTP REST API</option>
              <option value="serial">Serial Bridge</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Organization / Department</label>
            <input type="text" placeholder="e.g., Survey Team, Security Operations" className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <CheckCircle className="w-4 h-4 inline mr-2" />
              After registration, you'll receive connection credentials and setup instructions for your device.
            </p>
          </div>

          <Button type="submit" size="lg" className="w-full group">
            Register Device <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <Link href="/command-centre" className="text-blue-600 hover:underline">← Back to Command Centre</Link>
        </div>
      </div>
    </div>
  )
}