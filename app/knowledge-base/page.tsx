import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BookOpen, Search, FileText, HelpCircle, ArrowRight, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Knowledge Base - Help & Support | IntelliWave',
  description: 'Comprehensive knowledge base with guides, FAQs, and tutorials for IntelliWave products and services.',
}

const categories = [
  { icon: Zap, title: 'Getting Started', articles: 25, desc: 'Quick start guides and onboarding' },
  { icon: FileText, title: 'API & Integration', articles: 40, desc: 'API documentation and integration guides' },
  { icon: HelpCircle, title: 'Troubleshooting', articles: 35, desc: 'Common issues and solutions' },
  { icon: BookOpen, title: 'Best Practices', articles: 30, desc: 'Industry best practices and tips' },
]

const popularArticles = [
  'How to integrate M-Pesa payments',
  'Setting up your first AI model',
  'Cloud deployment checklist',
  'Security best practices guide',
  'IIoT sensor configuration',
  'API authentication setup',
]

export default function KnowledgeBasePage() {
  return (
    <div className="py-20">
      <div className="container">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 text-sm font-medium mb-6">
            <BookOpen className="w-4 h-4" /> Knowledge Base
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            How Can We{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Help You?</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Search our comprehensive knowledge base for guides, tutorials, and answers.
          </p>
          <div className="max-w-xl mx-auto mt-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for answers..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl border bg-background text-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-16">
          {categories.map((cat) => {
            const Icon = cat.icon
            return (
              <div key={cat.title} className="p-6 rounded-2xl border hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer text-center">
                <Icon className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-bold">{cat.title}</h3>
                <p className="text-xs text-muted-foreground mb-2">{cat.desc}</p>
                <span className="text-sm text-primary font-medium">{cat.articles} articles</span>
              </div>
            )
          })}
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Popular Articles</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {popularArticles.map((article) => (
              <div key={article} className="flex items-center gap-3 p-4 rounded-xl border hover:border-primary/30 hover:bg-muted/50 transition-all cursor-pointer">
                <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm">{article}</span>
                <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>

        <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border">
          <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
          <p className="text-muted-foreground mb-6">Our support team is available 24/7.</p>
          <Link href="/contact"><Button size="lg" className="group">Contact Support <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" /></Button></Link>
        </div>
      </div>
    </div>
  )
}