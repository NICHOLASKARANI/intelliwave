import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    const stkCallback = body.Body?.stkCallback
    if (!stkCallback) return NextResponse.json({ success: false })

    const resultCode = stkCallback.ResultCode
    const checkoutRequestId = stkCallback.CheckoutRequestID
    const mpesaReceipt = stkCallback.CallbackMetadata?.Item?.find(
      (item: any) => item.Name === 'MpesaReceiptNumber'
    )?.Value || ''

    if (resultCode === 0) {
      // Payment successful
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 30)

      await pool.query(
        `UPDATE "Subscription" 
         SET status = 'ACTIVE', "mpesaReceipt" = $1, "endDate" = $2, "nextBillingAt" = $2, "updatedAt" = NOW()
         WHERE "mpesaReceipt" = $3 AND status = 'PENDING'`,
        [mpesaReceipt, endDate, checkoutRequestId]
      )

      // Log audit
      await pool.query(
        `INSERT INTO "AuditLog" (action, entityType, entityId, "createdAt")
         VALUES ('SUBSCRIPTION_PAID', 'Subscription', $1, NOW())`,
        [checkoutRequestId]
      )
    } else {
      // Payment failed
      await pool.query(
        `UPDATE "Subscription" SET status = 'FAILED', "updatedAt" = NOW()
         WHERE "mpesaReceipt" = $1 AND status = 'PENDING'`,
        [checkoutRequestId]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.json({ success: false, error: 'Callback processing failed' }, { status: 500 })
  }
}