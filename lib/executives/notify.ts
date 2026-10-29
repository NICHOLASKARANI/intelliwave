import { sendEmail } from '@/lib/wavecore/email'

export const ExecutiveNotifications = {
  applicationApproved: (name: string, email: string) =>
    sendEmail({
      to: email,
      subject: '🎉 You are now an IntelliWavve AI Executive Leader',
      text: `Welcome ${name}! Your application has been approved. Log in at https://www.intelliwavve.com/executives/login to start registering customers.`,
      html: `
        <h1>🎉 Welcome aboard, ${name}!</h1>
        <p>Your application to become an <strong>IntelliWavve AI Executive Leader</strong> has been approved.</p>
        <p>Log in now to start registering customers and earning rewards:</p>
        <p><a href="https://www.intelliwavve.com/executives/login" style="display:inline-block;padding:12px 24px;background:#f59e0b;color:#0f172a;text-decoration:none;border-radius:8px;font-weight:bold;">Log In to Dashboard</a></p>
        <p>Your potential earnings:</p>
        <ul>
          <li><strong>Level 1</strong> (30+ paying users) — KSh 3,000/month</li>
          <li><strong>Level 2</strong> (60+ paying users) — KSh 8,000/month</li>
          <li><strong>Level 3</strong> (100+ paying users) — KSh 20,000/month</li>
        </ul>
        <p>Welcome to the team,<br/>Eng. Nicholas Karani<br/>CEO, IntelliWavve</p>
      `,
    }),

  levelUpgrade: (name: string, email: string, newLevel: number, activeUsers: number) => {
    const reward = newLevel === 1 ? 'KSh 3,000' : newLevel === 2 ? 'KSh 8,000' : 'KSh 20,000'
    return sendEmail({
      to: email,
      subject: `🚀 Level ${newLevel} achieved — ${reward}/month unlocked!`,
      text: `Congratulations ${name}! You have ${activeUsers} paying users and just reached Level ${newLevel}. Your monthly reward is now ${reward}.`,
      html: `
        <h1>🚀 Level ${newLevel} Achieved!</h1>
        <p>Congratulations, ${name}!</p>
        <p>You now have <strong>${activeUsers} paying users</strong> and have reached <strong>Level ${newLevel}</strong>.</p>
        <p>Your monthly reward is now <strong>${reward}</strong>.</p>
        <p><a href="https://www.intelliwavve.com/executives/dashboard">View Your Dashboard</a></p>
      `,
    })
  },

  payoutApproved: (name: string, email: string, amount: number) =>
    sendEmail({
      to: email,
      subject: `💰 Payment Approved — KSh ${amount.toLocaleString()}`,
      text: `Hi ${name}, your payout of KSh ${amount.toLocaleString()} has been approved and is being processed.`,
      html: `
        <h1>💰 Payment Approved</h1>
        <p>Hi ${name},</p>
        <p>Your payout of <strong>KSh ${amount.toLocaleString()}</strong> has been approved by the IntelliWavve team.</p>
        <p>You should receive the funds within 24-48 hours.</p>
        <p>Thank you for your continued partnership.</p>
      `,
    }),
}