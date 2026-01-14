import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: { blogId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { blogId } = params

    // Call Python backend with user_id
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/research/blogs/${blogId}?user_id=${encodeURIComponent(session.user.email)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.BACKEND_API_SECRET}`,
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Research blog retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve blog' },
      { status: 500 }
    )
  }
}
