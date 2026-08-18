import './globals.css'

export const metadata = {
  title: 'IntelliWavve - World\'s Largest Software & Technology Company',
  description: 'WaveCore ERP, Marketplace, Wavve Ride - Complete Business Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}