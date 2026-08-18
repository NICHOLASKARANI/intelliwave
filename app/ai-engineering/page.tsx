import { Metadata } from 'next'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Brain, Cpu, BarChart3, CheckCircle, Zap, Bot, LineChart, Database, Globe, Users, TrendingUp } from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI Engineering Services - Enterprise ML & AI Solutions | IntelliWave',
  description: 'Custom AI engineering: machine learning, NLP, computer vision, enterprise AI systems. 500+ AI engineers across 100+ countries.',
}

const capabilities = [
  { icon: Brain, title: 'Machine Learning Models', desc: 'Custom ML models trained on your data for predictive analytics, classification, and optimization. Deployed in production with 99.7% accuracy.', features: ['Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning', 'Transfer Learning', 'AutoML Pipelines'], color: 'from-blue-600 to-cyan-600' },
  { icon: Bot, title: 'Natural Language Processing', desc: 'Text analysis, sentiment detection, chatbots, and document processing in English and Swahili with 95%+ accuracy.', features: ['Text Classification', 'Sentiment Analysis', 'Named Entity Recognition', 'Language Translation', 'Swahili NLP'], color: 'from-purple-600 to-pink-600' },
  { icon: Cpu, title: 'Computer Vision Systems', desc: 'Image recognition, object detection, and visual inspection systems for manufacturing quality control and security surveillance.', features: ['Object Detection', 'Image Classification', 'OCR Technology', 'Video Analytics', 'Real-time Processing'], color: 'from-green-600 to-emerald-600' },
  { icon: Zap, title: 'AI Process Automation', desc: 'Intelligent automation reducing manual work by up to 80%. Custom AI agents that handle repetitive tasks 24/7.', features: ['Workflow Automation', 'Document Processing', 'Decision Engines', 'RPA Integration', 'Custom AI Agents'], color: 'from-orange-600 to-red-600' },
]

const technologies = [
  'TensorFlow', 'PyTorch', 'Scikit-learn', 'OpenAI API', 'LangChain', 'Hugging Face',
  'Python', 'R', 'CUDA', 'ONNX', 'MLflow', 'Kubeflow', 'AWS SageMaker', 'Google Vertex AI'
]

const stats = [
  { icon: Brain, value: '50+', label: 'AI Models Deployed' },
  { icon: TrendingUp, value: '99.7%', label: 'Model Accuracy' },
  { icon: Zap, value: '1M+', label: 'Predictions Daily' },
  { icon: Globe, value: '100+', label: 'Countries Served' },
]

export default function AIEngineeringPage() {
  return (
    <div className="py-20">
      <div className="container">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 text-sm font-medium mb-6">
              <Brain className="w-4 h-4" /> AI Engineering Excellence
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              Enterprise{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                AI Engineering
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Custom machine learning models, NLP systems, computer vision solutions, and AI automation 
              built by 500+ engineers. Deployed in production across 100+ countries with enterprise reliability.
            </p>
            <div className="flex gap-4">
              <Link href="/contact">
                <Button size="lg" className="group">
                  Discuss Your AI Project
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/estimator">
                <Button size="lg" variant="outline">AI Cost Estimator</Button>
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-800 shadow-2xl">
            <Image
              src="/images/ai-engineering.jpg"
              alt="AI engineers building intelligent machine learning systems for enterprise applications"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <p className="font-semibold text-lg">AI Engineers Building Intelligent Systems</p>
              <p className="text-white/70 text-sm">Custom ML models deployed in production environments</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="text-center p-6 rounded-2xl border bg-background/50 hover:shadow-md transition-shadow">
                <Icon className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-primary">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            )
          })}
        </div>

        {/* Capabilities */}
        <div className="mb-24">
          <h2 className="text-4xl font-bold mb-12 text-center">AI Engineering Capabilities</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {capabilities.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="group p-8 rounded-2xl border hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-xl transition-all">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} p-3 mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-full h-full text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground mb-6">{item.desc}</p>
                  <div className="space-y-2">
                    {item.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Technology Stack */}
        <div className="mb-24 p-8 rounded-3xl border bg-gradient-to-br from-background to-indigo-500/5">
          <h2 className="text-3xl font-bold mb-6 text-center">Our AI Technology Stack</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {technologies.map((tech) => (
              <span key={tech} className="px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors cursor-default">
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Build Your AI System?</h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Our AI engineers will design and deploy a custom solution within weeks. Get a free consultation today.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100">Schedule Consultation <ArrowRight className="ml-2" /></Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">View Pricing</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}