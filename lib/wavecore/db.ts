import { Pool } from 'pg'

const globalForWaveCore = globalThis as unknown as {
  wavecorePool?: Pool
}

export const pool =
  globalForWaveCore.wavecorePool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 100, // Increased from 50 for high concurrency
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    maxUses: 7500,
    allowExitOnIdle: true,
    statement_timeout: 10000,
    query_timeout: 10000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForWaveCore.wavecorePool = pool
}

pool.on('error', (err) => {
  console.error('Pool error:', err)
})

process.on('SIGTERM', async () => {
  await pool.end()
  process.exit(0)
})