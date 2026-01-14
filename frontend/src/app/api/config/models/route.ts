import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch available models from backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/models`, {
      headers: {
        'Authorization': `Bearer ${process.env.BACKEND_API_SECRET}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch models from backend')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Models API error:', error)
    
    // Return fallback models if backend is unavailable
    return NextResponse.json({
      success: true,
      models: {
        'typhoon-v2.5-instruct': 'Typhoon 2.5',
        'gpt-4-turbo': 'GPT-4 Turbo',
        'gpt-4': 'GPT-4',
        'gemini-2.0-flash-exp': 'Gemini 2.0 Flash',
        'gemini-pro': 'Gemini 1.5 Pro'
      }
    })
  }
}
