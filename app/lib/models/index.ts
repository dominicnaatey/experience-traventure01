// User model exports
export {
  User,
  CreateUserData,
  UpdateUserData,
  UserValidationError,
  UserValidator,
} from './user';

// Destination model exports
export {
  Destination,
  CreateDestinationData,
  UpdateDestinationData,
  DestinationValidationError,
  DestinationValidator,
} from './destination';

// Tour model exports
export {
  Tour,
  ItineraryDay,
  CreateTourData,
  UpdateTourData,
  TourValidationError,
  TourValidator,
} from './tour';

// Tour Availability model exports
export {
  TourAvailability,
  CreateTourAvailabilityData,
  UpdateTourAvailabilityData,
  TourAvailabilityValidationError,
  TourAvailabilityValidator,
} from './tour-availability';

// Business rules exports
export {
  BusinessRuleError,
  BusinessRuleValidator,
} from '../validation/business-rules';

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