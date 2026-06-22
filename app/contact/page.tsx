'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Phone, Mail, MapPin, Clock, Send, Loader2, 
  CheckCircle, AlertCircle, MessageSquare, ArrowRight,
  Globe, Users, Zap
} from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (data.success) {
        setStatus('success')
        setFormData({ name: '', email: '', message: '' })
        setTimeout(() => setStatus('idle'), 5000)
      } else {
        setStatus('error')
        setErrorMessage(data.error || 'Something went wrong')
        setTimeout(() => setStatus('idle'), 5000)
      }
    } catch {
      setStatus('error')
      setErrorMessage('Network error. Please try again.')
      setTimeout(() => setStatus('idle'), 5000)
    }
  }

  return (
    <div className="py-20">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">24/7 Support Available</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Get in{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Touch</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We respond within 2 hours during business hours. Need immediate help? WhatsApp us.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-16 max-w-3xl mx-auto">
          {[
            { icon: Clock, value: '<2hrs', label: 'Response Time' },
            { icon: Users, value: '500+', label: 'Support Engineers' },
            { icon: Globe, value: '100+', label: 'Countries Served' },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="text-center p-4 rounded-xl border bg-background/50">
                <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            )
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Contact Info */}
          <div>
            <h2 className="text-3xl font-bold mb-8">Contact Information</h2>
            <div className="space-y-4">
              {[
                { icon: MapPin, label: 'Our Office', value: 'Nairobi CBD, Superior Centre\nShop F11, 1st Floor\nKenyatta Avenue, Kenya', href: null },
                { icon: Phone, label: 'WhatsApp', value: '+254 714 694 493', href: 'https://wa.me/254714694493', color: 'text-green-500' },
                { icon: Mail, label: 'Email', value: 'intelliwavehr@gmail.com', href: 'mailto:intelliwavehr@gmail.com' },
                { icon: Clock, label: 'Business Hours', value: 'Mon-Fri: 8AM-6PM\nSat: 9AM-1PM\nSun: Closed', href: null },
              ].map((item) => {
                const Icon = item.icon
                const content = (
                  <motion.div whileHover={{ x: 4 }} className="flex items-start gap-4 p-4 rounded-xl border hover:border-primary/50 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className={`w-6 h-6 ${item.color || 'text-primary'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{item.label}</h3>
                      <p className="text-muted-foreground text-sm whitespace-pre-line">{item.value}</p>
                    </div>
                  </motion.div>
                )
                return item.href ? (
                  <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer">{content}</a>
                ) : (
                  <div key={item.label}>{content}</div>
                )
              })}
            </div>
          </div>

          {/* Form */}
          <div>
            <h2 className="text-3xl font-bold mb-8">Send a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your full name" required
                  className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com" required
                  className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message *</label>
                <textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can we help you?" required rows={5}
                  className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none" />
              </div>
              <Button type="submit" disabled={status === 'loading' || status === 'success'}
                className="w-full py-6 text-lg rounded-xl group">
                {status === 'loading' ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending...</> :
                 status === 'success' ? <><CheckCircle className="w-5 h-5 mr-2" /> Sent Successfully!</> :
                 <><Send className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" /> Send Message</>}
              </Button>
              {status === 'success' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-green-50 dark:bg-green-950 border border-green-200 text-green-700 text-sm">
                  <CheckCircle className="w-4 h-4 inline mr-2" /> Message sent to intelliwavehr@gmail.com. We'll respond within 24 hours.
                </motion.div>
              )}
              {status === 'error' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 inline mr-2" /> {errorMessage}
                </motion.div>
              )}
            </form>
            <div className="mt-4 text-center text-sm">
              <a href="https://wa.me/254714694493" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-green-500 hover:text-green-600 font-medium">
                <Phone className="w-4 h-4" /> Chat on WhatsApp: +254 714 694 493
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}