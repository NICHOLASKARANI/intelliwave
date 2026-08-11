import { prisma } from './prisma'
import { getTenantContext } from './tenant'

export async function checkSubscriptionAccess(): Promise<{
  active: boolean
  plan: string
  trialEndsAt: Date | null
}> {
  const ctx = await getTenantContext()

  const subscription = await prisma.subscription.findFirst({
    where: { organizationId: ctx.organizationId },
  })

  if (!subscription) {
    return { active: false, plan: 'NONE', trialEndsAt: null }
  }

  const isActive = 
    subscription.status === 'ACTIVE' ||
    subscription.status === 'TRIAL'

  return {
    active: isActive,
    plan: subscription.plan,
    trialEndsAt: subscription.trialEndsAt,
  }
}

export async function requireActiveSubscription(): Promise<void> {
  const access = await checkSubscriptionAccess()
  if (!access.active) {
    throw new Error('Subscription required')
  }
}