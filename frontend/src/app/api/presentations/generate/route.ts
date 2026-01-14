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
      topic,
      slideCount = 8,
      style = 'professional',
      aspectRatio = '16:9',
      model = 'glm-4.6',
    } = body

    // Validate required fields
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      )
    }

    console.log('Generating presentation (GLM-ONLY):', { topic, slideCount, style, model, user: session.user.email })

    // Call Python backend presentation generation endpoint
    // 🎯 GLM-ONLY MODE: Uses Hugging Face GLM-4.6 primarily with Z.AI GLM-4.6 fallback
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/presentations/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.BACKEND_API_SECRET}`,
        },
        body: JSON.stringify({
          topic,
          user_id: session.user.email,
          user_name: session.user.name || session.user.email,
          slide_count: slideCount,
          style,
          aspect_ratio: aspectRatio,
          model: model, // GLM-ONLY: 'glm-4.6' or 'hf-glm'
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Backend generation error:', errorData)
      return NextResponse.json(
        { error: errorData.detail || 'Failed to generate presentation' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({
      success: true,
      title: data.title,
      slides: data.slides,
      metadata: data.metadata,
    })
  } catch (error) {
    console.error('Presentation generation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate presentation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
