type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  requestId: string
  timestamp: string
  level: LogLevel
  message: string
  organizationId?: string
  userId?: string
  route?: string
  method?: string
  statusCode?: number
  durationMs?: number
  error?: string
  metadata?: Record<string, any>
}

const globalForLogger = globalThis as unknown as {
  wavecoreLogs: LogEntry[]
}

// In-memory store for recent logs (for admin viewing)
const recentLogs = globalForLogger.wavecoreLogs ?? []

if (process.env.NODE_ENV !== 'production') {
  globalForLogger.wavecoreLogs = recentLogs
}

// Keep only last 1000 logs
const MAX_LOGS = 1000

function generateRequestId(): string {
  const crypto = require('crypto') as typeof import('crypto')
  return crypto.randomBytes(8).toString('hex')
}

export function log(
  level: LogLevel,
  message: string,
  context?: Partial<LogEntry>
): void {
  const entry: LogEntry = {
    requestId: context?.requestId || generateRequestId(),
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  }

  // Store in memory
  recentLogs.push(entry)
  if (recentLogs.length > MAX_LOGS) {
    recentLogs.shift()
  }

  // Console output (structured JSON)
  const output = JSON.stringify({
    ...entry,
    // Never log passwords or tokens
    password: undefined,
    token: undefined,
    sessionToken: undefined,
  })

  switch (level) {
    case 'debug':
      console.debug(output)
      break
    case 'info':
      console.info(output)
      break
    case 'warn':
      console.warn(output)
      break
    case 'error':
      console.error(output)
      break
  }
}

export const logger = {
  debug: (message: string, context?: Partial<LogEntry>) => log('debug', message, context),
  info: (message: string, context?: Partial<LogEntry>) => log('info', message, context),
  warn: (message: string, context?: Partial<LogEntry>) => log('warn', message, context),
  error: (message: string, context?: Partial<LogEntry>) => log('error', message, context),
}

// Middleware helper for API routes
export function withRequestLogging(
  handler: (request: Request, ...args: any[]) => Promise<Response>,
  routeName: string
) {
  return async (request: Request, ...args: any[]) => {
    const startTime = Date.now()
    const requestId = generateRequestId()

    try {
      const response = await handler(request, ...args)
      const durationMs = Date.now() - startTime

      logger.info(`Request completed: ${routeName}`, {
        requestId,
        route: routeName,
        method: request.method,
        statusCode: response.status,
        durationMs,
      })

      return response
    } catch (error: any) {
      const durationMs = Date.now() - startTime

      logger.error(`Request failed: ${routeName}`, {
        requestId,
        route: routeName,
        method: request.method,
        durationMs,
        error: error.message,
      })

      throw error
    }
  }
}

// Get recent logs (for admin API)
export function getRecentLogs(limit: number = 100): LogEntry[] {
  return recentLogs.slice(-limit)
}