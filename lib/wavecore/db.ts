import { Pool } from 'pg'

const globalForWaveCore = globalThis as unknown as {
  wavecorePool?: Pool
}

export const pool =
  globalForWaveCore.wavecorePool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForWaveCore.wavecorePool = pool
}