import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { LiveChatWidget } from '@/components/features/live-chat-widget'
import { FloatingWhatsApp } from '@/components/features/floating-whatsapp'
import { AICopilot } from '@/components/features/ai-copilot'
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
  description: 'Intelliwave is East Africa\'s leading AI software engineering company. Building enterprise SaaS, AI agents, cloud infrastructure, and custom web solutions.',
  keywords: ['AI development', 'software engineering', 'enterprise AI', 'SaaS development', 'web development Kenya'],
  authors: [{ name: 'Intelliwave', url: 'https://intelliwave.com' }],
  creator: 'Intelliwave',
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: 'https://intelliwave.com',
    siteName: 'Intelliwave',
    title: 'Intelliwave - Engineering the Future with AI',
    description: 'Building Africa\'s Global AI Giant',
  },
  icons: {
    icon: '/favicon.ico',
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
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}