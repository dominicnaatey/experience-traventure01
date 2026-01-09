import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { ContentService } from '@/app/lib/services/content'

// GET /api/admin/content/[id]/versions - Get content version history (admin only)
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
    
    // Check if content exists
    const content = await ContentService.getContent(id)
    if (!content) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Content not found' } },
        { status: 404 }
      )
    }

    const versions = await ContentService.getContentVersionHistory(id)
    return NextResponse.json(versions)

  } catch (error) {
    console.error('Error getting content versions:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to get content versions' } },
      { status: 500 }
    )
  }
}