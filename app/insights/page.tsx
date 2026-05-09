import { Metadata } from 'next'
import { TrendingUp, Search, BarChart3, LineChart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Insights - Market Intelligence & Analytics',
  description: 'Discover market insights, trending assets, and business intelligence. See what buyers search for.',
}

const insights = [
  { icon: TrendingUp, title: 'Trending Assets', value: 'AI SaaS Platforms', change: '+45%' },
  { icon: Search, title: 'Top Searches', value: 'Enterprise AI', change: '+32%' },
  { icon: BarChart3, title: 'Market Growth', value: 'Fintech Solutions', change: '+28%' },
  { icon: LineChart, title: 'Emerging Tech', value: 'AI Agents', change: '+67%' },
]

export default function InsightsPage() {
  return (
    <div className="py-20">
      <div className="container">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">Discover Insights</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            See what buyers search for and compare trending assets and categories
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {insights.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="border rounded-xl p-6 text-center">
                <Icon className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-2xl font-bold text-primary mb-2">{item.value}</p>
                <span className="text-green-500 text-sm">{item.change}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}