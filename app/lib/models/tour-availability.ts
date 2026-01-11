import { TourAvailability as PrismaTourAvailability } from '@prisma/client';

export type TourAvailability = PrismaTourAvailability;

export interface CreateTourAvailabilityData {
  tourId: string;
  startDate: Date;
  endDate: Date;
  availableSlots: number;
}

export interface UpdateTourAvailabilityData {
  startDate?: Date;
  endDate?: Date;
  availableSlots?: number;
}

export class TourAvailabilityValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TourAvailabilityValidationError';
  }
}

export class TourAvailabilityValidator {
  static validateCreateData(data: CreateTourAvailabilityData): void {
    // Validate tour ID
    if (!data.tourId || data.tourId.trim().length === 0) {
      throw new TourAvailabilityValidationError('Tour ID is required');
    }

    // Validate dates
    if (!(data.startDate instanceof Date) || isNaN(data.startDate.getTime())) {
      throw new TourAvailabilityValidationError('Start date must be a valid date');
    }

    if (!(data.endDate instanceof Date) || isNaN(data.endDate.getTime())) {
      throw new TourAvailabilityValidationError('End date must be a valid date');
    }

    // Start date should not be in the past (allow same day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(data.startDate);
    startDate.setHours(0, 0, 0, 0);

    if (startDate < today) {
      throw new TourAvailabilityValidationError('Start date cannot be in the past');
    }

    // End date should be after or equal to start date
    const endDate = new Date(data.endDate);
    endDate.setHours(0, 0, 0, 0);

    if (endDate < startDate) {
      throw new TourAvailabilityValidationError('End date must be after or equal to start date');
    }

    // Validate available slots
    if (!Number.isInteger(data.availableSlots) || data.availableSlots < 0) {
      throw new TourAvailabilityValidationError('Available slots must be a non-negative integer');
    }

    if (data.availableSlots > 1000) {
      throw new TourAvailabilityValidationError('Available slots cannot exceed 1000');
    }
  }

  static validateUpdateData(data: UpdateTourAvailabilityData, currentData?: TourAvailability): void {
    let startDate = currentData?.startDate;
    let endDate = currentData?.endDate;

    if (data.startDate !== undefined) {
      if (!(data.startDate instanceof Date) || isNaN(data.startDate.getTime())) {
        throw new TourAvailabilityValidationError('Start date must be a valid date');
      }

      // Start date should not be in the past (allow same day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newStartDate = new Date(data.startDate);
      newStartDate.setHours(0, 0, 0, 0);

      if (newStartDate < today) {
        throw new TourAvailabilityValidationError('Start date cannot be in the past');
      }

      startDate = data.startDate;
    }

    if (data.endDate !== undefined) {
      if (!(data.endDate instanceof Date) || isNaN(data.endDate.getTime())) {
        throw new TourAvailabilityValidationError('End date must be a valid date');
      }
      endDate = data.endDate;
    }

    // Validate date relationship if both dates are available
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);

      if (end < start) {
        throw new TourAvailabilityValidationError('End date must be after or equal to start date');
      }
    }

    if (data.availableSlots !== undefined) {
      if (!Number.isInteger(data.availableSlots) || data.availableSlots < 0) {
        throw new TourAvailabilityValidationError('Available slots must be a non-negative integer');
      }

      if (data.availableSlots > 1000) {
        throw new TourAvailabilityValidationError('Available slots cannot exceed 1000');
      }
    }
  }

  static validateSlotReduction(currentSlots: number, reduction: number): void {
    if (!Number.isInteger(reduction) || reduction < 0) {
      throw new TourAvailabilityValidationError('Slot reduction must be a non-negative integer');
    }

    if (reduction > currentSlots) {
      throw new TourAvailabilityValidationError('Cannot reduce more slots than available');
    }
  }

  static isAvailable(availability: TourAvailability, requestedSlots: number): boolean {
    return availability.availableSlots >= requestedSlots;
  }

  static isDateInRange(availability: TourAvailability, date: Date): boolean {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    const startDate = new Date(availability.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(availability.endDate);
    endDate.setHours(0, 0, 0, 0);

    return checkDate >= startDate && checkDate <= endDate;
  }
}