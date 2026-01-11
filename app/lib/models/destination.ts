import { Destination as PrismaDestination } from '@prisma/client';

export type Destination = PrismaDestination;

export interface CreateDestinationData {
  name: string;
  country: string;
  description: string;
  coverImage: string;
}

export interface UpdateDestinationData {
  name?: string;
  country?: string;
  description?: string;
  coverImage?: string;
}

export class DestinationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DestinationValidationError';
  }
}

export class DestinationValidator {
  static validateCreateData(data: CreateDestinationData): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new DestinationValidationError('Destination name is required');
    }

    if (data.name.trim().length < 2) {
      throw new DestinationValidationError('Destination name must be at least 2 characters long');
    }

    if (!data.country || data.country.trim().length === 0) {
      throw new DestinationValidationError('Country is required');
    }

    if (data.country.trim().length < 2) {
      throw new DestinationValidationError('Country must be at least 2 characters long');
    }

    if (!data.description || data.description.trim().length === 0) {
      throw new DestinationValidationError('Description is required');
    }

    if (data.description.trim().length < 10) {
      throw new DestinationValidationError('Description must be at least 10 characters long');
    }

    if (!data.coverImage || data.coverImage.trim().length === 0) {
      throw new DestinationValidationError('Cover image is required');
    }

    if (!this.isValidImageUrl(data.coverImage)) {
      throw new DestinationValidationError('Invalid cover image URL format');
    }
  }

  static validateUpdateData(data: UpdateDestinationData): void {
    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        throw new DestinationValidationError('Destination name cannot be empty');
      }
      if (data.name.trim().length < 2) {
        throw new DestinationValidationError('Destination name must be at least 2 characters long');
      }
    }

    if (data.country !== undefined) {
      if (!data.country || data.country.trim().length === 0) {
        throw new DestinationValidationError('Country cannot be empty');
      }
      if (data.country.trim().length < 2) {
        throw new DestinationValidationError('Country must be at least 2 characters long');
      }
    }

    if (data.description !== undefined) {
      if (!data.description || data.description.trim().length === 0) {
        throw new DestinationValidationError('Description cannot be empty');
      }
      if (data.description.trim().length < 10) {
        throw new DestinationValidationError('Description must be at least 10 characters long');
      }
    }

    if (data.coverImage !== undefined) {
      if (!data.coverImage || data.coverImage.trim().length === 0) {
        throw new DestinationValidationError('Cover image cannot be empty');
      }
      if (!this.isValidImageUrl(data.coverImage)) {
        throw new DestinationValidationError('Invalid cover image URL format');
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