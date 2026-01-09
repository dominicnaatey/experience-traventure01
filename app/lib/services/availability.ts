import { prisma } from '../prisma';
import { Prisma } from '../../generated/prisma';

export interface AvailabilityInfo {
  availabilityId: string;
  startDate: Date;
  endDate: Date;
  availableSlots: number;
  maxGroupSize: number;
  canBook: boolean;
}

export class AvailabilityService {
  /**
   * Check availability for a specific tour and date range
   */
  static async checkAvailability(
    tourId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AvailabilityInfo[]> {
    try {
      const whereClause: Prisma.TourAvailabilityWhereInput = {
        tourId,
        availableSlots: {
          gt: 0
        }
      };

      if (startDate) {
        whereClause.startDate = {
          gte: startDate
        };
      }

      if (endDate) {
        whereClause.endDate = {
          lte: endDate
        };
      }

      const availabilities = await prisma.tourAvailability.findMany({
        where: whereClause,
        include: {
          tour: {
            select: {
              maxGroupSize: true
            }
          }
        },
        orderBy: {
          startDate: 'asc'
        }
      });

      return availabilities.map(availability => ({
        availabilityId: availability.id,
        startDate: availability.startDate,
        endDate: availability.endDate,
        availableSlots: availability.availableSlots,
        maxGroupSize: availability.tour.maxGroupSize,
        canBook: availability.availableSlots > 0
      }));
    } catch (error) {
      console.error('Error checking availability:', error);
      throw new Error('Failed to check availability');
    }
  }

  /**
   * Check if a specific availability can accommodate the requested number of travelers
   */
  static async canAccommodateBooking(
    availabilityId: string,
    travelersCount: number
  ): Promise<boolean> {
    try {
      const availability = await prisma.tourAvailability.findUnique({
        where: { id: availabilityId }
      });

      if (!availability) {
        return false;
      }

      return availability.availableSlots >= travelersCount;
    } catch (error) {
      console.error('Error checking booking accommodation:', error);
      return false;
    }
  }

  /**
   * Reserve slots for a booking (reduce available slots)
   */
  static async reserveSlots(
    availabilityId: string,
    travelersCount: number
  ): Promise<void> {
    try {
      await prisma.tourAvailability.update({
        where: { id: availabilityId },
        data: {
          availableSlots: {
            decrement: travelersCount
          }
        }
      });
    } catch (error) {
      console.error('Error reserving slots:', error);
      throw new Error('Failed to reserve slots');
    }
  }

  /**
   * Release slots from a cancelled booking (increase available slots)
   */
  static async releaseSlots(
    availabilityId: string,
    travelersCount: number
  ): Promise<void> {
    try {
      await prisma.tourAvailability.update({
        where: { id: availabilityId },
        data: {
          availableSlots: {
            increment: travelersCount
          }
        }
      });
    } catch (error) {
      console.error('Error releasing slots:', error);
      throw new Error('Failed to release slots');
    }
  }

  /**
   * Get upcoming availabilities for a tour
   */
  static async getUpcomingAvailabilities(
    tourId: string,
    limit: number = 10
  ): Promise<AvailabilityInfo[]> {
    const now = new Date();
    // Using limit to fetch only required number of availabilities if needed in future
    // For now checkAvailability returns all valid future dates
    const allAvailabilities = await this.checkAvailability(tourId, now);
    return allAvailabilities.slice(0, limit);
  }
}
