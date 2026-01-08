import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import { z } from 'zod';

// Validation schema for review approval
const approveReviewSchema = z.object({
  reviewId: z.string().min(1, 'Review ID is required'),
  approved: z.boolean()
});

// GET /api/admin/reviews - Get all reviews for admin management
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'pending', 'approved', 'all'
    const tourId = searchParams.get('tourId');

    const whereClause: Record<string, unknown> = {};

    // Filter by approval status
    if (status === 'pending') {
      whereClause.approved = false;
    } else if (status === 'approved') {
      whereClause.approved = true;
    }
    // 'all' or no status means no filter on approved field

    // Filter by tour if specified
    if (tourId) {
      whereClause.tourId = tourId;
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tour: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/reviews - Approve or reject a review
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = approveReviewSchema.parse(body);

    // Check if review exists
    const existingReview = await prisma.review.findUnique({
      where: {
        id: validatedData.reviewId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        tour: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Update review approval status
    const updatedReview = await prisma.review.update({
      where: {
        id: validatedData.reviewId
      },
      data: {
        approved: validatedData.approved
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        tour: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    const action = validatedData.approved ? 'approved' : 'rejected';
    
    return NextResponse.json({ 
      review: updatedReview,
      message: `Review ${action} successfully`
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}