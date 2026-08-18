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
import { Toaster } from 'react-hot-toast'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://intelliwave.com'),
  title: {
    default: 'IntelliWave - Enterprise AI Solutions | SOC 2 Certified | 10,000+ Projects',
    template: '%s | IntelliWave',
  },
  description: 'Enterprise AI solutions trusted by 450,000+ businesses across 100+ countries. SOC 2 Type II certified. Custom AI, IIoT, SaaS, and cloud infrastructure.',
  keywords: ['enterprise AI', 'SOC 2 certified', 'IIoT solutions', 'SaaS development', 'AI consulting Kenya', 'cloud infrastructure'],
  authors: [{ name: 'IntelliWave Ltd', url: 'https://intelliwave.com' }],
  creator: 'IntelliWave',
  publisher: 'IntelliWave Ltd',
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: 'https://intelliwave.com',
    siteName: 'IntelliWave',
    title: 'IntelliWave - Enterprise AI Solutions | 10,000+ Projects Delivered',
    description: 'Enterprise AI solutions. SOC 2 Type II certified. 450,000+ users. 500+ engineers.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'IntelliWave - Enterprise AI Platform' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IntelliWave - Enterprise AI Solutions',
    description: 'SOC 2 Type II certified. 10,000+ projects delivered.',
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
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <LiveChatWidget />
          <FloatingWhatsApp />
          <AICopilot />
          <FloatingActions />
          <BackToTop />
          <CookieConsent />
          <Toaster 
            position="top-right"
            toastOptions={{
              className: 'bg-background text-foreground border',
              duration: 4000,
              style: { background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)' },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}