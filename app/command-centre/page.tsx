import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Radio, Map, Video, Bot, Activity, Shield, 
  Battery, Wifi, Globe, ArrowRight,
  Plane, Satellite, Camera, Zap, Plus,
  Crosshair, Radar, Target, Eye, Lock
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'IntelliWavve Command Centre - Autonomous Fleet Management',
  description: 'Enterprise platform for managing drones, IoT devices, robots, and autonomous systems. Live telemetry, mission planning, AI analytics.',
}

const fleetStats = [
  { icon: Plane, label: 'Active Drones', value: '0', status: 'Ready to connect', color: 'from-blue-500 to-cyan-500' },
  { icon: Activity, label: 'Active Missions', value: '0', status: 'No active missions', color: 'from-green-500 to-emerald-500' },
  { icon: Shield, label: 'System Status', value: 'Online', status: 'All systems operational', color: 'from-purple-500 to-pink-500' },
  { icon: Wifi, label: 'Connected Devices', value: '0', status: 'Awaiting pairing', color: 'from-orange-500 to-red-500' },
]

const modules = [
  { icon: Map, title: 'Mission Planner', desc: 'Plan and schedule autonomous missions with waypoint, survey, and inspection modes.', href: '/command-centre/missions', color: 'from-blue-600 to-cyan-600' },
  { icon: Video, title: 'Live Video Feed', desc: 'Real-time camera streaming with snapshot capture and recording capabilities.', href: '/command-centre/video', color: 'from-purple-600 to-pink-600' },
  { icon: Bot, title: 'AI Assistant', desc: 'Intelligent mission assistant for planning, analysis, and recommendations.', href: '/command-centre/ai', color: 'from-green-600 to-emerald-600' },
  { icon: Activity, title: 'Live Telemetry', desc: 'Real-time flight data including GPS, altitude, speed, battery, and signal strength.', href: '/command-centre/telemetry', color: 'from-orange-600 to-red-600' },
  { icon: Shield, title: 'Fleet Management', desc: 'Register, monitor, and maintain your entire autonomous fleet from one dashboard.', href: '/command-centre/fleet', color: 'from-indigo-600 to-blue-600' },
  { icon: Globe, title: 'Live Map', desc: 'Real-time positioning with geofences, no-fly zones, and interactive mission routes.', href: '/command-centre/map', color: 'from-teal-600 to-green-600' },
]

const showcaseImages = [
  { src: '/images/warfare.jpeg', alt: 'Military drone warfare systems', title: 'Defense Systems', desc: 'Advanced warfare drone coordination and surveillance' },
  { src: '/images/dronesurveilance.jpeg', alt: 'Drone surveillance operations', title: 'Surveillance', desc: '24/7 aerial monitoring and intelligence gathering' },
  { src: '/images/aidrones.jpeg', alt: 'AI-powered autonomous drones', title: 'AI Drones', desc: 'Intelligent autonomous flight with AI decision-making' },
  { src: '/images/military.jpeg', alt: 'Military drone fleet operations', title: 'Fleet Operations', desc: 'Multi-drone coordination for complex missions' },
]

const capabilities = [
  { icon: Crosshair, label: 'Precision Targeting' },
  { icon: Radar, label: 'Radar Integration' },
  { icon: Target, label: 'Mission Accuracy' },
  { icon: Eye, label: 'Real-time Vision' },
  { icon: Lock, label: 'Secure Comms' },
  { icon: Satellite, label: 'Satellite Link' },
]

