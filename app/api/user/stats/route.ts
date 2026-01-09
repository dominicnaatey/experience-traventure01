import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'
import { BookingStatus } from '@/app/generated/prisma'

export async function GET() {
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
          status: BookingStatus.CONFIRMED
        }
      }),
      
      // Pending bookings count
      prisma.booking.count({
        where: { 
          userId,
          status: BookingStatus.PENDING
        }
      }),
      
      // Total amount spent (confirmed bookings only)
      prisma.booking.aggregate({
        where: { 
          userId,
          status: BookingStatus.CONFIRMED
        },
        _sum: {
          totalPrice: true
        }
      }),
      
      // Upcoming tours count (confirmed bookings with future dates)
      prisma.booking.count({
        where: {
          userId,
          status: BookingStatus.CONFIRMED,
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
      totalSpent: totalSpentResult._sum?.totalPrice || 0,
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