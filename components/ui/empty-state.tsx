import { Bot, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface EmptyStateProps {
  title?: string
  description?: string
  ctaText?: string
  ctaHref?: string
}

export function EmptyState({ 
  title = 'Nothing here yet', 
  description = 'This section is waiting for content.',
  ctaText = 'Get Started',
  ctaHref = '/contact'
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-6 animate-pulse">
        <Bot className="w-12 h-12 text-white" />
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      {ctaHref && (
        <Link href={ctaHref} className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors">
          {ctaText} <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  )
}