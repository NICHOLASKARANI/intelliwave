/**
 * Shared password strength policy.
 * Used by signup and password-reset/complete.
 * Server-side only — errors returned to client via the existing error field.
 */
export interface PasswordCheck {
  ok: boolean
  message?: string
}

const COMMON = new Set([
  'password', 'password1', 'password123',
  '12345678', '123456789', '1234567890',
  'qwertyui', 'qwerty123', 'letmein1',
  'welcome1', 'welcome123', 'admin123',
  'iloveyou', 'monkey123', 'dragon123',
  'abc12345', 'football', 'baseball',
  'intelliwave', 'wavecore', 'intelliwavve',
])

export function validatePassword(password: string): PasswordCheck {
  if (!password || typeof password !== 'string') {
    return { ok: false, message: 'Password is required' }
  }
  if (password.length < 8) {
    return { ok: false, message: 'Password must be at least 8 characters' }
  }
  if (password.length > 200) {
    return { ok: false, message: 'Password is too long' }
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { ok: false, message: 'Password must contain at least one letter' }
  }
  if (!/[0-9]/.test(password)) {
    return { ok: false, message: 'Password must contain at least one number' }
  }
  if (COMMON.has(password.toLowerCase())) {
    return { ok: false, message: 'This password is too common. Please choose a stronger one.' }
  }
  return { ok: true }
}