export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(req: NextRequest) {
  try {
    const result = await pool.query(
      `SELECT id, name, email, "createdAt", 0 as "riskScore" FROM "User" ORDER BY "createdAt" DESC LIMIT 200`
    )

    return NextResponse.json({ users: result.rows })
  } catch (error) {
    console.error('Security users error:', error)
    return NextResponse.json({ users: [] })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Step 1: Check if user is an Organization owner
    const orgCheck = await pool.query(
      `SELECT id, name FROM "Organization" WHERE "ownerId" = $1`,
      [id]
    )

    if (orgCheck.rows.length > 0) {
      for (const org of orgCheck.rows) {
        await pool.query(`DELETE FROM "OrganizationSetting" WHERE "organizationId" = $1`, [org.id]).catch(() => {})
        await pool.query(`DELETE FROM "TaxRate" WHERE "organizationId" = $1`, [org.id]).catch(() => {})
        await pool.query(`DELETE FROM "DocumentNumbering" WHERE "organizationId" = $1`, [org.id]).catch(() => {})
        await pool.query(`DELETE FROM "Currency" WHERE "organizationId" = $1`, [org.id]).catch(() => {})
        await pool.query(`DELETE FROM "EmailTemplate" WHERE "organizationId" = $1`, [org.id]).catch(() => {})
        await pool.query(`DELETE FROM "Integration" WHERE "organizationId" = $1`, [org.id]).catch(() => {})
        await pool.query(`DELETE FROM "Role" WHERE "organizationId" = $1`, [org.id]).catch(() => {})
        await pool.query(`DELETE FROM "ChartOfAccount" WHERE "organizationId" = $1`, [org.id]).catch(() => {})
        await pool.query(`DELETE FROM "FiscalYear" WHERE "organizationId" = $1`, [org.id]).catch(() => {})
        await pool.query(`DELETE FROM "Customer" WHERE "organizationId" = $1`, [org.id]).catch(() => {})
        await pool.query(`DELETE FROM "Lead" WHERE "organizationId" = $1`, [org.id]).catch(() => {})
        await pool.query(`DELETE FROM "Opportunity" WHERE "organizationId" = $1`, [org.id]).catch(() => {})
        await pool.query(`DELETE FROM "Quotation" WHERE "organizationId" = $1`, [org.id]).catch(() => {})
        await pool.query(`DELETE FROM "SalesOrder" WHERE "organizationId" = $1`, [org.id]).catch(() => {})
        await pool.query(`DELETE FROM "CustomerInvoice" WHERE "organizationId" = $1`, [org.id]).catch(() => {})
        await pool.query(`DELETE FROM "CustomerPayment" WHERE "organizationId" = $1`, [org.id]).catch(() => {})
        await pool.query(`DELETE FROM "Warehouse" WHERE "organizationId" = $1`, [org.id]).catch(() => {})
        await pool.query(`DELETE FROM "Product" WHERE "organizationId" = $1`, [org.id]).catch(() => {})
        await pool.query(`DELETE FROM "StockQuantity" WHERE "organizationId" = $1`, [org.id]).catch(() => {})
        await pool.query(`DELETE FROM "Employee" WHERE "organizationId" = $1`, [org.id]).catch(() => {})
        await pool.query(`DELETE FROM "Attendance" WHERE "organizationId" = $1`, [org.id]).catch(() => {})
        await pool.query(`DELETE FROM "LeaveRequest" WHERE "organizationId" = $1`, [org.id]).catch(() => {})
        await pool.query(`DELETE FROM "PayrollPeriod" WHERE "organizationId" = $1`, [org.id]).catch(() => {})
        await pool.query(`DELETE FROM "BankAccount" WHERE "organizationId" = $1`, [org.id]).catch(() => {})
        await pool.query(`DELETE FROM "BankTransaction" WHERE "organizationId" = $1`, [org.id]).catch(() => {})
        await pool.query(`DELETE FROM "Budget" WHERE "organizationId" = $1`, [org.id]).catch(() => {})
        await pool.query(`DELETE FROM "Notification" WHERE "organizationId" = $1`, [org.id]).catch(() => {})
        await pool.query(`DELETE FROM "PurchaseOrder" WHERE "organizationId" = $1`, [org.id]).catch(() => {})
        await pool.query(`DELETE FROM "AuditLog" WHERE "organizationId" = $1`, [org.id]).catch(() => {})
      }
      
      await pool.query(`DELETE FROM "Organization" WHERE "ownerId" = $1`, [id])
    }

    // Step 2: Delete Project references
    await pool.query(`DELETE FROM "Project" WHERE "clientId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "Project" WHERE "ownerId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "Project" WHERE "userId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "Milestone" WHERE "projectId" IN (SELECT id FROM "Project" WHERE "clientId" = $1 OR "ownerId" = $1)`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "ProjectFile" WHERE "projectId" IN (SELECT id FROM "Project" WHERE "clientId" = $1 OR "ownerId" = $1)`, [id]).catch(() => {})

    // Step 3: Delete user's related data
    await pool.query(`DELETE FROM "Account" WHERE "userId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "Session" WHERE "userId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "SecuritySession" WHERE "userId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "MarketplaceListing" WHERE "sellerId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "MarketplaceConversation" WHERE "buyerId" = $1 OR "sellerId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "MarketplaceMessage" WHERE "senderId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "MarketplaceSaved" WHERE "userId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "AuditLog" WHERE "userId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "Subscription" WHERE "userId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "UserProfile" WHERE "userId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "Activity" WHERE "userId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "Activity" WHERE "assignedToId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "BlogPost" WHERE "authorId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "Comment" WHERE "authorId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "SupportTicket" WHERE "userId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "Message" WHERE "senderId" = $1 OR "receiverId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "PortfolioItem" WHERE "userId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "JobApplication" WHERE "applicantId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "Event" WHERE "userId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "TrainingEnrollment" WHERE "employeeId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "PerformanceReview" WHERE "reviewerId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "LeaveBalance" WHERE "employeeId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "Invoice" WHERE "clientId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "Invoice" WHERE "userId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "Job" WHERE "userId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "JobApplication" WHERE "userId" = $1`, [id]).catch(() => {})
    
    // Step 4: Finally delete the user
    const result = await pool.query(`DELETE FROM "User" WHERE id = $1 RETURNING id, email`, [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, deletedUser: result.rows[0] })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Failed to delete user: ' + (error as Error).message }, { status: 500 })
  }
}