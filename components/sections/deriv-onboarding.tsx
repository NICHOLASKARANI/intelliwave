'use client'

import { motion } from 'framer-motion'
import { 
  TrendingUp, Shield, Zap, Globe, ArrowRight, 
  UserPlus, CheckCircle, Lock, BarChart3, 
  Smartphone, HeadphonesIcon, BadgeCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const derivPartnerUrl = process.env.NEXT_PUBLIC_DERIV_PARTNER_URL || 'https://partner-tracking.deriv.com/click?a=50987&o=1&c=3&link_id=1'

const benefits = [
  { icon: Shield, title: 'Regulated Broker', desc: 'Deriv is licensed and regulated by multiple financial authorities worldwide.' },
  { icon: TrendingUp, title: '100+ Tradeable Assets', desc: 'Access forex, commodities, cryptocurrencies, stocks, and synthetic indices.' },
  { icon: Zap, title: 'Lightning Execution', desc: 'Trade with ultra-fast execution speeds under 10ms on average.' },
  { icon: Globe, title: 'Global Markets', desc: 'Trade markets worldwide including Africa, Europe, Asia, and the Americas.' },
  { icon: Smartphone, title: 'Trade Anywhere', desc: 'Full mobile trading capability on iOS, Android, and web platforms.' },
  { icon: HeadphonesIcon, title: '24/7 Support', desc: 'Round-the-clock customer support in multiple languages.' },
]

const securityBadges = [
  { icon: Lock, label: 'SSL Encrypted' },
  { icon: BadgeCheck, label: 'Licensed Broker' },
  { icon: Shield, label: 'Fund Protection' },
  { icon: BarChart3, label: 'Real-time Data' },
]

export function DerivOnboarding() {
  return (
    <section className="py-16 bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-950 dark:to-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-950 text-green-600 text-sm font-medium mb-6">
                <TrendingUp className="w-4 h-4" />
                <span>Powered by Deriv — Licensed & Regulated Broker</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-neutral-900 dark:text-white tracking-tight">
                IntelliWavve{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">Trader Intelligence</span>
              </h2>
              <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl">
                Professional trading powered by AI. Connect your Deriv account and trade with intelligent analytics, 
                automated strategies, and real-time market insights.
              </p>
            </motion.div>

            {/* Benefits Grid */}
            <div className="grid md:grid-cols-2 gap-4 mb-10">
              {benefits.map((benefit) => {
                const Icon = benefit.icon
                return (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-green-300 dark:hover:border-green-700 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-950 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">{benefit.title}</h3>
                      <p className="text-xs text-neutral-500 mt-0.5">{benefit.desc}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Sticky Sidebar — Desktop / Card — Mobile */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative p-8 rounded-2xl bg-white dark:bg-neutral-900 border-2 border-transparent shadow-2xl overflow-hidden"
                style={{
                  backgroundClip: 'padding-box',
                }}
              >
                {/* Animated gradient border */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 opacity-20 animate-pulse" style={{ zIndex: -1 }} />
                <div className="absolute inset-[2px] rounded-2xl bg-white dark:bg-neutral-900" style={{ zIndex: -1 }} />

                <div className="relative">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/25">
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">Welcome to Trading</h3>
                    <p className="text-sm text-neutral-500 mt-1">Secure trading through Deriv</p>
                  </div>

                  {/* Security Badges */}
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {securityBadges.map((badge) => {
                      const Icon = badge.icon
                      return (
                        <div key={badge.label} className="flex items-center gap-1.5 p-2 rounded-lg bg-green-50 dark:bg-green-950 text-xs text-green-700 dark:text-green-300">
                          <Icon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Trust Notice */}
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 mb-6 text-xs text-blue-700 dark:text-blue-300">
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    You will be redirected to Deriv&apos;s official secure login page. We never access your credentials.
                  </div>

                  {/* Buttons */}
                  <div className="space-y-3">
                    <a href={derivPartnerUrl} target="_blank" rel="noopener noreferrer">
                      <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white py-6 text-lg rounded-xl font-semibold shadow-lg shadow-green-500/25 group">
                        Continue with Deriv
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </a>
                    <a href={derivPartnerUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full py-4 rounded-xl border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950 group">
                        <UserPlus className="mr-2 w-4 h-4" />
                        Create a Deriv Account
                      </Button>
                    </a>
                  </div>

                  <p className="text-[10px] text-neutral-400 mt-4 text-center">
                    By continuing, you agree to Deriv&apos;s terms of service. Trading involves risk.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}