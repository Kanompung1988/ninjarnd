import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      console.error('Export failed: No session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { presentation, format = 'pptx' } = body

    // Validate required fields
    if (!presentation || !presentation.slides) {
      console.error('Export failed: Invalid presentation data', { 
        hasPresentation: !!presentation,
        hasSlides: !!presentation?.slides 
      })
      return NextResponse.json(
        { error: 'Presentation data is required' },
        { status: 400 }
      )
    }

    if (!['pptx', 'pdf'].includes(format)) {
      console.error('Export failed: Invalid format', { format })
      return NextResponse.json(
        { error: 'Invalid format. Must be pptx or pdf' },
        { status: 400 }
      )
    }

    console.log('📄 Exporting presentation:', { 
      title: presentation.title, 
      slideCount: presentation.slides.length,
      format,
      user: session.user.email,
    })

    // Call Python backend export endpoint  
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/presentations/export`
    console.log(`   Calling backend: ${backendUrl}`)
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.BACKEND_API_SECRET}`,
      },
      body: JSON.stringify({
        presentation,
        user_id: session.user.email,
        user_name: session.user.name || session.user.email,
        format,
      }),
    })

    console.log(`   Backend response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Backend export error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      
      let errorData: any
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { detail: errorText || 'Unknown error' }
      }
      
      return NextResponse.json(
        { error: errorData.detail || 'Failed to export presentation' },
        { status: response.status }
      )
    }

    // Get the file blob from backend
    const blob = await response.blob()
    console.log(`✅ Export successful! Blob size: ${blob.size} bytes`)
    
    // Create safe filename (remove non-ASCII characters that break HTTP headers)
    const safeTitle = presentation.title
      .replace(/[^\x00-\x7F]/g, '_') // Replace non-ASCII with underscore
      .substring(0, 100) // Limit length
      .replace(/\s+/g, '_') // Replace spaces
    const filename = `presentation_${Date.now()}.${format}`
    const encodedFilename = encodeURIComponent(`${safeTitle}.${format}`)
    
    // Set appropriate headers for file download
    const headers = new Headers()
    headers.set('Content-Type', format === 'pptx' 
      ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      : 'application/pdf'
    )
    // Use RFC 5987 encoding for non-ASCII filename support
    headers.set('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`)

    return new NextResponse(blob, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('❌ Presentation export error:', error)
    return NextResponse.json(
      {
        error: 'Failed to export presentation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
