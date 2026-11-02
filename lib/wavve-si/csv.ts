// Wavve SI — CSV export utilities
// Handles escaping per RFC 4180 to prevent formula injection and formatting breaks.

function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  // Prevent CSV formula injection (Excel, Sheets interpret =, +, -, @ as formulas)
  const safe = /^[=+\-@]/.test(str) ? `'${str}` : str
  // Quote if contains comma, quote, or newline
  if (safe.includes(',') || safe.includes('"') || safe.includes('\n') || safe.includes('\r')) {
    return `"${safe.replace(/"/g, '""')}"`
  }
  return safe
}

export function rowsToCsv(headers: string[], rows: any[][]): string {
  const headerLine = headers.map(escapeCsvValue).join(',')
  const dataLines = rows.map(row => row.map(escapeCsvValue).join(','))
  return [headerLine, ...dataLines].join('\r\n')
}

export function csvResponse(body: string, filename: string): Response {
  // Add BOM for Excel UTF-8 compatibility (important for KSh symbol, Swahili chars)
  const bom = '\uFEFF'
  return new Response(bom + body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}

export function todayStamp(): string {
  return new Date().toISOString().slice(0, 10)
}