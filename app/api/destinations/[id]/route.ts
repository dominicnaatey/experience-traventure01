import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Destination ID is required'
        },
        { status: 400 }
      )
    }
    
    // Fetch destination with active tours
    const destination = await prisma.destination.findUnique({
      where: { id },
      include: {
        tours: {
          where: {
            status: 'ACTIVE'
          },
          select: {
            id: true,
            title: true,
            description: true,
            durationDays: true,
            pricePerPerson: true,
            maxGroupSize: true,
            difficulty: true,
            images: true,
            _count: {
              select: {
                reviews: {
                  where: {
                    approved: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })
    
    if (!destination) {
      return NextResponse.json(
        {
          success: false,
          error: 'Destination not found'
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: destination
    })
    
  } catch (error) {
    console.error('Error fetching destination:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch destination'
      },
      { status: 500 }
    )
  }
}