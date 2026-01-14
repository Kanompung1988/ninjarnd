import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      chat_id,
      json_path,
      output_format = 'both',
      settings = {
        enable_ai_images: true,
        image_style: 'professional',
        max_images: 6,
        theme: 'modern',
      },
    } = body

    // Validate required fields
    if (!chat_id || !json_path) {
      return NextResponse.json(
        { error: 'Missing required fields: chat_id, json_path' },
        { status: 400 }
      )
    }

    // Call Python backend slides endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/slides/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BACKEND_API_SECRET}`,
      },
      body: JSON.stringify({
        chat_id,
        user_id: session.user.email,
        user_name: session.user.name || session.user.email,
        json_path,
        output_format,
        settings,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Backend request failed')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Slides API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate slides' },
      { status: 500 }
    )
  }
}

// GET endpoint to download generated files
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const chat_id = searchParams.get('chat_id')
    const file_type = searchParams.get('file_type') // 'pptx' or 'html'

    if (!chat_id || !file_type) {
      return NextResponse.json(
        { error: 'Missing parameters: chat_id, file_type' },
        { status: 400 }
      )
    }

    // Proxy download from Python backend with user_id
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/slides/download?chat_id=${chat_id}&file_type=${file_type}&user_id=${encodeURIComponent(session.user.email)}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.BACKEND_API_SECRET}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to download file')
    }

    const buffer = await response.arrayBuffer()
    const contentType = file_type === 'pptx' 
      ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      : 'text/html'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="presentation.${file_type}"`,
      },
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    )
  }
}
