import { Pool } from 'pg'

const globalForWaveCore = globalThis as unknown as {
  wavecorePool?: Pool
}

export const pool =
  globalForWaveCore.wavecorePool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 50, // High concurrency for millions of users
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    maxUses: 7500,
    allowExitOnIdle: true,
    statement_timeout: 10000, // 10 second query timeout
    query_timeout: 10000,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForWaveCore.wavecorePool = pool
}

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  await pool.end()
  process.exit(0)
})