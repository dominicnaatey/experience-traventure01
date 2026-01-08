import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'
import { UserRole } from '@/app/generated/prisma'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    role: UserRole
  }
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      )
    }
    
    // Get user from database to ensure they still exist and get current role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        role: true
      }
    })
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        },
        { status: 401 }
      )
    }
    
    // Attach user to request for downstream handlers
    ;(request as AuthenticatedRequest).user = user
    
    return null // Continue to next handler
  } catch (error) {
    console.error('Authentication middleware error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Authentication failed',
        code: 'AUTH_ERROR'
      },
      { status: 500 }
    )
  }
}

/**
 * Middleware to require admin role
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  try {
    // First check authentication
    const authResult = await requireAuth(request)
    if (authResult) {
      return authResult // Return auth error if not authenticated
    }
    
    const user = (request as AuthenticatedRequest).user
    
    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Admin access required',
          code: 'ADMIN_REQUIRED'
        },
        { status: 403 }
      )
    }
    
    return null // Continue to next handler
  } catch (error) {
    console.error('Admin middleware error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Authorization failed',
        code: 'AUTH_ERROR'
      },
      { status: 500 }
    )
  }
}

/**
 * Middleware to require customer role (authenticated user)
 */
export async function requireCustomer(request: NextRequest): Promise<NextResponse | null> {
  try {
    // First check authentication
    const authResult = await requireAuth(request)
    if (authResult) {
      return authResult // Return auth error if not authenticated
    }
    
    const user = (request as AuthenticatedRequest).user
    
    if (!user || (user.role !== UserRole.CUSTOMER && user.role !== UserRole.ADMIN)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Customer access required',
          code: 'CUSTOMER_REQUIRED'
        },
        { status: 403 }
      )
    }
    
    return null // Continue to next handler
  } catch (error) {
    console.error('Customer middleware error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Authorization failed',
        code: 'AUTH_ERROR'
      },
      { status: 500 }
    )
  }
}

/**
 * Allow guest access (no authentication required)
 */
export async function allowGuest(request: NextRequest): Promise<NextResponse | null> {
  // No authentication required for guest endpoints
  return null
}

/**
 * Helper function to get current user from request
 */
export function getCurrentUser(request: NextRequest) {
  return (request as AuthenticatedRequest).user
}