export default function CommandCentrePage() {
  return (
    <div className="overflow-hidden">
      {/* ========================================== HERO ========================================== */}
      <section className="relative py-32 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950/80 to-slate-950" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(59,130,246,0.4) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 backdrop-blur-xl border border-blue-500/20 mb-8">
              <Radio className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400 font-medium">Enterprise Autonomous Systems Platform</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.08]">
              IntelliWavve{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400">
                Command Centre
              </span>
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
              One intelligent platform for managing autonomous drone fleets, IoT devices, robots, and connected systems. 
              Built for defense, surveillance, agriculture, and enterprise operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/command-centre/fleet/register">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-6 text-lg rounded-2xl shadow-2xl shadow-blue-500/25 font-semibold group">
                  Register Device <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg rounded-2xl border-white/15 text-white hover:bg-white/5 backdrop-blur-xl font-semibold">
                  Request Enterprise Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== FLEET STATS ========================================== */}
      <section className="py-8 bg-white dark:bg-neutral-950 border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {fleetStats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="p-5 rounded-2xl border bg-background/50 hover:shadow-md transition-all text-center">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} p-2 mx-auto mb-3`}>
                    <Icon className="w-full h-full text-white" />
                  </div>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white">{stat.value}</div>
                  <div className="text-sm font-medium mt-1">{stat.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.status}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ========================================== SHOWCASE IMAGES ========================================== */}
      <section className="py-24 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-4 text-neutral-900 dark:text-white tracking-tight">
              Autonomous Systems{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Capabilities</span>
            </h2>
            <p className="text-xl text-neutral-500 dark:text-neutral-400 max-w-3xl mx-auto">
              Military-grade drone command and control for defense, surveillance, and enterprise operations.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {showcaseImages.map((img) => (
              <div key={img.title} className="group relative rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-2xl transition-all duration-500">
                <div className="relative h-64">
                  <Image src={img.src} alt={img.alt} fill className="object-cover group-hover:scale-110 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 25vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-blue-500/30 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-white font-bold text-lg">{img.title}</h3>
                    <p className="text-white/70 text-xs mt-1">{img.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================== CAPABILITIES BAR ========================================== */}
      <section className="py-8 bg-neutral-50 dark:bg-neutral-900 border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-8">
            {capabilities.map((cap) => {
              const Icon = cap.icon
              return (
                <div key={cap.label} className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <Icon className="w-4 h-4 text-blue-500" />
                  <span>{cap.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ========================================== MODULE CARDS ========================================== */}
      <section className="py-24 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-4 text-neutral-900 dark:text-white tracking-tight">
              Command Modules
            </h2>
            <p className="text-xl text-neutral-500 dark:text-neutral-400">Everything you need to manage autonomous operations.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod) => {
              const Icon = mod.icon
              return (
                <Link key={mod.title} href={mod.href}
                  className="group p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-2xl transition-all relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${mod.color} p-3.5 mb-5 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-full h-full text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-neutral-900 dark:text-white">{mod.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{mod.desc}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ========================================== ARCHITECTURE ========================================== */}
      <section className="py-24 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-4 text-neutral-900 dark:text-white tracking-tight">
              Platform Architecture
            </h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              { label: 'Cloud Platform', desc: 'IntelliWavve Command Centre', color: 'blue' },
              { label: 'AI Intelligence', desc: 'Mission Planning, Object Detection, Analytics', color: 'purple' },
              { label: 'Secure API Gateway', desc: 'JWT, RBAC, Encryption', color: 'green' },
              { label: 'Device Fleet', desc: 'Drones | Robots | IoT Sensors | Cameras', color: 'orange' },
              { label: 'Communication', desc: '4G/5G | Wi-Fi | Radio | Satellite', color: 'teal' },
            ].map((layer, i) => (
              <div key={layer.label} className={`p-5 rounded-xl bg-${layer.color}-50 dark:bg-${layer.color}-950 border border-${layer.color}-200 dark:border-${layer.color}-800`} style={{ marginLeft: `${i * 16}px` }}>
                <span className={`text-${layer.color}-600 dark:text-${layer.color}-400 font-bold`}>{layer.label}</span>
                <span className="text-muted-foreground ml-2">→ {layer.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================== CTA ========================================== */}
      <section className="py-32 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Ready to Deploy Your Fleet?</h2>
          <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
            Connect your first drone and experience the power of autonomous command and control.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/command-centre/fleet/register">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-gray-100 px-10 py-7 text-lg rounded-2xl font-bold shadow-2xl group">
                Register Device Now <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="px-10 py-7 text-lg rounded-2xl border-2 border-white/30 text-white hover:bg-white/10 font-bold">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}