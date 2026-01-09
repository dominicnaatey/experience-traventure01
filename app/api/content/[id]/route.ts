import { NextRequest, NextResponse } from 'next/server'
import { ContentService } from '@/app/lib/services/content'

// GET /api/content/[id] - Get published content by ID (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const content = await ContentService.getPublishedContent(id)
    
    if (!content) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Content not found or not published' } },
        { status: 404 }
      )
    }

    return NextResponse.json(content)

  } catch (error) {
    console.error('Error getting published content:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to get content' } },
      { status: 500 }
    )
  }
}