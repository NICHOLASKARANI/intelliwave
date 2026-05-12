import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Blog - AI & Software Engineering Insights',
  description: 'Latest articles on AI development, software engineering, and technology trends from Intelliwave experts.',
}

const posts = [
  {
    title: 'The Future of AI in African Enterprise',
    excerpt: 'How artificial intelligence is transforming businesses across Africa...',
    date: '2026-05-15',
    category: 'AI',
    slug: 'future-of-ai-africa',
  },
  {
    title: 'Building Scalable SaaS Platforms',
    excerpt: 'Best practices for building enterprise-grade SaaS applications...',
    date: '2026-05-10',
    category: 'Development',
    slug: 'scalable-saas-platforms',
  },
  {
    title: 'Cloud Infrastructure for Startups',
    excerpt: 'Choosing the right cloud architecture for your growing business...',
    date: '2026-05-05',
    category: 'Cloud',
    slug: 'cloud-infrastructure-startups',
  },
]

export default function BlogPage() {
  return (
    <div className="py-20">
      <div className="container">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">Latest from the Blog</h1>
          <p className="text-xl text-muted-foreground">
            Insights, tutorials, and updates from our team of 500+ AI engineers
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block p-6 border rounded-xl hover:border-primary/50 transition-colors"
            >
              <div className="text-sm text-primary mb-2">{post.category}</div>
              <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                {post.title}
              </h2>
              <p className="text-muted-foreground mb-4">{post.excerpt}</p>
              <div className="text-sm text-muted-foreground">
                {new Date(post.date).toLocaleDateString('en-KE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}