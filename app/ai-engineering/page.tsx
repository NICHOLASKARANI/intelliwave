import { Metadata } from 'next'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Brain, Cpu, BarChart3, CheckCircle, Zap, Bot, LineChart, Database } from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI Engineering Services - Enterprise ML & AI Solutions',
  description: 'Custom AI engineering: machine learning, NLP, computer vision, enterprise AI systems. 500+ AI engineers.',
}

const capabilities = [
  { icon: Brain, title: 'Machine Learning', desc: 'Custom ML models for predictive analytics, classification, and optimization.', features: ['Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning', 'Transfer Learning'] },
  { icon: Bot, title: 'Natural Language Processing', desc: 'Text analysis, chatbots, document processing in English and Swahili.', features: ['Text Classification', 'Sentiment Analysis', 'NER', 'Translation'] },
  { icon: Cpu, title: 'Computer Vision', desc: 'Image recognition, object detection, visual inspection systems.', features: ['Object Detection', 'Image Classification', 'OCR', 'Video Analytics'] },
  { icon: Zap, title: 'AI Automation', desc: 'Intelligent process automation reducing manual work by up to 80%.', features: ['Workflow Automation', 'Document Processing', 'Decision Engines', 'RPA Integration'] },
]

const stats = [
  { value: '50+', label: 'AI Models Deployed' },
  { value: '99.7%', label: 'Model Accuracy' },
  { value: '1M+', label: 'Predictions Daily' },
  { value: '<100ms', label: 'Inference Time' },
]

export default function AIEngineeringPage() {
  return (
    <div className="py-20">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 text-sm font-medium mb-6">
              <Brain className="w-4 h-4" /> AI Engineering Excellence
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Enterprise <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">AI Engineering</span></h1>
            <p className="text-xl text-muted-foreground mb-8">Custom machine learning models, NLP systems, and AI automation built by 500+ engineers across 100+ countries.</p>
            <div className="flex gap-4">
              <Link href="/contact"><Button size="lg" className="group">Discuss Your Project <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" /></Button></Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border shadow-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
            <Brain className="w-32 h-32 text-white/30" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <p className="font-semibold text-lg">AI Engineers Building Intelligent Systems</p>
              <p className="text-white/70 text-sm">Custom ML models deployed in production</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-16">
          {stats.map((s) => (
            <div key={s.label} className="text-center p-6 rounded-2xl border bg-background/50">
              <div className="text-3xl font-bold text-primary">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mb-24">
          <h2 className="text-4xl font-bold mb-12 text-center">AI Capabilities</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {capabilities.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="p-8 rounded-2xl border hover:border-indigo-300 transition-all">
                  <Icon className="w-10 h-10 text-indigo-600 mb-4" />
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground mb-4">{item.desc}</p>
                  <div className="space-y-2">
                    {item.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" />{f}</div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Build Your AI System?</h2>
          <p className="text-white/80 mb-6">Our AI engineers will design and deploy a custom solution within weeks.</p>
          <Link href="/contact"><Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100">Schedule Consultation <ArrowRight className="ml-2" /></Button></Link>
        </div>
      </div>
    </div>
  )
}