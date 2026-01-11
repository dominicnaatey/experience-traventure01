import { UserRole } from '@prisma/client';
import { User } from '../models/user';
import { Tour, ItineraryDay } from '../models/tour';
import { TourAvailability } from '../models/tour-availability';

export class BusinessRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessRuleError';
  }
}

export class BusinessRuleValidator {
  /**
   * Validates that a user has the required role to perform an action
   */
  static validateUserRole(user: User, requiredRole: UserRole): void {
    const roleHierarchy = {
      [UserRole.CUSTOMER]: 0,
      [UserRole.STAFF]: 1,
      [UserRole.ADMIN]: 2,
    };

    if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
      throw new BusinessRuleError(`Insufficient permissions. Required role: ${requiredRole}`);
    }
  }

  /**
   * Validates that only admins can manage tours and destinations
   */
  static validateAdminAccess(user: User): void {
    if (user.role !== UserRole.ADMIN) {
      throw new BusinessRuleError('Only administrators can perform this action');
    }
  }

  /**
   * Validates pricing business rules
   */
  static validatePricing(pricePerPerson: number, maxGroupSize: number): void {
    // Minimum price validation
    if (pricePerPerson < 1) {
      throw new BusinessRuleError('Price per person must be at least $1');
    }

    // Maximum price validation
    if (pricePerPerson > 100000) {
      throw new BusinessRuleError('Price per person cannot exceed $100,000');
    }

    // Group size validation
    if (maxGroupSize < 1) {
      throw new BusinessRuleError('Maximum group size must be at least 1');
    }

    if (maxGroupSize > 100) {
      throw new BusinessRuleError('Maximum group size cannot exceed 100');
    }

    // Price should be reasonable for group size
    const totalMaxRevenue = pricePerPerson * maxGroupSize;
    if (totalMaxRevenue > 1000000) {
      throw new BusinessRuleError('Total maximum revenue per tour cannot exceed $1,000,000');
    }
  }

  /**
   * Validates availability business rules
   */
  static validateAvailability(
    tour: Tour,
    availability: TourAvailability,
    requestedSlots: number
  ): void {
    // Check if tour is active
    if (tour.status !== 'ACTIVE') {
      throw new BusinessRuleError('Cannot book inactive tours');
    }

    // Check if enough slots are available
    if (availability.availableSlots < requestedSlots) {
      throw new BusinessRuleError(
        `Insufficient availability. Requested: ${requestedSlots}, Available: ${availability.availableSlots}`
      );
    }

    // Check if requested slots don't exceed tour's max group size
    if (requestedSlots > tour.maxGroupSize) {
      throw new BusinessRuleError(
        `Requested slots (${requestedSlots}) exceed tour's maximum group size (${tour.maxGroupSize})`
      );
    }

    // Check if availability dates are in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(availability.startDate);
    startDate.setHours(0, 0, 0, 0);

    if (startDate < today) {
      throw new BusinessRuleError('Cannot book tours that have already started');
    }
  }

  /**
   * Validates tour creation business rules
   */
  static validateTourCreation(tourData: {
    durationDays: number;
    pricePerPerson: number;
    maxGroupSize: number;
    itinerary: ItineraryDay[];
  }): void {
    // Validate pricing
    this.validatePricing(tourData.pricePerPerson, tourData.maxGroupSize);

    // Validate duration constraints
    if (tourData.durationDays < 1) {
      throw new BusinessRuleError('Tour duration must be at least 1 day');
    }

    if (tourData.durationDays > 365) {
      throw new BusinessRuleError('Tour duration cannot exceed 365 days');
    }

    // Validate group size constraints
    if (tourData.maxGroupSize < 1) {
      throw new BusinessRuleError('Maximum group size must be at least 1');
    }

    if (tourData.maxGroupSize > 100) {
      throw new BusinessRuleError('Maximum group size cannot exceed 100 people');
    }

    // Validate itinerary matches duration
    if (tourData.itinerary.length !== tourData.durationDays) {
      throw new BusinessRuleError(
        `Itinerary must have exactly ${tourData.durationDays} days, but has ${tourData.itinerary.length}`
      );
    }
  }

  /**
   * Validates booking business rules
   */
  static validateBooking(
    user: User,
    tour: Tour,
    availability: TourAvailability,
    travelersCount: number,
    totalPrice: number
  ): void {
    // Validate user can make bookings
    if (user.role === UserRole.ADMIN) {
      // Admins can book on behalf of customers, but let's allow it
    }

    // Validate availability
    this.validateAvailability(tour, availability, travelersCount);

    // Validate travelers count
    if (travelersCount < 1) {
      throw new BusinessRuleError('Number of travelers must be at least 1');
    }

    if (travelersCount > tour.maxGroupSize) {
      throw new BusinessRuleError(
        `Number of travelers (${travelersCount}) cannot exceed tour's maximum group size (${tour.maxGroupSize})`
      );
    }

    // Validate price calculation
    const expectedPrice = tour.pricePerPerson * travelersCount;
    if (Math.abs(totalPrice - expectedPrice) > 0.01) {
      throw new BusinessRuleError(
        `Price mismatch. Expected: $${expectedPrice.toFixed(2)}, Provided: $${totalPrice.toFixed(2)}`
      );
    }
  }

  /**
   * Validates review business rules
   */
  static validateReview(
    user: User,
    rating: number,
    comment: string,
    hasCompletedBooking: boolean
  ): void {
    // Only customers who have completed bookings can review
    if (!hasCompletedBooking) {
      throw new BusinessRuleError('Only customers with completed bookings can leave reviews');
    }

    // Validate rating range
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BusinessRuleError('Rating must be an integer between 1 and 5');
    }

    // Validate comment
    if (!comment || comment.trim().length === 0) {
      throw new BusinessRuleError('Review comment is required');
    }

    if (comment.trim().length < 10) {
      throw new BusinessRuleError('Review comment must be at least 10 characters long');
    }

    if (comment.length > 1000) {
      throw new BusinessRuleError('Review comment cannot exceed 1000 characters');
    }
  }

  /**
   * Validates payment business rules
   */
  static validatePayment(
    amount: number,
    currency: string,
    method: string,
    provider: string
  ): void {
    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      throw new BusinessRuleError('Payment amount must be a positive number');
    }

    if (amount > 1000000) {
      throw new BusinessRuleError('Payment amount cannot exceed $1,000,000');
    }

    // Validate currency
    const supportedCurrencies = ['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES'];
    if (!supportedCurrencies.includes(currency.toUpperCase())) {
      throw new BusinessRuleError(`Unsupported currency: ${currency}`);
    }

    // Validate method and provider combination
    const validCombinations = {
      STRIPE: ['CARD'],
      PAYSTACK: ['CARD', 'MOBILE_MONEY', 'BANK'],
      FLUTTERWAVE: ['CARD', 'MOBILE_MONEY', 'BANK'],
    };

    if (!validCombinations[provider as keyof typeof validCombinations]) {
      throw new BusinessRuleError(`Unsupported payment provider: ${provider}`);
    }

    if (!validCombinations[provider as keyof typeof validCombinations].includes(method)) {
      throw new BusinessRuleError(`Payment method ${method} not supported by provider ${provider}`);
    }
  }

  /**
   * Validates content management business rules
   */
  static validateContentManagement(user: User, contentType: string): void {
    // Only admins and staff can manage content
    if (user.role === UserRole.CUSTOMER) {
      throw new BusinessRuleError('Insufficient permissions to manage content');
    }

    // Validate content type
    const supportedTypes = ['BLOG', 'FAQ', 'PAGE'];
    if (!supportedTypes.includes(contentType.toUpperCase())) {
      throw new BusinessRuleError(`Unsupported content type: ${contentType}`);
    }
  }

  /**
   * Validates data encryption requirements
   */
  static validateSensitiveData(data: unknown, fieldName: string): void {
    // Check if sensitive data is being stored in plain text
    const sensitiveFields = ['password', 'passwordHash', 'paymentDetails', 'cardNumber', 'cvv'];
    
    if (sensitiveFields.some(field => fieldName.toLowerCase().includes(field))) {
      if (typeof data === 'string' && data.length < 20) {
        // Likely plain text if too short for encrypted data
        throw new BusinessRuleError(`Sensitive field ${fieldName} must be encrypted`);
      }
    }
  }

  /**
   * Validates referential integrity rules
   */
  static validateReferentialIntegrity(
    entityType: string,
    entityId: string,
    relatedEntityType: string,
    relatedEntityId: string
  ): void {
    if (!entityId || entityId.trim().length === 0) {
      throw new BusinessRuleError(`${entityType} ID is required`);
    }

    if (!relatedEntityId || relatedEntityId.trim().length === 0) {
      throw new BusinessRuleError(`${relatedEntityType} ID is required for ${entityType}`);
    }

    // Validate ID format (assuming CUID format)
    const cuidRegex = /^c[a-z0-9]{24}$/;
    if (!cuidRegex.test(entityId)) {
      throw new BusinessRuleError(`Invalid ${entityType} ID format`);
    }

    if (!cuidRegex.test(relatedEntityId)) {
      throw new BusinessRuleError(`Invalid ${relatedEntityType} ID format`);
    }
  }
}