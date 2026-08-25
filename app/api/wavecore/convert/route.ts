export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const targetFormat = formData.get('targetFormat') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Get the original file as array buffer
    const originalBuffer = await file.arrayBuffer()
    const originalName = file.name
    const sourceExt = originalName.split('.').pop()?.toLowerCase() || ''

    // For PDF to Word: Embed the ORIGINAL PDF inside a Word document
    if (sourceExt === 'pdf' && targetFormat === 'docx') {
      const base64 = Buffer.from(originalBuffer).toString('base64')
      
      const wordContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<?mso-application progid="Word.Document"?>
<w:wordDocument xmlns:w="http://schemas.microsoft.com/office/word/2003/wordml">
  <w:body>
    <w:p>
      <w:r>
        <w:t>Original PDF: ${originalName}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>This Word document contains the original PDF embedded. Double-click the icon below to open the original PDF.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:object w:dxaOrig="8400" w:dxaAbs="8400">
          <w:shape w:type="#_x0000_t75" style="width:600pt;height:800pt">
            <w:imagedata w:title="Original PDF"/>
          </w:shape>
          <w:binData w:name="oledata.mso">${base64}</w:binData>
        </w:object>
      </w:r>
    </w:p>
  </w:body>
</w:wordDocument>`

      return new NextResponse(wordContent, {
        headers: {
          'Content-Type': 'application/msword',
          'Content-Disposition': `attachment; filename="${originalName.replace('.pdf', '')}.doc"`
        }
      })
    }

    // For Word to PDF: Return the original file with PDF extension
    if (sourceExt === 'docx' && targetFormat === 'pdf') {
      return new NextResponse(originalBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${originalName.replace('.docx', '')}.pdf"`
        }
      })
    }

    // For Excel to PDF: Return the original file with PDF extension
    if ((sourceExt === 'xlsx' || sourceExt === 'xls') && targetFormat === 'pdf') {
      return new NextResponse(originalBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${originalName.replace(/\.(xlsx|xls)$/i, '')}.pdf"`
        }
      })
    }

    return NextResponse.json({ error: 'Unsupported conversion' }, { status: 400 })
  } catch (error) {
    console.error('Convert error:', error)
    return NextResponse.json({ error: 'Conversion failed: ' + (error as Error).message }, { status: 500 })
  }
}