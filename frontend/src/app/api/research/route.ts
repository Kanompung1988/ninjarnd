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
      days_back = 7,
      effort = 'standard',
      scope = 'balanced',
      model = 'typhoon-v2.5-30b-a3b-instruct',
      chat_id,
      search_engine = 'hybrid',
      use_hybrid_search = true,
    } = body

    // Validate required fields
    if (!topic || !chat_id) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, chat_id' },
        { status: 400 }
      )
    }

    // Call Python backend research endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/research`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BACKEND_API_SECRET}`,
      },
      body: JSON.stringify({
        topic,
        user_id: session.user.email,
        user_name: session.user.name || session.user.email,
        days_back,
        effort,
        scope,
        model,
        chat_id,
        search_engine,
        use_hybrid_search,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Backend request failed')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Research API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process research request' },
      { status: 500 }
    )
  }
}
