/**
 * **Feature: travel-tour-booking, Property 19: Tour creation validation**
 * **Validates: Requirements 6.1**
 * 
 * Property-based test for tour creation validation.
 * For any tour creation attempt, all required fields (destination, pricing, itinerary) must be present and valid.
 */

import { describe, it, expect } from '@jest/globals'
import * as fc from 'fast-check'
import { TourValidator, CreateTourData, TourValidationError, ItineraryDay } from '@/app/lib/models'
import { Difficulty, TourStatus } from '@prisma/client'

describe('Tour Creation Validation Properties', () => {
  it('should validate all required fields for tour creation', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          destinationId: fc.string({ minLength: 25, maxLength: 25 }).filter(s => s.trim().length > 0), // CUID format
          title: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length >= 5),
          description: fc.string({ minLength: 20, maxLength: 500 }).filter(s => s.trim().length >= 20),
          durationDays: fc.integer({ min: 1, max: 365 }),
          pricePerPerson: fc.float({ min: 1, max: 100000, noNaN: true }),
          maxGroupSize: fc.integer({ min: 1, max: 100 }),
          difficulty: fc.constantFrom(Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD),
          inclusions: fc.array(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), { minLength: 1, maxLength: 10 }),
          exclusions: fc.array(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), { minLength: 0, maxLength: 10 }),
          images: fc.array(
            fc.oneof(
              fc.constant('https://example.com/image.jpg'),
              fc.constant('https://cloudinary.com/image.png'),
              fc.constant('https://amazonaws.com/bucket/image.webp')
            ),
            { minLength: 1, maxLength: 5 }
          ),
          status: fc.constantFrom(TourStatus.ACTIVE, TourStatus.INACTIVE)
        }),
        (baseData) => {
          // Generate itinerary that matches duration
          const itinerary: ItineraryDay[] = Array.from({ length: baseData.durationDays }, (_, index) => ({
            day: index + 1,
            title: `Day ${index + 1} Activity`,
            description: `Description for day ${index + 1} activities and schedule`
          }))

          const tourData: CreateTourData = {
            ...baseData,
            itinerary
          }

          // Property: Valid tour data should not throw validation errors
          expect(() => TourValidator.validateCreateData(tourData)).not.toThrow()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should reject tour creation with missing required fields', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          destinationId: fc.oneof(
            fc.constant(''),
            fc.constant('   '), // whitespace only
            fc.constant(undefined as unknown as string)
          ),
          title: fc.oneof(
            fc.constant(''),
            fc.constant('   '), // whitespace only
            fc.string({ maxLength: 4 }), // too short
            fc.constant(undefined as unknown as string)
          ),
          description: fc.oneof(
            fc.constant(''),
            fc.constant('   '), // whitespace only
            fc.string({ maxLength: 19 }), // too short
            fc.constant(undefined as unknown as string)
          )
        }),
        (invalidData) => {
          const validTourData: CreateTourData = {
            destinationId: 'valid-destination-id-123',
            title: 'Valid Tour Title',
            description: 'This is a valid tour description with enough characters',
            durationDays: 3,
            pricePerPerson: 100,
            maxGroupSize: 10,
            inclusions: ['Accommodation', 'Meals'],
            exclusions: ['Flights'],
            itinerary: [
              { day: 1, title: 'Day 1', description: 'Day 1 activities' },
              { day: 2, title: 'Day 2', description: 'Day 2 activities' },
              { day: 3, title: 'Day 3', description: 'Day 3 activities' }
            ],
            images: ['https://example.com/image.jpg']
          }

          // Property: Missing destination ID should be rejected
          if (invalidData.destinationId !== undefined) {
            const tourWithInvalidDestination = { ...validTourData, destinationId: invalidData.destinationId }
            expect(() => TourValidator.validateCreateData(tourWithInvalidDestination))
              .toThrow(TourValidationError)
          }

          // Property: Invalid title should be rejected
          if (invalidData.title !== undefined) {
            const tourWithInvalidTitle = { ...validTourData, title: invalidData.title }
            expect(() => TourValidator.validateCreateData(tourWithInvalidTitle))
              .toThrow(TourValidationError)
          }

          // Property: Invalid description should be rejected
          if (invalidData.description !== undefined) {
            const tourWithInvalidDescription = { ...validTourData, description: invalidData.description }
            expect(() => TourValidator.validateCreateData(tourWithInvalidDescription))
              .toThrow(TourValidationError)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should validate pricing constraints', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          invalidPrice: fc.oneof(
            fc.float({ max: 0 }), // negative or zero
            fc.float({ min: 100001 }), // too high
            fc.constant(NaN),
            fc.constant(Infinity),
            fc.constant(-Infinity)
          )
        }),
        (data) => {
          const validTourData: CreateTourData = {
            destinationId: 'valid-destination-id-123',
            title: 'Valid Tour Title',
            description: 'This is a valid tour description with enough characters',
            durationDays: 3,
            pricePerPerson: 100,
            maxGroupSize: 10,
            inclusions: ['Accommodation', 'Meals'],
            exclusions: ['Flights'],
            itinerary: [
              { day: 1, title: 'Day 1', description: 'Day 1 activities' },
              { day: 2, title: 'Day 2', description: 'Day 2 activities' },
              { day: 3, title: 'Day 3', description: 'Day 3 activities' }
            ],
            images: ['https://example.com/image.jpg']
          }

          // Property: Invalid pricing should be rejected
          const tourWithInvalidPrice = { ...validTourData, pricePerPerson: data.invalidPrice }
          expect(() => TourValidator.validateCreateData(tourWithInvalidPrice))
            .toThrow(TourValidationError)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should validate itinerary consistency with duration', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          durationDays: fc.integer({ min: 1, max: 10 }),
          wrongItineraryLength: fc.integer({ min: 1, max: 15 })
        }).filter(data => data.durationDays !== data.wrongItineraryLength),
        (data) => {
          const validTourData: CreateTourData = {
            destinationId: 'valid-destination-id-123',
            title: 'Valid Tour Title',
            description: 'This is a valid tour description with enough characters',
            durationDays: data.durationDays,
            pricePerPerson: 100,
            maxGroupSize: 10,
            inclusions: ['Accommodation', 'Meals'],
            exclusions: ['Flights'],
            itinerary: Array.from({ length: data.wrongItineraryLength }, (_, index) => ({
              day: index + 1,
              title: `Day ${index + 1}`,
              description: `Day ${index + 1} activities`
            })),
            images: ['https://example.com/image.jpg']
          }

          // Property: Itinerary length must match duration
          expect(() => TourValidator.validateCreateData(validTourData))
            .toThrow(TourValidationError)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should validate itinerary day numbering', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          durationDays: fc.integer({ min: 2, max: 5 })
        }),
        (data) => {
          const validTourData: CreateTourData = {
            destinationId: 'valid-destination-id-123',
            title: 'Valid Tour Title',
            description: 'This is a valid tour description with enough characters',
            durationDays: data.durationDays,
            pricePerPerson: 100,
            maxGroupSize: 10,
            inclusions: ['Accommodation', 'Meals'],
            exclusions: ['Flights'],
            itinerary: [], // Will be set below
            images: ['https://example.com/image.jpg']
          }

          // Property: Duplicate day numbers should be rejected
          const duplicateItinerary: ItineraryDay[] = [
            { day: 1, title: 'Day 1', description: 'Day 1 activities' },
            { day: 1, title: 'Day 1 Again', description: 'Duplicate day 1' }, // Duplicate
            ...Array.from({ length: data.durationDays - 2 }, (_, index) => ({
              day: index + 2,
              title: `Day ${index + 2}`,
              description: `Day ${index + 2} activities`
            }))
          ]

          const tourWithDuplicateDays = { ...validTourData, itinerary: duplicateItinerary }
          expect(() => TourValidator.validateCreateData(tourWithDuplicateDays))
            .toThrow(TourValidationError)

          // Property: Non-consecutive day numbers should be rejected
          const nonConsecutiveItinerary: ItineraryDay[] = [
            { day: 1, title: 'Day 1', description: 'Day 1 activities' },
            { day: 3, title: 'Day 3', description: 'Day 3 activities' }, // Skipped day 2
            ...Array.from({ length: data.durationDays - 2 }, (_, index) => ({
              day: index + 4,
              title: `Day ${index + 4}`,
              description: `Day ${index + 4} activities`
            }))
          ]

          const tourWithNonConsecutiveDays = { ...validTourData, itinerary: nonConsecutiveItinerary }
          expect(() => TourValidator.validateCreateData(tourWithNonConsecutiveDays))
            .toThrow(TourValidationError)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should validate group size constraints', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          invalidGroupSize: fc.oneof(
            fc.integer({ max: 0 }), // zero or negative
            fc.integer({ min: 101 }), // too large
            fc.float({ min: Math.fround(1.1), max: Math.fround(99.9) }) // non-integer
          )
        }),
        (data) => {
          const validTourData: CreateTourData = {
            destinationId: 'valid-destination-id-123',
            title: 'Valid Tour Title',
            description: 'This is a valid tour description with enough characters',
            durationDays: 3,
            pricePerPerson: 100,
            maxGroupSize: 10,
            inclusions: ['Accommodation', 'Meals'],
            exclusions: ['Flights'],
            itinerary: [
              { day: 1, title: 'Day 1', description: 'Day 1 activities' },
              { day: 2, title: 'Day 2', description: 'Day 2 activities' },
              { day: 3, title: 'Day 3', description: 'Day 3 activities' }
            ],
            images: ['https://example.com/image.jpg']
          }

          // Property: Invalid group size should be rejected
          const tourWithInvalidGroupSize = { ...validTourData, maxGroupSize: data.invalidGroupSize }
          expect(() => TourValidator.validateCreateData(tourWithInvalidGroupSize))
            .toThrow(TourValidationError)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should validate inclusions and exclusions arrays', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          emptyInclusions: fc.constant([]),
          invalidInclusions: fc.array(fc.oneof(
            fc.constant(''),
            fc.constant('   ') // whitespace only
          ), { minLength: 1, maxLength: 3 }),
          invalidExclusions: fc.array(fc.oneof(
            fc.constant(''),
            fc.constant('   ') // whitespace only
          ), { minLength: 1, maxLength: 3 })
        }),
        (data) => {
          const validTourData: CreateTourData = {
            destinationId: 'valid-destination-id-123',
            title: 'Valid Tour Title',
            description: 'This is a valid tour description with enough characters',
            durationDays: 3,
            pricePerPerson: 100,
            maxGroupSize: 10,
            inclusions: ['Accommodation', 'Meals'],
            exclusions: ['Flights'],
            itinerary: [
              { day: 1, title: 'Day 1', description: 'Day 1 activities' },
              { day: 2, title: 'Day 2', description: 'Day 2 activities' },
              { day: 3, title: 'Day 3', description: 'Day 3 activities' }
            ],
            images: ['https://example.com/image.jpg']
          }

          // Property: Empty inclusions should be rejected
          const tourWithEmptyInclusions = { ...validTourData, inclusions: data.emptyInclusions }
          expect(() => TourValidator.validateCreateData(tourWithEmptyInclusions))
            .toThrow(TourValidationError)

          // Property: Invalid inclusions should be rejected
          const tourWithInvalidInclusions = { ...validTourData, inclusions: data.invalidInclusions }
          expect(() => TourValidator.validateCreateData(tourWithInvalidInclusions))
            .toThrow(TourValidationError)

          // Property: Invalid exclusions should be rejected
          const tourWithInvalidExclusions = { ...validTourData, exclusions: data.invalidExclusions }
          expect(() => TourValidator.validateCreateData(tourWithInvalidExclusions))
            .toThrow(TourValidationError)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should validate image URLs', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          invalidImages: fc.oneof(
            fc.constant([]), // empty array
            fc.array(fc.oneof(
              fc.constant('invalid-url'),
              fc.constant('http://example.com/notanimage.txt'),
              fc.constant(''),
              fc.constant('   ')
            ), { minLength: 1, maxLength: 3 })
          )
        }),
        (data) => {
          const validTourData: CreateTourData = {
            destinationId: 'valid-destination-id-123',
            title: 'Valid Tour Title',
            description: 'This is a valid tour description with enough characters',
            durationDays: 3,
            pricePerPerson: 100,
            maxGroupSize: 10,
            inclusions: ['Accommodation', 'Meals'],
            exclusions: ['Flights'],
            itinerary: [
              { day: 1, title: 'Day 1', description: 'Day 1 activities' },
              { day: 2, title: 'Day 2', description: 'Day 2 activities' },
              { day: 3, title: 'Day 3', description: 'Day 3 activities' }
            ],
            images: ['https://example.com/image.jpg']
          }

          // Property: Invalid images should be rejected
          const tourWithInvalidImages = { ...validTourData, images: data.invalidImages }
          expect(() => TourValidator.validateCreateData(tourWithInvalidImages))
            .toThrow(TourValidationError)
        }
      ),
      { numRuns: 100 }
    )
  })
})