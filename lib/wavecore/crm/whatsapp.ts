/**
 * WaveCore CRM — WhatsApp redirect utilities.
 *
 * Zero-API approach: build wa.me links that open WhatsApp Web/App
 * with a pre-filled message. No Meta Business API, no credentials,
 * works instantly for every Kenyan customer.
 */

/**
 * Normalize a Kenyan phone number to E.164 format (254XXXXXXXXX).
 * Accepts: +254712345678, 254712345678, 0712345678, 712345678, 0712 345 678
 * Returns null if the input cannot be normalized.
 */
export function normalizeKenyanPhone(input: string | null | undefined): string | null {
  if (!input) return null
  const digits = String(input).replace(/\D/g, '')
  if (!digits) return null

  // Handle +254 / 254 / 0 / bare 9-digit
  if (digits.startsWith('254') && digits.length === 12) return digits
  if (digits.startsWith('0') && digits.length === 10) return '254' + digits.slice(1)
  if (digits.length === 9) return '254' + digits
  // International fallback — use as-is
  if (digits.length > 10) return digits
  return null
}

/**
 * Build a wa.me link for a phone number and message.
 * Returns null if phone cannot be normalized.
 */
export function buildWhatsAppLink(
  phone: string | null | undefined,
  message: string
): string | null {
  const normalized = normalizeKenyanPhone(phone)
  if (!normalized) return null
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}

/**
 * Build a WhatsApp message with contact + context.
 * Example: "Hi John, following up on your quotation INV-2026-001 (KSh 45,000)."
 */
export function buildMessage(args: {
  contactName?: string | null
  customerName?: string | null
  context?: string | null
  customMessage?: string | null
}): string {
  if (args.customMessage) return args.customMessage
  const greeting = args.contactName ? `Hi ${args.contactName.split(' ')[0]},` : 'Hi,'
  const ctx = args.context ? ` ${args.context}` : ''
  const sign = args.customerName ? `\n\n— ${args.customerName}` : ''
  return `${greeting}${ctx}${sign}`.trim()
}