import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/tours/[id]/reviews - Get approved reviews for a specific tour
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { id } = await params;

    // Verify tour exists
    const tour = await prisma.tour.findUnique({
      where: {
        id: id
      },
      select: {
        id: true,
        title: true
      }
    });

    if (!tour) {
      return NextResponse.json(
        { error: 'Tour not found' },
        { status: 404 }
      );
    }

    // Get approved reviews for the tour
    const reviews = await prisma.review.findMany({
      where: {
        tourId: id,
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
      },
      take: limit,
      skip: offset
    });

    // Get total count for pagination
    const totalCount = await prisma.review.count({
      where: {
        tourId: id,
        approved: true
      }
    });

    // Calculate average rating
    const ratingStats = await prisma.review.aggregate({
      where: {
        tourId: id,
        approved: true
      },
      _avg: {
        rating: true
      },
      _count: {
        rating: true
      }
    });

    return NextResponse.json({
      reviews,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      stats: {
        averageRating: ratingStats._avg.rating || 0,
        totalReviews: ratingStats._count.rating || 0
      },
      tour: {
        id: tour.id,
        title: tour.title
      }
    });

  } catch (error) {
    console.error('Error fetching tour reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}