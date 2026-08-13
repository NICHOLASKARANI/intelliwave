// CSV utilities for import/export

export function generateCSV(headers: string[], rows: any[][]): string {
  const escapeCell = (value: any): string => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const headerRow = headers.map(escapeCell).join(',')
  const dataRows = rows.map(row => row.map(escapeCell).join(','))

  return [headerRow, ...dataRows].join('\n')
}

export function parseCSV(text: string): { headers: string[]; rows: any[][] } {
  const lines = text.trim().split('\n')
  if (lines.length === 0) return { headers: [], rows: [] }

  const parseLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseLine(lines[0])
  const rows = lines.slice(1).map(parseLine)

  return { headers, rows }
}

export function validateCSV(
  headers: string[],
  rows: any[][],
  requiredColumns: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const col of requiredColumns) {
    if (!headers.includes(col)) {
      errors.push(`Missing required column: ${col}`)
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  // Validate each row
  rows.forEach((row, index) => {
    if (row.length !== headers.length) {
      errors.push(`Row ${index + 2}: Expected ${headers.length} columns but got ${row.length}`)
    }
  })

  return { valid: errors.length === 0, errors }
}