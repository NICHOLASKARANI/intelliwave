import { NextRequest, NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // clientPayload is the password sent from the client
        const password = clientPayload
        const adminPassword = process.env.SHOP_ADMIN_PASSWORD

        if (!password || password !== adminPassword) {
          throw new Error('Unauthorized: Invalid admin password')
        }

        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          maximumSizeInBytes: 10 * 1024 * 1024, // 10MB limit
          addRandomSuffix: true,
        }
      },
      onUploadCompleted: async ({ blob }) => {
        // This runs after the upload is complete
        console.log('Blob upload completed:', blob.url)
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error('Blob upload token error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}