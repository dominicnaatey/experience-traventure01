import { Tour as PrismaTour, TourStatus, Difficulty } from '@/app/generated/prisma';

export type Tour = PrismaTour;

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface CreateTourData {
  destinationId: string;
  title: string;
  description: string;
  durationDays: number;
  pricePerPerson: number;
  maxGroupSize: number;
  difficulty?: Difficulty;
  inclusions: string[];
  exclusions: string[];
  itinerary: ItineraryDay[];
  images: string[];
  status?: TourStatus;
}

export interface UpdateTourData {
  destinationId?: string;
  title?: string;
  description?: string;
  durationDays?: number;
  pricePerPerson?: number;
  maxGroupSize?: number;
  difficulty?: Difficulty;
  inclusions?: string[];
  exclusions?: string[];
  itinerary?: ItineraryDay[];
  images?: string[];
  status?: TourStatus;
}

export class TourValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TourValidationError';
  }
}

export class TourValidator {
  static validateCreateData(data: CreateTourData): void {
    // Validate destination ID
    if (!data.destinationId || data.destinationId.trim().length === 0) {
      throw new TourValidationError('Destination ID is required');
    }

    // Validate title
    if (!data.title || data.title.trim().length === 0) {
      throw new TourValidationError('Tour title is required');
    }

    if (data.title.trim().length < 5) {
      throw new TourValidationError('Tour title must be at least 5 characters long');
    }

    // Validate description
    if (!data.description || data.description.trim().length === 0) {
      throw new TourValidationError('Tour description is required');
    }

    if (data.description.trim().length < 20) {
      throw new TourValidationError('Tour description must be at least 20 characters long');
    }

    // Validate duration
    if (!Number.isInteger(data.durationDays) || data.durationDays <= 0) {
      throw new TourValidationError('Duration must be a positive integer');
    }

    if (data.durationDays > 365) {
      throw new TourValidationError('Duration cannot exceed 365 days');
    }

    // Validate pricing
    if (typeof data.pricePerPerson !== 'number' || data.pricePerPerson <= 0 || isNaN(data.pricePerPerson)) {
      throw new TourValidationError('Price per person must be a positive number');
    }

    if (data.pricePerPerson > 100000) {
      throw new TourValidationError('Price per person cannot exceed $100,000');
    }

    // Validate group size
    if (!Number.isInteger(data.maxGroupSize) || data.maxGroupSize <= 0) {
      throw new TourValidationError('Max group size must be a positive integer');
    }

    if (data.maxGroupSize > 100) {
      throw new TourValidationError('Max group size cannot exceed 100');
    }

    // Validate difficulty
    if (data.difficulty && !Object.values(Difficulty).includes(data.difficulty)) {
      throw new TourValidationError('Invalid difficulty level');
    }

    // Validate inclusions
    if (!Array.isArray(data.inclusions)) {
      throw new TourValidationError('Inclusions must be an array');
    }

    if (data.inclusions.length === 0) {
      throw new TourValidationError('At least one inclusion is required');
    }

    data.inclusions.forEach((inclusion, index) => {
      if (!inclusion || inclusion.trim().length === 0) {
        throw new TourValidationError(`Inclusion at index ${index} cannot be empty`);
      }
    });

    // Validate exclusions
    if (!Array.isArray(data.exclusions)) {
      throw new TourValidationError('Exclusions must be an array');
    }

    data.exclusions.forEach((exclusion, index) => {
      if (!exclusion || exclusion.trim().length === 0) {
        throw new TourValidationError(`Exclusion at index ${index} cannot be empty`);
      }
    });

    // Validate itinerary
    if (!Array.isArray(data.itinerary)) {
      throw new TourValidationError('Itinerary must be an array');
    }

    if (data.itinerary.length === 0) {
      throw new TourValidationError('Itinerary cannot be empty');
    }

    if (data.itinerary.length !== data.durationDays) {
      throw new TourValidationError('Itinerary must have one entry per day of duration');
    }

    this.validateItinerary(data.itinerary);

    // Validate images
    if (!Array.isArray(data.images)) {
      throw new TourValidationError('Images must be an array');
    }

    if (data.images.length === 0) {
      throw new TourValidationError('At least one image is required');
    }

    data.images.forEach((image, index) => {
      if (!this.isValidImageUrl(image)) {
        throw new TourValidationError(`Invalid image URL at index ${index}`);
      }
    });

    // Validate status
    if (data.status && !Object.values(TourStatus).includes(data.status)) {
      throw new TourValidationError('Invalid tour status');
    }
  }

