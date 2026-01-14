import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`
    const response = await fetch(backendUrl, {
      headers: {
        'X-User-Email': session.user.email,
      },
    })

    if (!response.ok) {
      try {
        const error = await response.json()
        return NextResponse.json(error, { status: response.status })
      } catch (e) {
        // Backend returned non-JSON error
        const text = await response.text()
        console.error(`[Admin Stats Backend Error] Status: ${response.status}, Response: ${text}`)
        return NextResponse.json({ 
          error: `Backend error: ${text || 'Unknown error'}`,
          status: response.status 
        }, { status: response.status })
      }
    }

    try {
      const data = await response.json()
      return NextResponse.json(data)
    } catch (e) {
      // Backend returned non-JSON response
      const text = await response.text()
      console.error(`[Admin Stats Parse Error] Response: ${text}`)
      return NextResponse.json({ 
        error: 'Invalid response format from backend',
        details: text 
      }, { status: 502 })
    }
  } catch (error) {
    console.error('[Admin Stats Error]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
