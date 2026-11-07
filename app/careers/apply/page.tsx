import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, ArrowLeft, Mail, Clock, Sparkles, Users, Briefcase } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Apply - Careers at Intelliwave',
  description: 'Learn about career opportunities and application process at Intelliwave.',
}

export default function ApplyPage() {
  return (
    <div className="min-h-screen py-20 bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link href="/careers" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Careers
        </Link>

        {/* Hero card */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden">
          {/* Header banner */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 md:p-12 text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" /> Hiring Paused
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Thanks for Your Interest
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl">
              We&apos;re not actively reviewing applications at this time. However, we would love to hear from you.
            </p>
          </div>

          {/* Body */}
          <div className="p-8 md:p-12">
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <div className="text-center p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="font-bold text-neutral-900 dark:text-white mb-1">Growing Fast</p>
                <p className="text-xs text-muted-foreground">500+ team members</p>
              </div>

              <div className="text-center p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="font-bold text-neutral-900 dark:text-white mb-1">Check Back Soon</p>
                <p className="text-xs text-muted-foreground">New roles opening</p>
              </div>

              <div className="text-center p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50">
                <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center mx-auto mb-3">
                  <Briefcase className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <p className="font-bold text-neutral-900 dark:text-white mb-1">Multiple Departments</p>
                <p className="text-xs text-muted-foreground">Engineering, Design, and more</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl border-2 border-dashed border-indigo-500/30 bg-indigo-500/5 mb-8">
              <h2 className="text-xl font-bold mb-2 text-neutral-900 dark:text-white">
                What You Can Do Now
              </h2>
              <p className="text-muted-foreground mb-4">
                While we&apos;re not actively reviewing applications, you can still reach out to us. We keep in touch with talented people who reach out directly.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">→</span>
                  <span className="text-neutral-700 dark:text-neutral-300">Email us at <a href="mailto:sales@intelliwavve.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">sales@intelliwavve.com</a> with your CV and what you&apos;re looking for</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">→</span>
                  <span className="text-neutral-700 dark:text-neutral-300">Follow us on social media for hiring announcements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">→</span>
                  <span className="text-neutral-700 dark:text-neutral-300">Check this page again — roles open periodically</span>
                </li>
              </ul>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/contact" className="flex-1">
                <Button size="lg" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white group">
                  <Mail className="mr-2 w-5 h-5" /> Contact Us <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/careers" className="flex-1">
                <Button size="lg" variant="outline" className="w-full">
                  Browse Role Descriptions
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          We appreciate your interest in joining Intelliwave.
        </p>
      </div>
    </div>
  )
}