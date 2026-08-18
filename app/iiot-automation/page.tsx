import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Cpu, Wifi, Shield, Gauge, Factory, 
  Satellite, Database, Cloud, ArrowRight,
  CheckCircle, Activity, Cog
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'IIoT & Industrial Automation Solutions | IntelliWave',
  description: 'Transform manufacturing with intelligent IIoT systems, predictive maintenance, real-time monitoring, and autonomous decision-making powered by AI.',
}

const solutions = [
  {
    icon: Activity,
    title: 'Predictive Maintenance',
    description: 'AI-powered anomaly detection using IoT sensors to predict equipment failures before they occur, reducing downtime by up to 70%.',
    features: ['Vibration analysis', 'Temperature monitoring', 'Pressure sensing', 'AI failure prediction'],
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Gauge,
    title: 'Real-Time Monitoring',
    description: 'Cloud-based dashboards for remote oversight of entire production lines, enabling instant response to operational changes.',
    features: ['Live dashboards', 'Alert systems', 'Mobile access', 'Historical analytics'],
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Shield,
    title: 'Safety & Compliance',
    description: 'Automated safety protocols with edge computing for rapid, local decision-making in hazardous environments.',
    features: ['Hazard detection', 'Automated shutdown', 'Compliance tracking', 'Incident reporting'],
    color: 'from-red-500 to-orange-500',
  },
  {
    icon: Factory,
    title: 'Smart Manufacturing',
    description: 'End-to-end automation of production workflows with adaptive systems that optimize processes in real-time.',
    features: ['Production optimization', 'Quality control', 'Resource management', 'Digital twins'],
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Satellite,
    title: 'Supply Chain IoT',
    description: 'Connected devices for precise tracking of inventory, logistics, and equipment across the entire supply chain.',
    features: ['Asset tracking', 'Inventory management', 'Route optimization', 'Cold chain monitoring'],
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Database,
    title: 'Edge Computing',
    description: 'Local data processing for ultra-low latency decisions, reducing cloud dependency for critical operations.',
    features: ['Local processing', 'Reduced latency', 'Offline capability', 'Data filtering'],
    color: 'from-cyan-500 to-blue-500',
  },
]

const industries = [
  'Manufacturing', 'Oil & Gas', 'Mining', 'Agriculture',
  'Logistics', 'Energy', 'Water Treatment', 'Pharmaceuticals',
]

export default function IIoTAutomationPage() {
  return (
    <div className="py-20">
      <div className="container">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Cpu className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Industry 4.0 Ready</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            IIoT & Industrial{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Automation
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
            Transform traditional operations into intelligent, interconnected systems with 
            real-time data exchange, predictive maintenance, and autonomous decision-making 
            powered by AI and machine learning.
          </p>
        </div>

        {/* Solutions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {solutions.map((solution) => {
            const Icon = solution.icon
            return (
              <div key={solution.title} className="group p-6 rounded-2xl border hover:border-primary/50 hover:shadow-xl transition-all">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${solution.color} p-3 mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-full h-full text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{solution.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{solution.description}</p>
                <div className="space-y-2">
                  {solution.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Industries Served */}
        <div className="mb-16 p-8 rounded-2xl border bg-gradient-to-br from-background to-primary/5">
          <h2 className="text-3xl font-bold mb-6 text-center">Industries We Serve</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {industries.map((industry) => (
              <span key={industry} className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                {industry}
              </span>
            ))}
          </div>
        </div>

        {/* Technology Stack */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Our IIoT Technology Stack</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Wifi, title: 'Connectivity', techs: ['5G', 'LoRaWAN', 'MQTT', 'OPC UA'] },
              { icon: Database, title: 'Data Processing', techs: ['Apache Kafka', 'InfluxDB', 'TimescaleDB'] },
              { icon: Cloud, title: 'Cloud & Edge', techs: ['AWS IoT', 'Azure IoT', 'EdgeX'] },
              { icon: Cog, title: 'Automation', techs: ['PLC Integration', 'SCADA', 'ROS'] },
            ].map((stack) => {
              const Icon = stack.icon
              return (
                <div key={stack.title} className="p-6 rounded-xl border text-center">
                  <Icon className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h3 className="font-bold mb-3">{stack.title}</h3>
                  <div className="space-y-2">
                    {stack.techs.map((tech) => (
                      <span key={tech} className="block text-sm text-muted-foreground">{tech}</span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border">
          <h2 className="text-3xl font-bold mb-4">Ready to Automate Your Industry?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Let our team of IIoT experts design a custom automation solution for your operations.
          </p>
          <Link href="/contact">
            <Button size="lg" className="group">
              Schedule Consultation
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}