import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { LiveChatWidget } from '@/components/features/live-chat-widget'
import { FloatingWhatsApp } from '@/components/features/floating-whatsapp'
import { AICopilot } from '@/components/features/ai-copilot'
import { CookieConsent } from '@/components/ui/cookie-consent'
import { BackToTop } from '@/components/ui/back-to-top'
import { FloatingActions } from '@/components/ui/floating-actions'
import { ScrollProgress } from '@/components/ui/scroll-progress'
import { AIGreeting } from '@/components/features/ai-greeting'
import { FloatingParticles } from '@/components/effects/floating-particles'
import { Toaster } from 'react-hot-toast'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.intelliwavve.com'),
  title: {
    default: 'IntelliWavve - Enterprise AI Platform | Building the Intelligent Operating System',
    template: '%s | IntelliWavve',
  },
  description: 'Enterprise AI solutions trusted by 450,000+ businesses across 100+ countries. SOC 2 Type II certified. Custom AI, ERP, IIoT, SaaS, and cloud infrastructure. Building the Intelligent Operating System for Governments, Global Enterprises, Financial Institutions, Healthcare Systems, Universities, and the Industries of Tomorrow.',
  keywords: ['enterprise AI', 'ERP', 'IIoT solutions', 'SaaS platform', 'AI consulting', 'cloud infrastructure', 'digital transformation', 'IntelliWavve', 'Nicholas Karani'],
  authors: [{ name: 'IntelliWavve Ltd', url: 'https://www.intelliwavve.com' }],
  creator: 'IntelliWavve',
  publisher: 'IntelliWavve Ltd',
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: 'https://www.intelliwavve.com',
    siteName: 'IntelliWavve',
    title: 'IntelliWavve - Enterprise AI Platform | Building the Intelligent Operating System',
    description: 'Enterprise AI solutions. SOC 2 Type II certified. 450,000+ users. 500+ engineers. Building the future of enterprise technology.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'IntelliWavve - Enterprise AI Platform' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IntelliWavve - Enterprise AI Platform',
    description: 'Building the Intelligent Operating System for global enterprises.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  manifest: '/site.webmanifest',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          {/* Premium Background */}
          <FloatingParticles />
          
          {/* Scroll Progress */}
          <ScrollProgress />
          
          {/* Main Layout */}
          <div className="relative flex min-h-screen flex-col z-10">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          
          {/* Floating UI Components */}
          <LiveChatWidget />
          <FloatingWhatsApp />
          <AICopilot />
          <FloatingActions />
          <BackToTop />
          <CookieConsent />
          <AIGreeting />
          
          {/* Premium Toasts */}
          <Toaster 
            position="top-right"
            toastOptions={{
              className: 'glass rounded-2xl border border-white/20',
              duration: 4000,
              style: { 
                background: 'rgba(255,255,255,0.05)', 
                backdropFilter: 'blur(20px)',
                color: 'var(--foreground)', 
                border: '1px solid rgba(255,255,255,0.1)' 
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}