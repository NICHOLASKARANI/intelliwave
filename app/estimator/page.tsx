'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

const services = [
  { id: 'web', name: 'Business Website' },
  { id: 'ecommerce', name: 'E-Commerce' },
  { id: 'webapp', name: 'Web Application' },
]

export default function EstimatorPage() {
  const [selected, setSelected] = useState('')
  const [complexity, setComplexity] = useState('medium')
  const [price, setPrice] = useState(0)

  const calculate = () => {
    let base = selected === 'webapp' ? 300000 : 100000
    let multiplier = complexity === 'high' ? 3 : 1.5
    let estimate = base * multiplier
    setPrice(estimate)
    toast.success('Estimate generated! Book a call for exact pricing.', { icon: '💰' })
  }

  return (
    <div className="py-20 container max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">AI Project Estimator</h1>
      <div className="grid gap-6 bg-card p-8 rounded-2xl border shadow-lg">
        <div>
          <label className="block text-sm mb-2 font-medium">Project Type</label>
          <div className="grid grid-cols-3 gap-2">
            {services.map(s => (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className={`p-3 rounded-lg border text-sm transition-all ${
                  selected === s.id ? 'bg-primary text-white border-primary' : 'bg-background hover:border-primary'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm mb-2 font-medium">Complexity</label>
          <select 
            value={complexity} 
            onChange={(e) => setComplexity(e.target.value)}
            className="w-full p-3 rounded-lg border bg-background"
          >
            <option value="low">Low (Basic)</option>
            <option value="medium">Medium (Advanced)</option>
            <option value="high">High (Enterprise)</option>
          </select>
        </div>
        <Button onClick={calculate} size="lg" className="w-full">Get Estimate</Button>
        {price > 0 && (
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            className="text-center p-4 bg-green-500/10 rounded-xl border border-green-500/20"
          >
            <span className="text-sm text-muted-foreground">Estimated from</span>
            <p className="text-3xl font-bold text-primary">KSh {price.toLocaleString()}+</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}