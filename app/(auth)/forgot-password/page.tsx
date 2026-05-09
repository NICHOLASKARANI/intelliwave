'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-20">
      <div className="w-full max-w-md p-8 border rounded-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
          <p className="text-muted-foreground">
            {sent ? 'Check your email for reset link' : 'Enter your email to reset password'}
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg bg-background"
                placeholder="you@example.com"
                required
              />
            </div>

            <Button type="submit" className="w-full bg-primary">
              Send Reset Link
            </Button>
          </form>
        ) : (
          <div className="text-center">
            <p className="mb-4">Password reset link sent to {email}</p>
            <Button onClick={() => setSent(false)} variant="outline" className="w-full">
              Try another email
            </Button>
          </div>
        )}

        <div className="mt-6 text-center text-sm">
          <Link href="/login" className="text-primary hover:underline font-semibold">
            Back to Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}