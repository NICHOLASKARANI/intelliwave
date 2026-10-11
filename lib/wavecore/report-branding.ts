/**
 * Report branding helper.
 * Every PDF / print route calls this with the current organizationId.
 * Returns the org's uploaded logo (base64 data URL) and company name.
 * Falls back to WaveCore defaults when either is missing.
 *
 * Usage in a PDF route:
 *   const branding = await getBranding(session.organizationId)
 *   const headerHtml = brandingHeaderHtml(branding)
 */
import { pool } from '@/lib/wavecore/db'

export interface ReportBranding {
  logo: string | null
  companyName: string
}

export async function getBranding(organizationId: string): Promise<ReportBranding> {
  try {
    const r = await pool.query(
      'SELECT name, logo FROM "Organization" WHERE id = $1 LIMIT 1',
      [organizationId]
    )
    if (r.rowCount === 0) return { logo: null, companyName: 'WaveCore ERP' }
    return {
      logo: r.rows[0].logo || null,
      companyName: r.rows[0].name || 'WaveCore ERP',
    }
  } catch {
    return { logo: null, companyName: 'WaveCore ERP' }
  }
}

/**
 * Build the header block HTML. If the org has a logo, shows the logo image;
 * otherwise shows the company name as styled text.
 *
 * `brandColor` is used for the accent line and text (defaults to teal).
 */
export function brandingHeaderHtml(
  branding: ReportBranding,
  opts: { brandColor?: string; subtitle?: string } = {}
): string {
  const color = opts.brandColor || '#0d9488'
  const subtitle = opts.subtitle || ''
  const safeName = String(branding.companyName || 'WaveCore ERP')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  if (branding.logo && branding.logo.startsWith('data:image/')) {
    return `
    <div style="display:flex;align-items:center;gap:14px">
      <img src="${branding.logo}" alt="${safeName}" style="height:48px;max-width:180px;object-fit:contain" />
      <div>
        <div style="font-size:20px;font-weight:800;color:${color}">${safeName}</div>
        ${subtitle ? `<div style="font-size:11px;color:#6b7280;margin-top:2px">${subtitle}</div>` : ''}
      </div>
    </div>`
  }

  return `
    <div>
      <div style="font-size:28px;font-weight:800;color:${color}">${safeName}</div>
      ${subtitle ? `<div style="font-size:12px;color:#6b7280;margin-top:2px">${subtitle}</div>` : ''}
    </div>`
}