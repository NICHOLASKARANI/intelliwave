'use client'

import { motion } from 'framer-motion'
import { Quote, Star } from 'lucide-react'

const insights = [
  {
    quote: "Intelliwave's AI solutions have fundamentally transformed how we approach customer service. Our response time dropped by 80%.",
    name: 'James Mwangi',
    role: 'CEO, Leading Bank Kenya',
    avatar: '👨‍💼',
    rating: 5,
  },
  {
    quote: "The custom ERP system built by Intelliwave saved us KSh 50 million annually in operational costs. Truly world-class engineering.",
    name: 'Sarah Wanjiku',
    role: 'Managing Director, Manufacturing Group',
    avatar: '👩‍💼',
    rating: 5,
  },
  {
    quote: "What sets Intelliwave apart is their deep understanding of both technology and the African business landscape.",
    name: 'Dr. Peter Kimani',
    role: 'Executive Chairman, Healthcare Network',
    avatar: '👨‍⚕️',
    rating: 5,
  },
]

export function ExecutiveInsightsSection() {
  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Executive{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Insights
          </span>
        </h2>
        <p className="text-xl text-muted-foreground">
          What Kenyan employers and executives are saying about Intelliwave
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {insights.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.15 }}
            className="p-6 rounded-2xl border bg-background/50 relative"
          >
            <Quote className="w-10 h-10 text-primary/20 absolute top-4 right-4" />
            <div className="flex gap-1 mb-4">
              {[...Array(item.rating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
              ))}
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed italic">
              "{item.quote}"
            </p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl">
                {item.avatar}
              </div>
              <div>
                <p className="font-bold text-sm">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}