import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    
    // Build where clause for filtering
    const where: any = {}
    
    // Search functionality - search in name and country
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          country: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }
    
    // Fetch destinations with active tour count
    const destinations = await prisma.destination.findMany({
      where,
      include: {
        _count: {
          select: {
            tours: {
              where: {
                status: 'ACTIVE'
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    return NextResponse.json({
      success: true,
      data: destinations,
      count: destinations.length
    })
    
  } catch (error) {
    console.error('Error fetching destinations:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch destinations'
      },
      { status: 500 }
    )
  }
}