import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Portfolio - Our Work & Case Studies',
  description: 'Explore our portfolio of AI software projects, enterprise applications, and successful client partnerships.',
}

const projects = [
  { title: 'Enterprise AI Platform', category: 'AI Development', client: 'Fortune 500 Company' },
  { title: 'E-commerce Marketplace', category: 'Web Development', client: 'Major Retailer' },
  { title: 'Fintech Mobile App', category: 'Mobile Development', client: 'Banking Institution' },
  { title: 'Cloud Migration', category: 'Cloud Infrastructure', client: 'Tech Startup' },
  { title: 'Healthcare Portal', category: 'Enterprise App', client: 'Hospital Network' },
  { title: 'LMS Platform', category: 'Education Tech', client: 'University' },
]

export default function PortfolioPage() {
  return (
    <div className="py-20">
      <div className="container">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">Our Portfolio</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Showcasing 10,000+ successful projects delivered to clients worldwide
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.title} className="border rounded-xl p-6 hover:border-primary/50 transition-colors">
              <div className="text-sm text-primary mb-2">{project.category}</div>
              <h3 className="text-xl font-bold mb-2">{project.title}</h3>
              <p className="text-muted-foreground">{project.client}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}