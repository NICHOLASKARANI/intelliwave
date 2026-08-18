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
import { GoogleAnalytics } from '@/components/analytics/google-analytics'
import { Toaster } from 'react-hot-toast'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.intelliwavve.com'),
  title: {
    default: 'IntelliWavve - Global Enterprise AI & Software Company | Building the Intelligent Operating System',
    template: '%s | IntelliWavve',
  },
  description: 'IntelliWavve is a global enterprise AI and software company. Building the Intelligent Operating System for governments, financial institutions, healthcare systems, universities, and enterprises worldwide. Custom AI, ERP, IIoT, SaaS, and cloud infrastructure.',
  keywords: [
    'global software company',
    'enterprise AI platform',
    'AI software company Kenya',
    'enterprise software development',
    'AI consulting Africa',
    'cloud infrastructure',
    'digital transformation',
    'IIoT solutions',
    'SaaS platform',
    'ERP systems',
    'IntelliWavve',
    'Nicholas Karani',
  ],
  authors: [{ name: 'IntelliWavve Ltd', url: 'https://www.intelliwavve.com' }],
  creator: 'IntelliWavve Technologies',
  publisher: 'IntelliWavve Ltd',
  formatDetection: {
    email: false,
    address: true,
    telephone: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: 'https://www.intelliwavve.com',
    siteName: 'IntelliWavve Technologies',
    title: 'IntelliWavve - Global Enterprise AI & Software Company',
    description: 'Building the Intelligent Operating System for governments, global enterprises, financial institutions, healthcare systems, universities, and the industries of tomorrow.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'IntelliWavve - Global Enterprise AI & Software Company',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IntelliWavve - Global Enterprise AI & Software Company',
    description: 'Building the Intelligent Operating System for global enterprises.',
    images: ['/og-image.jpg'],
    creator: '@intelliwavve',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: '5oLFtXvlAqeiV5AWkLpxYBWVHNF99XodEa8IMh2YS1k',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  category: 'technology',
  other: {
    'og:type': 'website',
    'business:contact_data:street_address': 'Kenyatta Avenue, Superior Centre, 1st Floor',
    'business:contact_data:locality': 'Nairobi',
    'business:contact_data:region': 'Nairobi CBD',
    'business:contact_data:country_name': 'Kenya',
    'business:contact_data:phone_number': '+254714694493',
    'business:contact_data:website': 'https://www.intelliwavve.com',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="google-site-verification" content="5oLFtXvlAqeiV5AWkLpxYBWVHNF99XodEa8IMh2YS1k" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          {/* Google Analytics — Option 2: Google tag in website code */}
          <GoogleAnalytics />
          
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