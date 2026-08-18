import { Pool } from 'pg'

const globalForWaveCore = globalThis as unknown as {
  wavecorePool?: Pool
}

export const pool =
  globalForWaveCore.wavecorePool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 50, // Increased from 20 for high concurrency
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    // Connection retry for reliability
    maxUses: 7500,
    allowExitOnIdle: true,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForWaveCore.wavecorePool = pool
}

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
})