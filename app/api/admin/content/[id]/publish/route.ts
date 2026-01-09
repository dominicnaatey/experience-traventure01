import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { ContentService } from '@/app/lib/services/content'

// POST /api/admin/content/[id]/publish - Publish content (admin only)
export async function POST(
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
    const content = await ContentService.publishContent(id)
    return NextResponse.json(content)

  } catch (error: unknown) {
    console.error('Error publishing content:', error)
    
    if (error instanceof Error && error.message === 'Content not found') {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Content not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to publish content' } },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/content/[id]/publish - Unpublish content (admin only)
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
    const content = await ContentService.unpublishContent(id)
    return NextResponse.json(content)

  } catch (error: unknown) {
    console.error('Error unpublishing content:', error)
    
    if (error instanceof Error && error.message === 'Content not found') {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Content not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to unpublish content' } },
      { status: 500 }
    )
  }
}