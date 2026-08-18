import { Metadata } from 'next'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Brain, Cpu, BarChart3, CheckCircle, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI Engineering Services - Enterprise Machine Learning & AI Solutions',
  description: 'Custom AI engineering services including machine learning, NLP, computer vision, and enterprise AI systems. 500+ AI engineers.',
}

const capabilities = [
  {
    title: 'Machine Learning Models',
    description: 'Custom ML models trained on your data for predictive analytics, classification, and optimization.',
    features: ['Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning', 'Transfer Learning'],
  },
  {
    title: 'Natural Language Processing',
    description: 'Text analysis, sentiment detection, chatbots, and document processing in English and Swahili.',
    features: ['Text Classification', 'Sentiment Analysis', 'Named Entity Recognition', 'Language Translation'],
  },
  {
    title: 'Computer Vision',
    description: 'Image recognition, object detection, and visual inspection systems for manufacturing and security.',
    features: ['Object Detection', 'Image Classification', 'OCR', 'Video Analytics'],
  },
  {
    title: 'AI Automation',
    description: 'Intelligent process automation that reduces manual work by up to 80%.',
    features: ['Workflow Automation', 'Document Processing', 'Decision Engines', 'RPA Integration'],
  },
]

export default function AIEngineeringPage() {
  return (
    <div className="py-20">
      <div className="container">
        {/* Hero */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 text-sm font-medium mb-6">
              <Brain className="w-4 h-4" />
              AI Engineering Excellence
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              Enterprise{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                AI Engineering
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Custom machine learning models, NLP systems, and AI automation built by 
              500+ engineers. Deployed in production across 100+ countries.
            </p>
            <div className="flex gap-4">
              <Link href="/contact">
                <Button size="lg" className="group">
                  Discuss Your AI Project
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border shadow-2xl">
            <Image
              src="/images/ai-engineering.jpg"
              alt="AI engineers building intelligent machine learning systems for enterprise applications"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="text-white font-semibold text-lg">AI Engineers Building Intelligent Systems</p>
              <p className="text-white/70 text-sm">Custom ML models deployed in production</p>
            </div>
          </div>
        </div>

        {/* Capabilities */}
        <div className="mb-24">
          <h2 className="text-4xl font-bold mb-12 text-center">AI Engineering Capabilities</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {capabilities.map((item) => (
              <div key={item.title} className="p-8 rounded-2xl border hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
                <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground mb-4">{item.description}</p>
                <div className="space-y-2">
                  {item.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Build Your AI System?</h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Our AI engineers will design and deploy a custom solution within weeks.
          </p>
          <Link href="/contact">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100">
              Schedule a Consultation
              <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}