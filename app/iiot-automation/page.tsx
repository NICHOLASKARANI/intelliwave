import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Factory, Activity, Gauge, Satellite, Database, ArrowRight, CheckCircle, Cpu } from 'lucide-react'

export const metadata: Metadata = {
  title: 'IIoT & Industrial Automation Solutions | IntelliWave',
  description: 'Transform manufacturing with IIoT systems, predictive maintenance, real-time monitoring, and AI-powered automation.',
}

const solutions = [
  { icon: Activity, title: 'Predictive Maintenance', desc: 'AI anomaly detection reducing downtime by 71%.', features: ['Vibration Analysis', 'Temperature Monitoring', 'AI Failure Prediction'] },
  { icon: Gauge, title: 'Real-Time Monitoring', desc: 'Cloud dashboards for remote production oversight.', features: ['Live Dashboards', 'Alert Systems', 'Mobile Access'] },
  { icon: Satellite, title: 'Supply Chain IoT', desc: 'Connected tracking for inventory and logistics.', features: ['Asset Tracking', 'Route Optimization', 'Cold Chain'] },
  { icon: Database, title: 'Edge Computing', desc: 'Local processing for ultra-low latency decisions.', features: ['Local Processing', 'Offline Capability', 'Data Filtering'] },
]

export default function IIoTAutomationPage() {
  return (
    <div className="py-20">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Cpu className="w-4 h-4 text-primary" /> Industry 4.0 Ready
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">IIoT & Industrial <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Automation</span></h1>
            <p className="text-xl text-muted-foreground mb-8">Transform operations with intelligent, interconnected systems. Real-time monitoring, predictive maintenance, autonomous decisions.</p>
            <Link href="/contact"><Button size="lg" className="group">Schedule Consultation <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" /></Button></Link>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border shadow-2xl bg-gradient-to-br from-yellow-600 to-orange-600 flex items-center justify-center">
            <Factory className="w-32 h-32 text-white/30" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <p className="font-semibold text-lg">Smart Manufacturing Solutions</p>
              <p className="text-white/70 text-sm">Industry 4.0 powered by AI</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-24">
          {solutions.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="p-8 rounded-2xl border hover:border-primary/50 transition-all">
                <Icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground mb-4">{item.desc}</p>
                <div className="space-y-2">
                  {item.features.map((f) => (<div key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" />{f}</div>))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-yellow-600 to-orange-600 text-white">
          <h2 className="text-3xl font-bold mb-4">Automate Your Industry</h2>
          <p className="text-white/80 mb-6">Let our IIoT experts design a custom automation solution.</p>
          <Link href="/contact"><Button size="lg" className="bg-white text-yellow-600 hover:bg-gray-100">Get Started <ArrowRight className="ml-2" /></Button></Link>
        </div>
      </div>
    </div>
  )
}