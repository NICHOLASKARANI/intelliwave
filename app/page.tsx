'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { 
  ArrowRight, Sparkles, Zap, Globe, Users, Code2, Cpu,
  Star, HeadphonesIcon, Rocket, Award, Shield, Cloud
} from "lucide-react"
import Link from "next/link"

// Import NEW Cinematic Effects
import { CinematicHero } from '@/components/sections/cinematic-hero'
import { CinematicHomepage } from '@/components/sections/cinematic-homepage'
import { ParticleSystem } from '@/components/effects/particle-system'

// Import your existing features (keep these intact)
import { AIDemoSandbox } from '@/components/features/ai-demo-sandbox'
import { GlobalActivityFeed } from '@/components/features/global-activity-feed'
import { ProjectCommandCenter } from '@/components/features/project-command-center'
import { SecurityPavilion } from '@/components/features/security-pavilion'
import { InstitutionLogos } from '@/components/features/institution-logos'
import { AIMLShowcase } from '@/components/features/ai-ml-showcase'
import { MissionVisionSection } from '@/components/sections/mission-vision-section'
import { ExecutiveInsightsSection } from '@/components/sections/executive-insights-section'
import { CorporateTrainingSection } from '@/components/sections/corporate-training-section'
import { HRServicesSection } from '@/components/sections/hr-services-section'

const services = [
  { icon: Cpu, title: 'AI Development', color: 'from-blue-500 to-cyan-500' },
  { icon: Globe, title: 'Web Development', color: 'from-purple-500 to-pink-500' },
  { icon: Cloud, title: 'Cloud Infrastructure', color: 'from-cyan-500 to-blue-500' },
  { icon: Shield, title: 'Cybersecurity', color: 'from-green-500 to-emerald-500' },
  { icon: Code2, title: 'SaaS Platforms', color: 'from-orange-500 to-red-500' },
  { icon: Zap, title: 'AI Automation', color: 'from-yellow-500 to-orange-500' },
]

const partners = ['Microsoft', 'Tesla', 'NVIDIA', 'Meta', 'SpaceX', 'GST']

export default function HomePage() {
  return (
    <div className="overflow-hidden relative">
      {/* ========== NEW: GLOBAL PARTICLE BACKGROUND ========== */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <ParticleSystem />
      </div>

      {/* ========== NEW: CINEMATIC HERO SECTION ========== */}
      <CinematicHero />

      {/* ========== GLOBAL ACTIVITY FEED ========== */}
      <section className="container py-6 relative z-10">
        <GlobalActivityFeed />
      </section>

      {/* ========== PARTNERS BAR ========== */}
      <section className="py-12 border-y bg-secondary/5 backdrop-blur-xl relative z-10">
        <div className="container">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm text-muted-foreground mb-6">
            TRUSTED BY INDUSTRY LEADERS
          </motion.p>
          <div className="flex flex-wrap justify-center items-center gap-12">
            {partners.map((partner, index) => (
              <motion.div key={partner} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                {partner}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SERVICES SECTION ========== */}
      <section className="py-24 relative overflow-hidden z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        <div className="container relative">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              Our <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Services</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Comprehensive AI-powered solutions for modern enterprises</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => {
              const Icon = service.icon
              return (
                <motion.div key={service.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} whileHover={{ scale: 1.02, y: -5 }} className="group relative p-6 rounded-2xl border bg-background/50 backdrop-blur-xl hover:border-primary/50 transition-all cursor-pointer overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} p-3 mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-full h-full text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                    <Link href="/services" className="inline-flex items-center text-primary hover:underline text-sm font-medium">
                      Learn more
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ========== NEW: CINEMATIC HOMEPAGE (3D GLOBE & MISSION) ========== */}
      <div className="relative z-10">
        <CinematicHomepage />
      </div>

      {/* ========== AI INTERACTIVE TOOLS ========== */}
      <section className="py-24 bg-gradient-to-b from-background to-primary/5 relative z-10">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Experience Our <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">AI Engine</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">See the power of our AI in action — no signup required</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <AIDemoSandbox />
            <AIDemoSandbox />
          </div>
        </div>
      </section>

      {/* ========== AI/ML SHOWCASE ========== */}
      <section className="py-24 bg-gradient-to-b from-secondary/5 to-background relative z-10">
        <div className="container">
          <AIMLShowcase />
        </div>
      </section>

      {/* ========== PROJECT COMMAND CENTER ========== */}
      <section className="py-24 relative z-10">
        <div className="container">
          <ProjectCommandCenter />
        </div>
      </section>

      {/* ========== MISSION & VISION ========== */}
      <section className="py-24 bg-gradient-to-b from-secondary/5 to-background relative z-10">
        <div className="container">
          <MissionVisionSection />
        </div>
      </section>

      {/* ========== EXECUTIVE INSIGHTS ========== */}
      <section className="py-24 bg-gradient-to-b from-background to-primary/5 relative z-10">
        <div className="container">
          <ExecutiveInsightsSection />
        </div>
      </section>

      {/* ========== SECURITY PAVILION ========== */}
      <section className="py-24 relative z-10">
        <div className="container">
          <SecurityPavilion />
        </div>
      </section>

      {/* ========== CORPORATE TRAINING ========== */}
      <section className="py-24 bg-gradient-to-b from-secondary/5 to-background relative z-10">
        <div className="container">
          <CorporateTrainingSection />
        </div>
      </section>

      {/* ========== HR SERVICES ========== */}
      <section className="py-24 relative z-10">
        <div className="container">
          <HRServicesSection />
        </div>
      </section>

      {/* ========== INSTITUTION LOGOS ========== */}
      <section className="py-24 bg-gradient-to-b from-background to-primary/5 relative z-10">
        <div className="container">
          <InstitutionLogos />
        </div>
      </section>

      {/* ========== CTA SECTION ========== */}
      <section className="py-24 relative overflow-hidden z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20" />
        <div className="container relative text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Ready to <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Build the Future</span>?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join 450,000+ businesses already growing with Intelliwave. Our 500+ AI engineers are ready to support your project.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="bg-primary hover:bg-primary/90 px-8 py-6 text-lg group">
                  Get Free Consultation
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="https://wa.me/254714694493" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg backdrop-blur-xl">
                  <HeadphonesIcon className="mr-2" /> WhatsApp: +254 714 694 493
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}