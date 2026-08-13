import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { AnimationProvider } from '@/components/providers/animation-provider'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'IntelliWavve - AI, Software Development, Cybersecurity & Enterprise Solutions',
    template: '%s | IntelliWavve',
  },
  description: 'IntelliWavve is a global technology company specializing in AI Engineering, Software Development, Cybersecurity, Cloud & DevOps, and Enterprise Solutions including WaveCore ERP.',
  keywords: ['AI', 'Software Development', 'Cybersecurity', 'Cloud', 'DevOps', 'Enterprise', 'ERP', 'WaveCore', 'Business'],
  manifest: '/manifest.json',
  applicationName: 'IntelliWavve',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'WaveCore ERP',
  },
  icons: {
    icon: '/images/Wavecore.jpeg',
    shortcut: '/images/Wavecore.jpeg',
    apple: '/images/Wavecore.jpeg',
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
  openGraph: {
    title: 'IntelliWavve - Enterprise Technology Solutions',
    description: 'AI Engineering, Software Development, Cybersecurity, and WaveCore ERP.',
    type: 'website',
    locale: 'en_US',
    siteName: 'IntelliWavve',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IntelliWavve',
    description: 'Enterprise Technology Solutions',
  },
}

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="application-name" content="WaveCore ERP" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="WaveCore" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/images/Wavecore.jpeg" />
        <link rel="apple-touch-icon" href="/images/Wavecore.jpeg" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AnimationProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </AnimationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}