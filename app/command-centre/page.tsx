import { Metadata } from 'next'
import Link from 'next/link'
import { 
  Radio, Map, Video, Bot, Activity, Shield, 
  Battery, Wifi, Thermometer, Gauge, ArrowRight,
  Drone, Satellite, Camera, AlertTriangle, CheckCircle,
  Clock, Users, Globe, Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'IntelliWavve Command Centre - Autonomous Fleet Management',
  description: 'Enterprise platform for managing drones, IoT devices, robots, and autonomous systems. Live telemetry, mission planning, AI analytics.',
}

const fleetStats = [
  { icon: Drone, label: 'Active Drones', value: '0', status: 'Ready to connect' },
  { icon: Activity, label: 'Active Missions', value: '0', status: 'No active missions' },
  { icon: Shield, label: 'System Status', value: 'Online', status: 'All systems operational' },
  { icon: Wifi, label: 'Connected Devices', value: '0', status: 'Awaiting pairing' },
]

const modules = [
  { icon: Map, title: 'Mission Planner', desc: 'Plan and schedule autonomous missions with waypoint, survey, and inspection modes.', href: '/command-centre/missions', color: 'from-blue-600 to-cyan-600' },
  { icon: Video, title: 'Live Video Feed', desc: 'Real-time camera streaming with snapshot capture and recording.', href: '/command-centre/video', color: 'from-purple-600 to-pink-600' },
  { icon: Bot, title: 'AI Assistant', desc: 'Intelligent mission assistant for planning, analysis, and recommendations.', href: '/command-centre/ai', color: 'from-green-600 to-emerald-600' },
  { icon: Activity, title: 'Telemetry', desc: 'Live flight data including GPS, altitude, speed, battery, and signal strength.', href: '/command-centre/telemetry', color: 'from-orange-600 to-red-600' },
  { icon: Shield, title: 'Fleet Management', desc: 'Register, monitor, and maintain your entire autonomous fleet.', href: '/command-centre/fleet', color: 'from-indigo-600 to-blue-600' },
  { icon: Globe, title: 'Live Map', desc: 'Real-time positioning with geofences, no-fly zones, and mission routes.', href: '/command-centre/map', color: 'from-teal-600 to-green-600' },
]

const quickActions = [
  { label: 'Register New Drone', href: '/command-centre/fleet/register', icon: Drone },
  { label: 'Create Mission', href: '/command-centre/missions/create', icon: Map },
  { label: 'View Live Map', href: '/command-centre/map', icon: Globe },
  { label: 'System Settings', href: '/command-centre/settings', icon: Shield },
]

export default function CommandCentrePage() {
  return (
    <div className="py-20">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 text-sm font-medium mb-6">
            <Radio className="w-4 h-4" /> Enterprise Platform
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight">
            IntelliWavve{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Command Centre</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            One intelligent platform for managing drones, IoT devices, robots, and autonomous systems.
          </p>
        </div>

        {/* Fleet Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {fleetStats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="p-6 rounded-2xl border bg-background/50 text-center">
                <Icon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-neutral-900 dark:text-white">{stat.value}</div>
                <div className="text-sm font-medium mt-1">{stat.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.status}</div>
              </div>
            )
          })}
        </div>

        {/* Module Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {modules.map((mod) => {
            const Icon = mod.icon
            return (
              <Link key={mod.title} href={mod.href}
                className="group p-6 rounded-2xl border hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xl transition-all">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${mod.color} p-3 mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-full h-full text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-neutral-900 dark:text-white">{mod.title}</h3>
                <p className="text-sm text-muted-foreground">{mod.desc}</p>
              </Link>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="p-8 rounded-2xl border bg-gradient-to-br from-background to-blue-500/5 mb-12">
          <h3 className="text-xl font-bold mb-4 text-neutral-900 dark:text-white">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.label} href={action.href}
                  className="flex items-center gap-3 p-4 rounded-xl border hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all">
                  <Icon className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">{action.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Architecture Overview */}
        <div className="p-8 rounded-2xl border bg-gradient-to-br from-background to-purple-500/5 mb-12">
          <h3 className="text-xl font-bold mb-6 text-neutral-900 dark:text-white">Platform Architecture</h3>
          <div className="space-y-3 font-mono text-sm text-muted-foreground">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <span className="text-blue-600 font-bold">Cloud Platform</span> → IntelliWavve Command Centre
            </div>
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 ml-4">
              <span className="text-purple-600 font-bold">AI Intelligence</span> → Mission Planning, Object Detection, Analytics
            </div>
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 ml-8">
              <span className="text-green-600 font-bold">Secure API Gateway</span> → JWT, RBAC, Encryption
            </div>
            <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 ml-12">
              <span className="text-orange-600 font-bold">Device Fleet</span> → Drones | Robots | IoT Sensors | Cameras
            </div>
            <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 ml-16">
              <span className="text-teal-600 font-bold">Communication</span> → 4G/5G | Wi-Fi | Radio | Satellite
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Connect Your Fleet?</h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Register your first drone or IoT device and start managing your autonomous operations.
          </p>
          <Link href="/command-centre/fleet/register">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-10 py-7 text-lg rounded-2xl font-bold shadow-2xl group">
              Register Device <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}