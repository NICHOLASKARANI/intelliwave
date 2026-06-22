import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Code2, Terminal, Key, BookOpen, ArrowRight, Copy } from 'lucide-react'

export const metadata: Metadata = {
  title: 'API Documentation - Developer Resources | IntelliWave',
  description: 'IntelliWave API documentation. REST and GraphQL APIs for AI, automation, and enterprise integration.',
}

const endpoints = [
  { method: 'POST', path: '/api/v1/ai/predict', desc: 'AI prediction endpoint' },
  { method: 'POST', path: '/api/v1/ai/estimate', desc: 'Project cost estimation' },
  { method: 'POST', path: '/api/v1/ai/chat', desc: 'AI chat assistant' },
  { method: 'POST', path: '/api/v1/contact', desc: 'Contact form submission' },
  { method: 'GET', path: '/api/v1/analytics', desc: 'Analytics data retrieval' },
  { method: 'POST', path: '/api/v1/projects', desc: 'Create new project' },
]

export default function APIDocsPage() {
  return (
    <div className="py-20">
      <div className="container">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 dark:bg-gray-950 text-gray-600 text-sm font-medium mb-6">
            <Terminal className="w-4 h-4" /> Developer Resources
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            API{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Documentation</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Integrate IntelliWave AI into your applications with our REST and GraphQL APIs.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-16">
          {[
            { icon: Key, title: 'Get API Key', desc: 'Request access to our APIs' },
            { icon: BookOpen, title: 'Guides', desc: 'Step-by-step integration guides' },
            { icon: Code2, title: 'SDKs', desc: 'Python, JavaScript, and more' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="text-center p-6 rounded-2xl border">
                <Icon className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-bold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            )
          })}
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Available Endpoints</h2>
          <div className="space-y-3">
            {endpoints.map((ep) => (
              <div key={ep.path} className="flex items-center justify-between p-4 rounded-xl border bg-background/50 hover:border-primary/30 transition-all">
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    ep.method === 'GET' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>{ep.method}</span>
                  <code className="text-sm">{ep.path}</code>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{ep.desc}</span>
                  <button className="p-1.5 hover:bg-muted rounded-lg"><Copy className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Build?</h2>
          <p className="text-white/80 mb-6">Get your API key and start integrating in minutes.</p>
          <Link href="/contact"><Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">Request API Access <ArrowRight className="ml-2" /></Button></Link>
        </div>
      </div>
    </div>
  )
}