import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { ContentService, ContentFilters } from '@/app/lib/services/content'
import { ContentValidator, CreateContentData, ContentValidationError } from '@/app/lib/models/content'
import { ContentType } from '@prisma/client'

// GET /api/admin/content - List all content (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as ContentType | null
    const published = searchParams.get('published')
    const search = searchParams.get('search')

    const filters: ContentFilters = {}
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
    if (published !== null) {
      filters.published = published === 'true'
    }
    if (search) {
      filters.search = search
    }

    const content = await ContentService.listContent(filters)
    return NextResponse.json(content)

  } catch (error) {
    console.error('Error listing content:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to list content' } },
      { status: 500 }
    )
  }
}

// POST /api/admin/content - Create new content (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const contentData: CreateContentData = {
      type: body.type,
      title: body.title,
      body: body.body,
      published: body.published
    }

    const content = await ContentService.createContent(contentData)
    return NextResponse.json(content, { status: 201 })

  } catch (error: unknown) {
    console.error('Error creating content:', error)
    
    if (error instanceof ContentValidationError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.message, field: error.field } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create content' } },
      { status: 500 }
    )
  }
}