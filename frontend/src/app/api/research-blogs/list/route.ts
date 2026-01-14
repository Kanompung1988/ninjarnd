import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get limit from query params
    const { searchParams } = new URL(req.url)
    const limit = searchParams.get('limit') || '20'

    // Call Python backend with user_id
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/research/blogs?user_id=${encodeURIComponent(session.user.email)}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.BACKEND_API_SECRET}`,
        },
      }
    )

    if (!response.ok) {
      console.error('Backend error:', response.status)
      return NextResponse.json(
        { blogs: [] },
        { status: 200 }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Research blogs list error:', error)
    return NextResponse.json(
      { blogs: [] },
      { status: 200 }
    )
  }
}
