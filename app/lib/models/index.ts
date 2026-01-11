// User model exports
export type {
  User,
  CreateUserData,
  UpdateUserData,
} from './user';

export {
  UserValidator,
  UserValidationError,
} from './user';

// Destination model exports
export type {
  Destination,
  CreateDestinationData,
  UpdateDestinationData,
} from './destination';

export {
  DestinationValidator,
  DestinationValidationError,
} from './destination';

// Tour model exports
export type {
  Tour,
  ItineraryDay,
  CreateTourData,
  UpdateTourData,
} from './tour';

export {
  TourValidator,
  TourValidationError,
} from './tour';

// Tour Availability model exports
export type {
  TourAvailability,
  CreateTourAvailabilityData,
  UpdateTourAvailabilityData,
} from './tour-availability';

export {
  TourAvailabilityValidator,
  TourAvailabilityValidationError,
} from './tour-availability';

// Business rules exports
export type {
  BusinessRuleError,
} from '../validation/business-rules';

export {
  BusinessRuleValidator,
} from '../validation/business-rules';

// Content model exports
export type {
  Content,
  CreateContentData,
  UpdateContentData,
  ContentVersion,
} from './content';

export {
  ContentValidator,
  ContentValidationError,
} from './content';

// Re-export Prisma enums for convenience
export {
  UserRole,
  TourStatus,
  Difficulty,
  BookingStatus,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
  ContentType,
} from '@prisma/client';