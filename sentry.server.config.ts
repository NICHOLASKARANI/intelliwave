import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  enabled: process.env.NODE_ENV === 'production',
  ignoreErrors: [
    'NEXT_NOT_FOUND',
    'NEXT_REDIRECT',
    'NEXT_HTTP_ERROR_FALLBACK',
  ],
})
