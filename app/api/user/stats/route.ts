import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get user booking statistics
    const [
      totalBookings,
      confirmedBookings,
      pendingBookings,
      totalSpentResult,
      upcomingTours
    ] = await Promise.all([
      // Total bookings count
      prisma.booking.count({
        where: { userId }
      }),
      
      // Confirmed bookings count
      prisma.booking.count({
        where: { 
          userId,
          status: 'confirmed'
        }
      }),
      
      // Pending bookings count
      prisma.booking.count({
        where: { 
          userId,
          status: 'pending'
        }
      }),
      
      // Total amount spent (confirmed bookings only)
      prisma.booking.aggregate({
        where: { 
          userId,
          status: 'confirmed'
        },
        _sum: {
          totalPrice: true
        }
      }),
      
      // Upcoming tours count (confirmed bookings with future dates)
      prisma.booking.count({
        where: {
          userId,
          status: 'confirmed',
          availability: {
            startDate: {
              gte: new Date()
            }
          }
        }
      })
    ])

    const stats = {
      totalBookings,
      confirmedBookings,
      pendingBookings,
      totalSpent: totalSpentResult._sum.totalPrice || 0,
      upcomingTours
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}