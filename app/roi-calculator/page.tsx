'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Calculator, TrendingUp, DollarSign, ArrowRight } from 'lucide-react'

export default function ROICalculatorPage() {
  const [employees, setEmployees] = useState(50)
  const [hoursSaved, setHoursSaved] = useState(20)
  const [hourlyRate, setHourlyRate] = useState(500)

  const annualSavings = employees * hoursSaved * hourlyRate * 52
  const monthlySavings = annualSavings / 12

  return (
    <div className="py-20">
      <div className="container">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-950 text-green-600 text-sm font-medium mb-6">
            <Calculator className="w-4 h-4" /> ROI Calculator
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Calculate Your{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">ROI</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            See how much IntelliWave AI automation can save your business annually.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Number of Employees: {employees}</label>
              <input type="range" min="5" max="1000" value={employees} onChange={(e) => setEmployees(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Hours Saved/Week/Employee: {hoursSaved}</label>
              <input type="range" min="5" max="40" value={hoursSaved} onChange={(e) => setHoursSaved(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Hourly Rate (KSh): {hourlyRate}</label>
              <input type="range" min="100" max="5000" step="100" value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} className="w-full" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-green-50 dark:bg-green-950 border border-green-200 text-center">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-4xl font-bold text-green-600">KSh {annualSavings.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Annual Savings</div>
            </div>
            <div className="p-6 rounded-2xl bg-blue-50 dark:bg-blue-950 border border-blue-200 text-center">
              <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-4xl font-bold text-blue-600">KSh {monthlySavings.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Monthly Savings</div>
            </div>
            <Link href="/contact">
              <Button size="lg" className="w-full group">
                Get Exact Quote <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}