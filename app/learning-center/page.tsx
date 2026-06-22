import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BookOpen, Video, FileText, Code2, ArrowRight, Play, Download } from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI Learning Center - Free Resources & Tutorials | IntelliWave',
  description: 'Free AI learning resources, tutorials, webinars, and documentation. Learn AI, ML, and software development.',
}

const resources = [
  { icon: Video, title: 'Video Tutorials', count: '50+', desc: 'Step-by-step AI and development tutorials', color: 'from-red-500 to-pink-500' },
  { icon: FileText, title: 'Documentation', count: '200+', desc: 'Comprehensive guides and API docs', color: 'from-blue-500 to-cyan-500' },
  { icon: Code2, title: 'Code Samples', count: '100+', desc: 'Production-ready code examples', color: 'from-green-500 to-emerald-500' },
  { icon: BookOpen, title: 'E-Books', count: '15+', desc: 'In-depth AI and software engineering books', color: 'from-purple-500 to-pink-500' },
]

const courses = [
  { title: 'Introduction to Machine Learning', level: 'Beginner', duration: '4 weeks', students: '2,500+' },
  { title: 'Building SaaS Platforms with Next.js', level: 'Intermediate', duration: '6 weeks', students: '1,800+' },
  { title: 'Enterprise AI Deployment', level: 'Advanced', duration: '8 weeks', students: '950+' },
  { title: 'Cybersecurity for Developers', level: 'Intermediate', duration: '4 weeks', students: '1,200+' },
  { title: 'IIoT & Industrial Automation', level: 'Advanced', duration: '6 weeks', students: '650+' },
  { title: 'Cloud Architecture Masterclass', level: 'Advanced', duration: '8 weeks', students: '1,500+' },
]

export default function LearningCenterPage() {
  return (
    <div className="py-20">
      <div className="container">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            AI{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Learning Center</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Free resources, tutorials, and courses to help you master AI, software development, and enterprise technology.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-16">
          {resources.map((r) => {
            const Icon = r.icon
            return (
              <div key={r.title} className="text-center p-6 rounded-2xl border hover:shadow-lg transition-all">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${r.color} p-3 mx-auto mb-4`}>
                  <Icon className="w-full h-full text-white" />
                </div>
                <div className="text-3xl font-bold text-primary">{r.count}</div>
                <h3 className="font-bold mt-1">{r.title}</h3>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
            )
          })}
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Popular Courses</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div key={course.title} className="p-6 rounded-2xl border hover:border-primary/50 hover:shadow-lg transition-all">
                <h3 className="font-bold text-lg mb-2">{course.title}</h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                  <span className="px-2 py-0.5 rounded-full bg-muted text-xs">{course.level}</span>
                  <span>{course.duration}</span>
                  <span>👥 {course.students}</span>
                </div>
                <Button variant="outline" size="sm" className="group">
                  <Play className="w-4 h-4 mr-1" /> Start Learning
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border">
          <h2 className="text-3xl font-bold mb-4">Start Learning Today</h2>
          <p className="text-muted-foreground mb-6">Access all resources for free.</p>
          <Link href="/contact"><Button size="lg" className="group">Get Started <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" /></Button></Link>
        </div>
      </div>
    </div>
  )
}