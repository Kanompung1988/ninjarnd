import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/plans`
    const response = await fetch(backendUrl)

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[Plans Error]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
