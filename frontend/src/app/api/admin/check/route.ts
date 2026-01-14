import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin via backend
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/user/subscription`
    const response = await fetch(backendUrl, {
      headers: {
        'X-User-Email': session.user.email,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to check admin status' }, { status: 500 })
    }

    const data = await response.json()
    const user = data.user

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    return NextResponse.json({ success: true, isAdmin: true })
  } catch (error) {
    console.error('[Admin Check Error]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
