import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/user/subscription`
    const response = await fetch(backendUrl, {
      headers: {
        'X-User-Email': session.user.email,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[User Subscription Error]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
