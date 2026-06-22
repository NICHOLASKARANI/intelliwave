import { Metadata } from 'next'
import Link from 'next/link'
import { 
  Globe, Code2, Shield, Cloud, Building2, Cpu,
  Users, Briefcase, BookOpen, ArrowRight,
  CheckCircle, Activity, TrendingUp, Clock,
  BarChart3, Server, Zap, AlertTriangle, FileText
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'IntelliWave Command Center - System Overview',
  description: 'Complete IntelliWave platform overview, system status, and management dashboard.',
}

export default function DashboardPage() {
  return (
    <div className="py-20">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              IntelliWave Command Center
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">Complete platform overview & management</p>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { icon: Server, label: 'System Status', value: 'Operational', color: 'text-green-500', bg: 'bg-green-500/10' },
            { icon: Activity, label: 'API Latency', value: '<100ms', color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { icon: TrendingUp, label: 'Uptime', value: '99.99%', color: 'text-purple-500', bg: 'bg-purple-500/10' },
            { icon: Clock, label: 'Last Deploy', value: '2 min ago', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className={`p-4 rounded-xl ${item.bg} border text-center`}>
                <Icon className={`w-6 h-6 ${item.color} mx-auto mb-2`} />
                <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
              </div>
            )
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Total Pages', value: '45+', icon: FileText },
            { label: 'Service Pages', value: '12', icon: Briefcase },
            { label: 'API Endpoints', value: '8', icon: Code2 },
            { label: 'Components', value: '80+', icon: Cpu },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="p-6 rounded-2xl border text-center hover:shadow-md transition-shadow">
                <Icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            )
          })}
        </div>

        {/* Page Categories */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <PageSection 
            title="Main Pages" 
            icon={Globe}
            pages={[
              { name: 'Home', href: '/', status: 'live' },
              { name: 'About & Leadership', href: '/about', status: 'live' },
              { name: 'Contact', href: '/contact', status: 'live' },
              { name: 'Pricing', href: '/pricing', status: 'live' },
              { name: 'Portfolio', href: '/portfolio', status: 'live' },
              { name: 'Blog', href: '/blog', status: 'live' },
            ]}
          />
          <PageSection 
            title="Service Pages" 
            icon={Wrench}
            pages={[
              { name: 'Services Overview', href: '/services', status: 'live' },
              { name: 'AI Engineering', href: '/ai-engineering', status: 'live' },
              { name: 'Software Development', href: '/software-development', status: 'live' },
              { name: 'Cybersecurity', href: '/cybersecurity', status: 'live' },
              { name: 'Cloud & DevOps', href: '/cloud-devops', status: 'live' },
              { name: 'Enterprise Solutions', href: '/enterprise-solutions', status: 'live' },
              { name: 'IIoT Automation', href: '/iiot-automation', status: 'live' },
            ]}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <PageSection 
            title="HR & Talent Services" 
            icon={Users}
            pages={[
              { name: 'Corporate Training', href: '/corporate-training', status: 'live' },
              { name: 'Executive Search', href: '/executive-search', status: 'live' },
              { name: 'Recruitment', href: '/recruitment', status: 'live' },
              { name: 'HR Consultancy', href: '/hr-consultancy', status: 'live' },
              { name: 'Payroll Services', href: '/payroll', status: 'live' },
              { name: 'Employer of Record', href: '/employer-of-record', status: 'live' },
              { name: 'Staff Outsourcing', href: '/staff-outsourcing', status: 'live' },
            ]}
          />
          <PageSection 
            title="Company & Tools" 
            icon={Building2}
            pages={[
              { name: 'Command Center', href: '/dashboard', status: 'live' },
              { name: 'AI Estimator', href: '/estimator', status: 'live' },
              { name: 'Mission & Vision', href: '/mission-vision', status: 'live' },
              { name: 'Management', href: '/management', status: 'live' },
              { name: 'Careers', href: '/careers', status: 'live' },
              { name: 'Events', href: '/events', status: 'live' },
              { name: 'Insights', href: '/insights', status: 'live' },
            ]}
          />
        </div>

        {/* Activity Log */}
        <div className="p-6 rounded-2xl border mb-12">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {[
              { action: 'New contact form submission', time: '2 min ago', type: 'info' },
              { action: 'Page /ai-engineering deployed', time: '15 min ago', type: 'success' },
              { action: 'System health check passed', time: '1 hour ago', type: 'success' },
              { action: 'Google Sheets integration active', time: '2 hours ago', type: 'info' },
              { action: 'SSL certificate renewed', time: '1 day ago', type: 'success' },
            ].map((log) => (
              <div key={log.action} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    log.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                  }`} />
                  {log.action}
                </span>
                <span className="text-muted-foreground text-xs">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PageSection({ title, icon: Icon, pages }: { title: string; icon: any; pages: any[] }) {
  return (
    <div>
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Icon className="w-5 h-5 text-primary" />
        {title}
        <span className="text-xs text-muted-foreground">({pages.length} pages)</span>
      </h3>
      <div className="space-y-2">
        {pages.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            className="flex items-center justify-between p-3 rounded-xl border hover:border-primary/50 hover:bg-muted/50 transition-all group"
          >
            <span className="text-sm font-medium">{page.name}</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-green-500">
                <CheckCircle className="w-3 h-3" />
                {page.status}
              </span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// Import Wrench icon
import { Wrench } from 'lucide-react'