import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function proxyAdminRequest(
  req: NextRequest,
  endpoint: string,
  method: string = 'GET'
) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Email': session.user.email,
    },
  }

  if (method !== 'GET' && req.body) {
    const body = await req.json()
    options.body = JSON.stringify(body)
  }

  const response = await fetch(backendUrl, options)

  if (!response.ok) {
    try {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    } catch (e) {
      // Backend returned non-JSON error response
      const text = await response.text()
      console.error(`[Backend Error] Status: ${response.status}, Response: ${text}`)
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
    // Backend returned non-JSON success response
    const text = await response.text()
    console.error(`[Backend Parse Error] Response: ${text}`)
    return NextResponse.json({ 
      error: 'Invalid response format from backend',
      details: text 
    }, { status: 502 })
  }
}

export { proxyAdminRequest }
