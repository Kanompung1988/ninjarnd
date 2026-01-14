import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// This route proxies requests to the Python backend
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { 
      message, 
      chat_history, 
      chat_id,
      deep_research_mode = false,
      realtime_research_mode = false,
      agent_mode = false,
      model = 'typhoon-v2.5-30b-a3b-instruct',
      search_engine = 'hybrid'
    } = body

    // Call Python backend chat endpoint
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/chat`
    console.log('[Chat API] Calling backend:', backendUrl)
    console.log('[Chat API] User:', session.user.email)
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BACKEND_API_SECRET}`,
      },
      body: JSON.stringify({
        message,
        chat_history,
        chat_id,
        user_id: session.user.email,
        user_name: session.user.name || session.user.email,
        deep_research_mode,
        realtime_research_mode,
        agent_mode,
        model,
        search_engine,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Chat API] Backend error:', response.status, errorText)
      throw new Error(`Backend request failed: ${response.status}`)
    }

    const data = await response.json()
    console.log('[Chat API] Success:', data.success)
    return NextResponse.json(data)
  } catch (error) {
    console.error('[Chat API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
