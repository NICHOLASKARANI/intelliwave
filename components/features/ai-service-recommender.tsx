'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Check, ChevronLeft, Sparkles } from 'lucide-react'

const steps = [
  {
    question: "What's your primary goal?",
    options: [
      { label: 'Automate Business Processes', icon: '⚡' },
      { label: 'Build a SaaS Product', icon: '🚀' },
      { label: 'Modernize Legacy Systems', icon: '🔄' },
      { label: 'AI-Powered Innovation', icon: '🧠' },
    ],
  },
  {
    question: "What's your timeline?",
    options: [
      { label: 'Immediate (ASAP)', icon: '🔥' },
      { label: '1-3 Months', icon: '📅' },
      { label: '3-6 Months', icon: '🗓️' },
      { label: 'Strategic Long-Term', icon: '🎯' },
    ],
  },
  {
    question: 'Expected scale?',
    options: [
      { label: 'Startup (1-100 users)', icon: '🌱' },
      { label: 'Growing (1,000+)', icon: '📈' },
      { label: 'Enterprise (100,000+)', icon: '🏢' },
      { label: 'Global (Millions)', icon: '🌍' },
    ],
  },
]

const recommendations: Record<string, { service: string; price: string; timeline: string }> = {
  'Automate Business Processes-Immediate (ASAP)-Startup (1-100 users)': {
    service: 'AI Automation Starter',
    price: 'KSh 150,000 - 300,000',
    timeline: '2-4 weeks',
  },
  'Automate Business Processes-Immediate (ASAP)-Growing (1,000+)': {
    service: 'Enterprise Automation Suite',
    price: 'KSh 500,000 - 1,500,000',
    timeline: '4-8 weeks',
  },
  'Build a SaaS Product-1-3 Months-Growing (1,000+)': {
    service: 'SaaS Development Platform',
    price: 'KSh 300,000 - 3,000,000',
    timeline: '8-16 weeks',
  },
  'AI-Powered Innovation-Strategic Long-Term-Global (Millions)': {
    service: 'Global AI Infrastructure',
    price: 'KSh 3,000,000+',
    timeline: '16-24 weeks',
  },
  'Build a SaaS Product-Immediate (ASAP)-Enterprise (100,000+)': {
    service: 'Enterprise SaaS Suite',
    price: 'KSh 1,000,000 - 5,000,000',
    timeline: '8-16 weeks',
  },
}

export function AIServiceRecommender() {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [showResult, setShowResult] = useState(false)

  const selectAnswer = (answer: string) => {
    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)
    
    if (currentStep < steps.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 300)
    } else {
      setTimeout(() => setShowResult(true), 500)
    }
  }

  const goBack = () => {
    if (showResult) {
      setShowResult(false)
      setAnswers(answers.slice(0, -1))
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setAnswers(answers.slice(0, -1))
    }
  }

  const reset = () => {
    setCurrentStep(0)
    setAnswers([])
    setShowResult(false)
  }

  const recommendationKey = answers.join('-')
  const recommendation = recommendations[recommendationKey] || {
    service: 'Custom Enterprise Solution',
    price: 'Contact for quote',
    timeline: 'Custom timeline',
  }

  return (
    <div className="rounded-2xl border bg-gradient-to-br from-background via-background to-accent/5 p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold">AI Service Matcher</h3>
          <p className="text-sm text-muted-foreground">Find your perfect solution in 30 seconds</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex gap-1 mb-8">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              i < currentStep
                ? 'bg-green-500'
                : i === currentStep
                ? 'bg-primary'
                : 'bg-muted'
            }`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-2">
          {currentStep + 1}/{steps.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {!showResult ? (
          <motion.div
            key="question"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <h4 className="text-lg font-semibold mb-6">
              {steps[currentStep].question}
            </h4>
            <div className="grid gap-3">
              {steps[currentStep].options.map((option) => (
                <button
                  key={option.label}
                  onClick={() => selectAnswer(option.label)}
                  className="flex items-center gap-4 p-4 rounded-xl border hover:border-primary hover:bg-primary/5 transition-all text-left group"
                >
                  <span className="text-2xl">{option.icon}</span>
                  <span className="font-medium flex-1">{option.label}</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"
            >
              <Check className="w-10 h-10 text-green-500" />
            </motion.div>
            <h4 className="text-2xl font-bold mb-2">{recommendation.service}</h4>
            <p className="text-muted-foreground mb-6">
              Based on your requirements, we recommend this solution.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Est. Price</p>
                <p className="font-bold text-primary">{recommendation.price}</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Timeline</p>
                <p className="font-bold">{recommendation.timeline}</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Team Size</p>
                <p className="font-bold">Dedicated Team</p>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={reset} className="px-6 py-2 border rounded-lg hover:bg-muted transition-colors text-sm">
                Start Over
              </button>
              <a
                href="https://wa.me/254714694493"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
              >
                Book Consultation
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back Button */}
      {(currentStep > 0 || showResult) && !showResult && (
        <button
          onClick={goBack}
          className="mt-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
      )}
    </div>
  )
}