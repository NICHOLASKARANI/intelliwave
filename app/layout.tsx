import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Toaster } from '@/components/ui/toaster'

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
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: 'https://intelliwave.com',
    siteName: 'Intelliwave',
    title: 'Intelliwave - Engineering the Future with AI',
    description: 'Building Africa\'s Global AI Giant',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
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
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}