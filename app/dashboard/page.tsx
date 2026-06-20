import { Metadata } from 'next'
import Link from 'next/link'
import { 
  Globe, Code2, Shield, Cloud, Building2, Cpu,
  FileText, Users, Briefcase, BookOpen, ArrowRight,
  CheckCircle, Wrench
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'IntelliWave Dashboard - Site Overview',
  description: 'Complete overview of all IntelliWave pages and services.',
}

const mainPages = [
  { name: 'Home', href: '/', icon: Globe, status: 'live' },
  { name: 'About', href: '/about', icon: Users, status: 'live' },
  { name: 'Contact', href: '/contact', icon: FileText, status: 'live' },
  { name: 'Pricing', href: '/pricing', icon: Briefcase, status: 'live' },
  { name: 'Portfolio', href: '/portfolio', icon: BookOpen, status: 'live' },
  { name: 'Blog', href: '/blog', icon: FileText, status: 'live' },
]

const servicePages = [
  { name: 'Services Overview', href: '/services', icon: Wrench, status: 'live' },
  { name: 'AI Engineering', href: '/ai-engineering', icon: Cpu, status: 'live' },
  { name: 'Software Development', href: '/software-development', icon: Code2, status: 'live' },
  { name: 'Cybersecurity', href: '/cybersecurity', icon: Shield, status: 'live' },
  { name: 'Cloud & DevOps', href: '/cloud-devops', icon: Cloud, status: 'live' },
  { name: 'Enterprise Solutions', href: '/enterprise-solutions', icon: Building2, status: 'live' },
  { name: 'IIoT Automation', href: '/iiot-automation', icon: Cpu, status: 'live' },
]

const hrPages = [
  { name: 'Corporate Training', href: '/corporate-training', status: 'live' },
  { name: 'Executive Search', href: '/executive-search', status: 'live' },
  { name: 'Recruitment', href: '/recruitment', status: 'live' },
  { name: 'HR Consultancy', href: '/hr-consultancy', status: 'live' },
  { name: 'Payroll Services', href: '/payroll', status: 'live' },
  { name: 'Employer of Record', href: '/employer-of-record', status: 'live' },
  { name: 'Staff Outsourcing', href: '/staff-outsourcing', status: 'live' },
]

const toolPages = [
  { name: 'AI Project Estimator', href: '/estimator', status: 'live' },
  { name: 'Mission & Vision', href: '/mission-vision', status: 'live' },
  { name: 'Management', href: '/management', status: 'live' },
  { name: 'Careers', href: '/careers', status: 'live' },
  { name: 'Events', href: '/events', status: 'live' },
  { name: 'Insights', href: '/insights', status: 'live' },
  { name: 'Employers', href: '/employers', status: 'live' },
  { name: 'Testimonials', href: '/testimonials', status: 'live' },
]

export default function DashboardPage() {
  return (
    <div className="py-20">
      <div className="container">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">IntelliWave Dashboard</h1>
          <p className="text-xl text-muted-foreground">Complete site overview - {mainPages.length + servicePages.length + hrPages.length + toolPages.length} pages live</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { label: 'Total Pages', value: '40+' },
            { label: 'Service Pages', value: '7' },
            { label: 'HR Services', value: '7' },
            { label: 'Status', value: 'All Live' },
          ].map((stat) => (
            <div key={stat.label} className="p-6 rounded-2xl border text-center">
              <div className="text-3xl font-bold text-primary">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Main Pages */}
        <Section title="Main Pages" pages={mainPages} />
        
        {/* Service Pages */}
        <Section title="Service Pages" pages={servicePages} />
        
        {/* HR Pages */}
        <Section title="HR & Talent Services" pages={hrPages} />
        
        {/* Tool Pages */}
        <Section title="Company & Tools" pages={toolPages} />
      </div>
    </div>
  )
}

function Section({ title, pages }: { title: string; pages: any[] }) {
  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            className="flex items-center justify-between p-4 rounded-xl border hover:border-primary/50 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              {page.icon && <page.icon className="w-5 h-5 text-primary" />}
              <span className="font-medium">{page.name}</span>
            </div>
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