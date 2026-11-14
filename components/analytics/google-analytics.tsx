'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

const GA_MEASUREMENT_ID = 'G-8H3SG8THMZ'

function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('cookie-consent') === 'all'
}

export function GoogleAnalytics() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (hasAnalyticsConsent()) {
      setEnabled(true)
    }
    const handler = () => {
      if (hasAnalyticsConsent()) setEnabled(true)
    }
    window.addEventListener('consent-changed', handler)
    return () => window.removeEventListener('consent-changed', handler)
  }, [])

  if (!enabled) return null

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: [
            'window.dataLayer = window.dataLayer || [];',
            'function gtag(){dataLayer.push(arguments);}',
            "gtag('js', new Date());",
            "gtag('config', '" + GA_MEASUREMENT_ID + "', {",
            '  page_path: window.location.pathname,',
            '});',
          ].join('\n'),
        }}
      />
    </>
  )
}