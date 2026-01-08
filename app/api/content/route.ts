import { NextRequest, NextResponse } from 'next/server'
import { ContentService, ContentFilters } from '@/app/lib/services/content'
import { ContentValidator } from '@/app/lib/models/content'
import { ContentType } from '@/app/generated/prisma'

// GET /api/content - List published content (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as ContentType | null
    const search = searchParams.get('search')

    const filters: ContentFilters = { published: true } // Only published content for public API
    
    if (type) {
      try {
        filters.type = ContentValidator.validateContentType(type)
      } catch {
        return NextResponse.json(
          { error: { code: 'INVALID_TYPE', message: 'Invalid content type' } },
          { status: 400 }
        )
      }
    }
    
    if (search) {
      filters.search = search
    }

    const content = await ContentService.listContent(filters)
    return NextResponse.json(content)

  } catch (error) {
    console.error('Error listing published content:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to list content' } },
      { status: 500 }
    )
  }
}