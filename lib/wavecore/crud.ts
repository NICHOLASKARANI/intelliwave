import { pool } from './db'
import { getSession } from './auth'

export async function getTenantId(): Promise<string | null> {
  const session = await getSession()
  return session?.organizationId || null
}

export async function listTable(tableName: string, organizationId: string, limit = 100) {
  const result = await pool.query(
    `SELECT * FROM "${tableName}" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT $2`,
    [organizationId, limit]
  )
  return result.rows
}

export async function getById(tableName: string, id: string, organizationId: string) {
  const result = await pool.query(
    `SELECT * FROM "${tableName}" WHERE id = $1 AND "organizationId" = $2`,
    [id, organizationId]
  )
  return result.rows[0] || null
}

export async function createRecord(tableName: string, data: any, organizationId: string) {
  const columns = Object.keys(data)
  const values = Object.values(data)
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')
  const columnList = columns.join('", "')
  
  const result = await pool.query(
    `INSERT INTO "${tableName}" ("${columnList}", "organizationId", "createdAt", "updatedAt")
     VALUES (${placeholders}, '${organizationId}', NOW(), NOW())
     RETURNING *`
  )
  return result.rows[0]
}

export async function updateRecord(tableName: string, id: string, data: any, organizationId: string) {
  const setClauses = Object.keys(data).map((key, i) => `"${key}" = $${i + 1}`).join(', ')
  const values = Object.values(data)
  
  const result = await pool.query(
    `UPDATE "${tableName}" SET ${setClauses}, "updatedAt" = NOW()
     WHERE id = $${values.length + 1} AND "organizationId" = $${values.length + 2}
     RETURNING *`,
    [...values, id, organizationId]
  )
  return result.rows[0]
}

export async function deleteRecord(tableName: string, id: string, organizationId: string) {
  await pool.query(
    `DELETE FROM "${tableName}" WHERE id = $1 AND "organizationId" = $2`,
    [id, organizationId]
  )
  return { success: true }
}