  static validateUpdateData(data: UpdateTourData): void {
    if (data.destinationId !== undefined) {
      if (!data.destinationId || data.destinationId.trim().length === 0) {
        throw new TourValidationError('Destination ID cannot be empty');
      }
    }

    if (data.title !== undefined) {
      if (!data.title || data.title.trim().length === 0) {
        throw new TourValidationError('Tour title cannot be empty');
      }
      if (data.title.trim().length < 5) {
        throw new TourValidationError('Tour title must be at least 5 characters long');
      }
    }

    if (data.description !== undefined) {
      if (!data.description || data.description.trim().length === 0) {
        throw new TourValidationError('Tour description cannot be empty');
      }
      if (data.description.trim().length < 20) {
        throw new TourValidationError('Tour description must be at least 20 characters long');
      }
    }

    if (data.durationDays !== undefined) {
      if (!Number.isInteger(data.durationDays) || data.durationDays <= 0) {
        throw new TourValidationError('Duration must be a positive integer');
      }
      if (data.durationDays > 365) {
        throw new TourValidationError('Duration cannot exceed 365 days');
      }
    }

    if (data.pricePerPerson !== undefined) {
      if (typeof data.pricePerPerson !== 'number' || data.pricePerPerson <= 0 || isNaN(data.pricePerPerson)) {
        throw new TourValidationError('Price per person must be a positive number');
      }
      if (data.pricePerPerson > 100000) {
        throw new TourValidationError('Price per person cannot exceed $100,000');
      }
    }

    if (data.maxGroupSize !== undefined) {
      if (!Number.isInteger(data.maxGroupSize) || data.maxGroupSize <= 0) {
        throw new TourValidationError('Max group size must be a positive integer');
      }
      if (data.maxGroupSize > 100) {
        throw new TourValidationError('Max group size cannot exceed 100');
      }
    }

    if (data.difficulty !== undefined && data.difficulty !== null) {
      if (!Object.values(Difficulty).includes(data.difficulty)) {
        throw new TourValidationError('Invalid difficulty level');
      }
    }

    if (data.inclusions !== undefined) {
      if (!Array.isArray(data.inclusions)) {
        throw new TourValidationError('Inclusions must be an array');
      }
      if (data.inclusions.length === 0) {
        throw new TourValidationError('At least one inclusion is required');
      }
      data.inclusions.forEach((inclusion, index) => {
        if (!inclusion || inclusion.trim().length === 0) {
          throw new TourValidationError(`Inclusion at index ${index} cannot be empty`);
        }
      });
    }

    if (data.exclusions !== undefined) {
      if (!Array.isArray(data.exclusions)) {
        throw new TourValidationError('Exclusions must be an array');
      }
      data.exclusions.forEach((exclusion, index) => {
        if (!exclusion || exclusion.trim().length === 0) {
          throw new TourValidationError(`Exclusion at index ${index} cannot be empty`);
        }
      });
    }

    if (data.itinerary !== undefined) {
      if (!Array.isArray(data.itinerary)) {
        throw new TourValidationError('Itinerary must be an array');
      }
      if (data.itinerary.length === 0) {
        throw new TourValidationError('Itinerary cannot be empty');
      }
      this.validateItinerary(data.itinerary);
    }

    if (data.images !== undefined) {
      if (!Array.isArray(data.images)) {
        throw new TourValidationError('Images must be an array');
      }
      if (data.images.length === 0) {
        throw new TourValidationError('At least one image is required');
      }
      data.images.forEach((image, index) => {
        if (!this.isValidImageUrl(image)) {
          throw new TourValidationError(`Invalid image URL at index ${index}`);
        }
      });
    }

    if (data.status !== undefined && !Object.values(TourStatus).includes(data.status)) {
      throw new TourValidationError('Invalid tour status');
    }
  }

  static validateItinerary(itinerary: ItineraryDay[]): void {
    const dayNumbers = new Set<number>();

    itinerary.forEach((day, index) => {
      if (!Number.isInteger(day.day) || day.day <= 0) {
        throw new TourValidationError(`Day number at index ${index} must be a positive integer`);
      }

      if (dayNumbers.has(day.day)) {
        throw new TourValidationError(`Duplicate day number ${day.day} in itinerary`);
      }
      dayNumbers.add(day.day);

      if (!day.title || day.title.trim().length === 0) {
        throw new TourValidationError(`Day ${day.day} title cannot be empty`);
      }

      if (day.title.trim().length < 3) {
        throw new TourValidationError(`Day ${day.day} title must be at least 3 characters long`);
      }

      if (!day.description || day.description.trim().length === 0) {
        throw new TourValidationError(`Day ${day.day} description cannot be empty`);
      }

      if (day.description.trim().length < 10) {
        throw new TourValidationError(`Day ${day.day} description must be at least 10 characters long`);
      }
    });

    // Check if day numbers are consecutive starting from 1
    const sortedDays = Array.from(dayNumbers).sort((a, b) => a - b);
    for (let i = 0; i < sortedDays.length; i++) {
      if (sortedDays[i] !== i + 1) {
        throw new TourValidationError('Itinerary days must be consecutive starting from 1');
      }
    }
  }

  private static isValidImageUrl(url: string): boolean {
    try {
      new URL(url);
      // Check if URL ends with common image extensions or is from common image hosting services
      const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
      const imageHosts = /(cloudinary|amazonaws|imgur|unsplash|pexels)/i;
      
      return imageExtensions.test(url) || imageHosts.test(url);
    } catch {
      return false;
    }
  }
}