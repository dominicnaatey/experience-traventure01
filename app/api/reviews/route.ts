import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { z } from 'zod';

// Validation schema for review creation
const createReviewSchema = z.object({
  tourId: z.string().min(1, 'Tour ID is required'),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().min(1, 'Comment is required').trim()
});

// GET /api/reviews - Get reviews for a tour (public, only approved reviews)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tourId = searchParams.get('tourId');

    if (!tourId) {
      return NextResponse.json(
        { error: 'Tour ID is required' },
        { status: 400 }
      );
    }

    // Get only approved reviews for public display
    const reviews = await prisma.review.findMany({
      where: {
        tourId: tourId,
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
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Create a new review
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createReviewSchema.parse(body);

    // Check if user has a confirmed booking for this tour
    const confirmedBooking = await prisma.booking.findFirst({
      where: {
        userId: session.user.id,
        tourId: validatedData.tourId,
        status: 'CONFIRMED'
      }
    });

    if (!confirmedBooking) {
      return NextResponse.json(
        { error: 'You can only review tours you have booked and completed' },
        { status: 403 }
      );
    }

    // Check if user has already reviewed this tour
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: session.user.id,
        tourId: validatedData.tourId
      }
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this tour' },
        { status: 409 }
      );
    }

    // Create the review (starts as unapproved)
    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        tourId: validatedData.tourId,
        rating: validatedData.rating,
        comment: validatedData.comment,
        approved: false // Reviews start as pending approval
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

    return NextResponse.json({ 
      review,
      message: 'Review submitted successfully and is pending approval'
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}