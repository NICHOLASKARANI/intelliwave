export function downloadPDF(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function generatePDFContent(title: string, data: any[]): string {
  const lines: string[] = []
  lines.push(title)
  lines.push('='.repeat(50))
  lines.push(`Generated: ${new Date().toLocaleString()}`)
  lines.push(`IntelliWavve - WaveCore ERP`)
  lines.push('='.repeat(50))
  lines.push('')
  
  if (data.length === 0) {
    lines.push('No records found.')
  } else {
    data.forEach((item, index) => {
      lines.push(`Record #${index + 1}`)
      Object.entries(item).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          lines.push(`  ${key}: ${value}`)
        }
      })
      lines.push('-'.repeat(30))
    })
  }
  
  lines.push('')
  lines.push('© 2026 IntelliWavve - All Rights Reserved')
  lines.push('Building the Intelligent Operating System')
  
  return lines.join('\n')
}