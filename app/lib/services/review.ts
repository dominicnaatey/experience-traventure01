import { prisma } from '../prisma';

export interface CreateReviewData {
  userId: string;
  tourId: string;
  rating: number;
  comment: string;
}

export interface ReviewFilters {
  tourId?: string;
  userId?: string;
  approved?: boolean;
  limit?: number;
  offset?: number;
}

export class ReviewService {
  /**
   * Check if a user is eligible to review a tour
   * User must have a confirmed booking for the tour
   */
  static async checkReviewEligibility(userId: string, tourId: string): Promise<boolean> {
    const confirmedBooking = await prisma.booking.findFirst({
      where: {
        userId: userId,
        tourId: tourId,
        status: 'CONFIRMED'
      }
    });

    return !!confirmedBooking;
  }

  /**
   * Check if a user has already reviewed a tour
   */
  static async hasUserReviewedTour(userId: string, tourId: string): Promise<boolean> {
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: userId,
        tourId: tourId
      }
    });

    return !!existingReview;
  }

  /**
   * Create a new review
   */
  static async createReview(data: CreateReviewData) {
    // Validate rating range
    if (data.rating < 1 || data.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Validate comment is not empty
    if (!data.comment || data.comment.trim().length === 0) {
      throw new Error('Comment is required');
    }

    // Check eligibility
    const isEligible = await this.checkReviewEligibility(data.userId, data.tourId);
    if (!isEligible) {
      throw new Error('User must have a confirmed booking to review this tour');
    }

    // Check for existing review
    const hasReviewed = await this.hasUserReviewedTour(data.userId, data.tourId);
    if (hasReviewed) {
      throw new Error('User has already reviewed this tour');
    }

    // Create the review
    return await prisma.review.create({
      data: {
        userId: data.userId,
        tourId: data.tourId,
        rating: data.rating,
        comment: data.comment.trim(),
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
  }

  /**
   * Get reviews with filters
   */
  static async getReviews(filters: ReviewFilters = {}) {
    const {
      tourId,
      userId,
      approved,
      limit = 10,
      offset = 0
    } = filters;

    const whereClause: Record<string, unknown> = {};

    if (tourId) whereClause.tourId = tourId;
    if (userId) whereClause.userId = userId;
    if (typeof approved === 'boolean') whereClause.approved = approved;

    return await prisma.review.findMany({
      where: whereClause,
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
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });
  }

  /**
   * Get approved reviews for a tour with statistics
   */
  static async getTourReviews(tourId: string, limit = 10, offset = 0) {
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
      },
      take: limit,
      skip: offset
    });

    // Get statistics
    const stats = await prisma.review.aggregate({
      where: {
        tourId: tourId,
        approved: true
      },
      _avg: {
        rating: true
      },
      _count: {
        rating: true
      }
    });

    const totalCount = await prisma.review.count({
      where: {
        tourId: tourId,
        approved: true
      }
    });

    return {
      reviews,
      stats: {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count.rating || 0
      },
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    };
  }

  /**
   * Approve or reject a review (admin only)
   */
  static async updateReviewApproval(reviewId: string, approved: boolean) {
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!existingReview) {
      throw new Error('Review not found');
    }

    return await prisma.review.update({
      where: { id: reviewId },
      data: { approved },
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
  }

  /**
   * Delete a review (admin only)
   */
  static async deleteReview(reviewId: string) {
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!existingReview) {
      throw new Error('Review not found');
    }

    return await prisma.review.delete({
      where: { id: reviewId }
    });
  }
}