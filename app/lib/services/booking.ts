import { BookingStatus } from '../../generated/prisma';
import { AvailabilityService } from './availability';
import { prisma } from '../prisma';

export interface CreateBookingData {
  userId: string;
  tourId: string;
  availabilityId: string;
  travelersCount: number;
}

export interface BookingWithDetails {
  id: string;
  userId: string;
  tourId: string;
  availabilityId: string;
  travelersCount: number;
  totalPrice: number;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
  tour: {
    id: string;
    title: string;
    pricePerPerson: number;
    destination: {
      id: string;
      name: string;
      country: string;
    };
  };
  availability: {
    id: string;
    startDate: Date;
    endDate: Date;
    availableSlots: number;
  };
}

export class BookingService {
  /**
   * Create a new booking
   */
  static async createBooking(data: CreateBookingData): Promise<BookingWithDetails> {
    try {
      // Validate availability
      const canAccommodate = await AvailabilityService.canAccommodateBooking(
        data.availabilityId,
        data.travelersCount
      );

      if (!canAccommodate) {
        throw new Error('Not enough available slots for this booking');
      }

      // Get tour details for price calculation
      const availability = await prisma.tourAvailability.findUnique({
        where: { id: data.availabilityId },
        include: {
          tour: {
            include: {
              destination: true
            }
          }
        }
      });

      if (!availability) {
        throw new Error('Tour availability not found');
      }

      // Calculate total price
      const totalPrice = availability.tour.pricePerPerson * data.travelersCount;

      // Create booking
      const booking = await prisma.booking.create({
        data: {
          userId: data.userId,
          tourId: data.tourId,
          availabilityId: data.availabilityId,
          travelersCount: data.travelersCount,
          totalPrice,
          status: 'PENDING'
        },
        include: {
          tour: {
            include: {
              destination: true
            }
          },
          availability: true
        }
      });

      return booking as BookingWithDetails;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  /**
   * Confirm a booking (usually after successful payment)
   */
  static async confirmBooking(bookingId: string): Promise<BookingWithDetails> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          availability: true
        }
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.status !== 'PENDING') {
        throw new Error('Only pending bookings can be confirmed');
      }

      // Use transaction to ensure atomicity
      const confirmedBooking = await prisma.$transaction(async (tx) => {
        // Reduce available slots
        await tx.tourAvailability.update({
          where: { id: booking.availabilityId },
          data: {
            availableSlots: {
              decrement: booking.travelersCount
            }
          }
        });

        // Update booking status
        return await tx.booking.update({
          where: { id: bookingId },
          data: { status: 'CONFIRMED' },
          include: {
            tour: {
              include: {
                destination: true
              }
            },
            availability: true
          }
        });
      });

      return confirmedBooking as BookingWithDetails;
    } catch (error) {
      console.error('Error confirming booking:', error);
      throw error;
    }
  }

  /**
   * Cancel a booking
   */
  static async cancelBooking(bookingId: string): Promise<BookingWithDetails> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.status === 'CANCELLED') {
        throw new Error('Booking is already cancelled');
      }

      // Use transaction to ensure atomicity
      const cancelledBooking = await prisma.$transaction(async (tx) => {
        // If booking was confirmed, restore available slots
        if (booking.status === 'CONFIRMED') {
          await tx.tourAvailability.update({
            where: { id: booking.availabilityId },
            data: {
              availableSlots: {
                increment: booking.travelersCount
              }
            }
          });
        }

        // Update booking status
        return await tx.booking.update({
          where: { id: bookingId },
          data: { status: 'CANCELLED' },
          include: {
            tour: {
              include: {
                destination: true
              }
            },
            availability: true
          }
        });
      });

      return cancelledBooking as BookingWithDetails;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }

  /**
   * Get bookings for a user
   */
  static async getUserBookings(userId: string): Promise<BookingWithDetails[]> {
    try {
      const bookings = await prisma.booking.findMany({
        where: { userId },
        include: {
          tour: {
            include: {
              destination: true
            }
          },
          availability: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return bookings as BookingWithDetails[];
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      throw error;
    }
  }

  /**
   * Get booking by ID
   */
  static async getBookingById(bookingId: string): Promise<BookingWithDetails | null> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          tour: {
            include: {
              destination: true
            }
          },
          availability: true,
          payments: true
        }
      });

      return booking as BookingWithDetails | null;
    } catch (error) {
      console.error('Error fetching booking:', error);
      throw error;
    }
  }

  /**
   * Update booking status
   */
  static async updateBookingStatus(
    bookingId: string,
    status: BookingStatus
  ): Promise<BookingWithDetails> {
    try {
      const currentBooking = await prisma.booking.findUnique({
        where: { id: bookingId }
      });

      if (!currentBooking) {
        throw new Error('Booking not found');
      }

      // Handle slot management based on status change
      if (status === 'CONFIRMED' && currentBooking.status === 'PENDING') {
        return await this.confirmBooking(bookingId);
      } else if (status === 'CANCELLED') {
        return await this.cancelBooking(bookingId);
      } else {
        // Simple status update
        const updatedBooking = await prisma.booking.update({
          where: { id: bookingId },
          data: { status },
          include: {
            tour: {
              include: {
                destination: true
              }
            },
            availability: true
          }
        });

        return updatedBooking as BookingWithDetails;
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  }
}
