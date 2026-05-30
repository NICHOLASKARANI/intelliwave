import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { LiveChatWidget } from '@/components/features/live-chat-widget'
import { FloatingWhatsApp } from '@/components/features/floating-whatsapp'
import { Toaster } from 'react-hot-toast'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://intelliwave.com'),
  title: {
    default: 'Intelliwave - Engineering the Future with AI | Enterprise AI & Software',
    template: '%s | Intelliwave',
  },
  description: 'Intelliwave is East Africa\'s leading AI software engineering company. Building enterprise SaaS, AI agents, cloud infrastructure, and custom web solutions. Trusted by Microsoft, Tesla, NVIDIA, and 450,000+ businesses globally.',
  keywords: [
    'AI development',
    'software engineering',
    'enterprise AI',
    'SaaS development',
    'web development Kenya',
    'AI agents',
    'cloud hosting',
    'ERP systems',
    'fintech solutions',
    'Nicholas Karani',
    'Intelliwave',
  ],
  authors: [{ name: 'Intelliwave', url: 'https://intelliwave.com' }],
  creator: 'Intelliwave',
  publisher: 'Intelliwave',
  formatDetection: {
    email: false,
    address: true,
    telephone: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: 'https://intelliwave.com',
    siteName: 'Intelliwave',
    title: 'Intelliwave - Engineering the Future with AI',
    description: 'Building Africa\'s Global AI Giant. Enterprise AI, SaaS, Cloud & Software Solutions.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Intelliwave - AI Software Engineering',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Intelliwave - Engineering the Future with AI',
    description: 'Building Africa\'s Global AI Giant',
    images: ['/og-image.jpg'],
    creator: '@intelliwave',
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
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>

          {/* Live Chat Widget */}
          <LiveChatWidget />

          {/* Floating WhatsApp Button */}
          <FloatingWhatsApp />

          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'bg-background text-foreground border',
              duration: 4000,
              style: {
                background: 'var(--background)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}