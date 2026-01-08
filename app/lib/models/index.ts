// User model exports
export type {
  User,
  CreateUserData,
  UpdateUserData,
  UserValidationError,
} from './user';

export {
  UserValidator,
} from './user';

// Destination model exports
export type {
  Destination,
  CreateDestinationData,
  UpdateDestinationData,
  DestinationValidationError,
} from './destination';

export {
  DestinationValidator,
} from './destination';

// Tour model exports
export type {
  Tour,
  ItineraryDay,
  CreateTourData,
  UpdateTourData,
  TourValidationError,
} from './tour';

export {
  TourValidator,
} from './tour';

// Tour Availability model exports
export type {
  TourAvailability,
  CreateTourAvailabilityData,
  UpdateTourAvailabilityData,
  TourAvailabilityValidationError,
} from './tour-availability';

export {
  TourAvailabilityValidator,
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
  ContentValidationError,
} from './content';

export {
  ContentValidator,
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
} from '@/app/generated/prisma';