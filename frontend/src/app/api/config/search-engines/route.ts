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

    // Fetch available search engines from backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/search-engines`, {
      headers: {
        'Authorization': `Bearer ${process.env.BACKEND_API_SECRET}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch search engines from backend')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Search engines API error:', error)
    
    // Return fallback search engines if backend is unavailable
    return NextResponse.json({
      success: true,
      search_engines: {
        'hybrid': 'Hybrid (Tavily + SerpAPI)',
        'tavily': 'Tavily',
        'serpapi': 'SerpAPI',
        'jina': 'Jina AI Search',
        'brave': 'Brave Search',
        'bing': 'Bing Search'
      }
    })
  }
}
