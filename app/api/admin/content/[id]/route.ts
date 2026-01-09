import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { ContentService } from '@/app/lib/services/content'
import { UpdateContentData, ContentValidationError } from '@/app/lib/models/content'

// GET /api/admin/content/[id] - Get content by ID (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 401 }
      )
    }

    const { id } = await params
    const content = await ContentService.getContent(id)
    
    if (!content) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Content not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json(content)

  } catch (error) {
    console.error('Error getting content:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to get content' } },
      { status: 500 }
    )
  }
}

// PUT /api/admin/content/[id] - Update content (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const updateData: UpdateContentData = {}
    
    if (body.type !== undefined) updateData.type = body.type
    if (body.title !== undefined) updateData.title = body.title
    if (body.body !== undefined) updateData.body = body.body
    if (body.published !== undefined) updateData.published = body.published

    const { id } = await params
    const content = await ContentService.updateContent(id, updateData)
    return NextResponse.json(content)

  } catch (error: unknown) {
    console.error('Error updating content:', error)
    
    if (error instanceof Error && error.message === 'Content not found') {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Content not found' } },
        { status: 404 }
      )
    }
    
    if (error instanceof ContentValidationError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.message, field: error.field } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update content' } },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/content/[id] - Delete content (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 401 }
      )
    }

    const { id } = await params
    await ContentService.deleteContent(id)
    return NextResponse.json({ message: 'Content deleted successfully' })

  } catch (error: unknown) {
    console.error('Error deleting content:', error)
    
    if (error instanceof Error && error.message === 'Content not found') {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Content not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete content' } },
      { status: 500 }
    )
  }
}