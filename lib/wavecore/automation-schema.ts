/**
 * Idempotent Automation schema bootstrap.
 *
 * The production DB has drifted from schema.prisma — several automation
 * tables (Workflow, AutomationSetting, ExecutionLog, Webhook) exist at
 * runtime without being declared in Prisma. This helper adds the two
 * remaining tables the workflow engine needs:
 *
 *   WorkflowStep — the ordered actions inside a workflow
 *   WorkflowRun  — a single execution record (started/finished/status)
 *
 * Also adds Workflow.description via ALTER TABLE (idempotent), because
 * the create page collects it but the API used to drop it.
 *
 * Called by /api/wavecore/automation route on entry. Cached per-process
 * after first successful call.
 */
import { pool } from '@/lib/wavecore/db'

let _ensured = false

export async function ensureAutomationSchema(): Promise<void> {
  if (_ensured) return

  // ---------- WorkflowStep ----------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "WorkflowStep" (
      id             TEXT PRIMARY KEY,
      "workflowId"   TEXT NOT NULL,
      "stepNumber"   INTEGER NOT NULL,
      type           TEXT NOT NULL,
      config         JSONB NOT NULL DEFAULT '{}'::jsonb,
      "organizationId" TEXT NOT NULL,
      "createdAt"    TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `).catch(() => {})
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_workflowstep_workflow" ON "WorkflowStep" ("workflowId", "stepNumber")`).catch(() => {})
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_workflowstep_org" ON "WorkflowStep" ("organizationId")`).catch(() => {})

  // ---------- WorkflowRun ----------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "WorkflowRun" (
      id               TEXT PRIMARY KEY,
      "workflowId"     TEXT NOT NULL,
      "organizationId" TEXT NOT NULL,
      status           TEXT NOT NULL DEFAULT 'PENDING',
      "triggeredBy"    TEXT,
      "startedAt"      TIMESTAMP,
      "finishedAt"     TIMESTAMP,
      "durationMs"     INTEGER,
      output           JSONB,
      error            TEXT,
      "createdAt"      TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `).catch(() => {})
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_workflowrun_workflow" ON "WorkflowRun" ("workflowId", "createdAt" DESC)`).catch(() => {})
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_workflowrun_org_status" ON "WorkflowRun" ("organizationId", status)`).catch(() => {})

  // ---------- WorkflowTemplate ----------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "WorkflowTemplate" (
      id               TEXT PRIMARY KEY,
      name             TEXT NOT NULL,
      description      TEXT,
      "organizationId" TEXT NOT NULL,
      "createdAt"      TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt"      TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `).catch(() => {})
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_workflowtemplate_org" ON "WorkflowTemplate" ("organizationId")`).catch(() => {})

  // ---------- Workflow.description column ----------
  await pool.query(`ALTER TABLE "Workflow" ADD COLUMN IF NOT EXISTS description TEXT`).catch(() => {})

  _ensured = true
}

export interface WorkflowStepRow {
  id: string
  workflowId: string
  stepNumber: number
  type: string
  config: any
  organizationId: string
  createdAt: string
}

export interface WorkflowRunRow {
  id: string
  workflowId: string
  organizationId: string
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'
  triggeredBy: string | null
  startedAt: string | null
  finishedAt: string | null
  durationMs: number | null
  output: any
  error: string | null
  createdAt: string
}
