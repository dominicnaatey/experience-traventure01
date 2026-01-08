import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tour ID is required'
        },
        { status: 400 }
      )
    }
    
    // Fetch tour with all related information
    const tour = await prisma.tour.findUnique({
      where: { id },
      include: {
        destination: true,
        availabilities: {
          where: {
            startDate: {
              gte: new Date()
            }
          },
          orderBy: {
            startDate: 'asc'
          }
        },
        reviews: {
          where: {
            approved: true
          },
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            reviews: {
              where: {
                approved: true
              }
            }
          }
        }
      }
    })
    
    if (!tour) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tour not found'
        },
        { status: 404 }
      )
    }
    
    // Calculate average rating
    const avgRating = tour.reviews.length > 0
      ? tour.reviews.reduce((sum, review) => sum + review.rating, 0) / tour.reviews.length
      : 0
    
    return NextResponse.json({
      success: true,
      data: {
        ...tour,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: tour._count.reviews
      }
    })
    
  } catch (error) {
    console.error('Error fetching tour:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tour'
      },
      { status: 500 }
    )
  }
}