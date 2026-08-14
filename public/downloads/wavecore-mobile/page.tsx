import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Smartphone, Download, CheckCircle, Shield, Zap, Globe } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Download WaveCore ERP Mobile App | IntelliWavve',
  description: 'Download the WaveCore ERP Android app for your business. Manage finances, customers, inventory, and more from your phone.',
}

export default function WaveCoreDownloadPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-20">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="relative w-20 h-20 mx-auto mb-6 rounded-2xl overflow-hidden border-4 border-indigo-200 shadow-2xl">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore ERP" width={80} height={80} className="object-cover" />
          </div>
          <h1 className="text-4xl font-bold mb-2">WaveCore ERP Mobile</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Take your business with you. Manage finances, customers, inventory, and more from your Android device.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { icon: Smartphone, label: 'Mobile First', desc: 'Built for Android' },
            { icon: Shield, label: 'Secure', desc: 'Enterprise-grade encryption' },
            { icon: Zap, label: 'Fast', desc: 'Real-time data sync' },
            { icon: Globe, label: 'Multi-tenant', desc: 'Complete data isolation' },
          ].map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.label} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
                <Icon className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
                <p className="font-bold text-sm">{feature.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{feature.desc}</p>
              </div>
            )
          })}
        </div>

        {/* What's Included */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-10">
          <h2 className="font-bold text-lg mb-4">What's Included:</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              'Executive Dashboard',
              'Finance & Accounting',
              'CRM & Sales',
              'Inventory Management',
              'Employee Management',
              'Project Management',
              'Invoice Creation',
              'Payment Recording',
              'Real-time Notifications',
              'Dark/Light Mode',
              'Secure Login',
              'Organization Switching',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Download Button */}
        <div className="text-center">
          <a
            href="https://github.com/NICHOLASKARANI/intelliwave/releases/latest/download/app-release.apk"
            download="WaveCore-ERP.apk"
            className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-indigo-500/30 transition-all hover:scale-105"
          >
            <Download className="w-6 h-6" />
            Download Android App (47.5 MB)
          </a>
          <p className="text-sm text-muted-foreground mt-4">
            Android 7.0+ required • Version 1.0.0 • Free Download
          </p>
        </div>

        {/* Installation Instructions */}
        <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl p-6 mt-10">
          <h3 className="font-bold mb-3">How to Install:</h3>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Tap the "Download Android App" button above</li>
            <li>Open the downloaded APK file</li>
            <li>If prompted, allow "Install from unknown sources" in your settings</li>
            <li>Tap "Install"</li>
            <li>Open WaveCore ERP and sign in with your account</li>
          </ol>
        </div>
      </div>
    </div>
  )
}