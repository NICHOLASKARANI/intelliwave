import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    const lower = message.toLowerCase()
    let response = ''
    let type = 'general'

    if (lower.includes('code') || lower.includes('component') || lower.includes('function')) {
      type = 'code'
      response = `Here's a generated component based on your request:\n\n\`\`\`tsx
import React from 'react'

interface Props {
  title: string
  description?: string
  onAction?: () => void
}

export function GeneratedComponent({ title, description, onAction }: Props) {
  return (
    <div className="p-6 rounded-xl border bg-white shadow-sm">
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      {description && <p className="text-gray-600">{description}</p>}
      {onAction && (
        <button 
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Action
        </button>
      )}
    </div>
  )
}
\`\`\`\n\nThis is a production-ready component with TypeScript types and proper styling.`
    } else if (lower.includes('debug') || lower.includes('error') || lower.includes('fix')) {
      type = 'debug'
      response = `I analyzed your issue. Here's what I found:\n\n🔍 **Root Cause**: The error is likely caused by undefined props being passed to the component.\n\n✅ **Solution**:\n1. Add proper type checking\n2. Use optional chaining\n3. Add default props\n\n🛡️ **Prevention**: Add TypeScript strict mode and PropTypes validation.`
    } else if (lower.includes('document') || lower.includes('docs')) {
      type = 'docs'
      response = `Here's the documentation for your code:\n\n## Function: processData\n\n### Description\nProcesses input data and returns formatted results.\n\n### Parameters\n- \`data\` (Array): Input data array\n- \`options\` (Object): Configuration options\n\n### Returns\n- (Object): Processed results with metadata\n\n### Example\n\`\`\`js\nconst result = processData(myData, { format: 'json' })\n\`\`\``
    } else if (lower.includes('review') || lower.includes('pr')) {
      type = 'review'
      response = `## Pull Request Review\n\n✅ **Strengths**:\n- Clean code structure\n- Good test coverage\n- Proper error handling\n\n⚠️ **Suggestions**:\n- Add input validation\n- Consider memoization for performance\n- Add more edge case tests\n\n📊 **Score**: 8.5/10`
    } else if (lower.includes('architecture') || lower.includes('design')) {
      type = 'architecture'
      response = `## Recommended Architecture\n\n\`\`\`
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend   │────▶│   API Layer  │────▶│  Database   │
│  (Next.js)   │     │  (Node.js)   │     │ (PostgreSQL)│
└─────────────┘     └─────────────┘     └─────────────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Redis     │     │   AWS S3    │     │  Analytics  │
│   (Cache)    │     │  (Storage)  │     │ (ClickHouse)│
└─────────────┘     └─────────────┘     └─────────────┘
\`\`\`\n\nThis architecture supports 1M+ concurrent users with sub-100ms response times.`
    } else {
      response = `I can help you with:\n\n• **Generate Code** - Create React, Next.js, or API components\n• **Debug Issues** - Find and fix bugs in your code\n• **Generate Docs** - Create documentation for your functions\n• **Review Code** - Get pull request reviews\n• **Architecture** - Get system design recommendations\n\nJust describe what you need!`
    }

    return NextResponse.json({ success: true, response, type })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 })
  }
}