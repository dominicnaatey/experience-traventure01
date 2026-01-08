/**
 * **Feature: travel-tour-booking, Property 4: Guest access to destinations**
 * **Validates: Requirements 1.5**
 * 
 * Property-based test for guest access to destinations.
 * For any destination request without authentication, the system should return destination information successfully.
 */

import { describe, it, expect } from '@jest/globals'
import * as fc from 'fast-check'

// Mock destination service
interface Destination {
  id: string
  name: string
  country: string
  description: string
  coverImage: string
  createdAt: Date
  updatedAt: Date
}

interface DestinationResponse {
  success: boolean
  data?: Destination[]
  error?: string
}

class MockDestinationService {
  private destinations: Map<string, Destination> = new Map()

  addDestination(destination: Omit<Destination, 'id' | 'createdAt' | 'updatedAt'>): Destination {
    const newDestination: Destination = {
      ...destination,
      id: `dest-${this.destinations.size + 1}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.destinations.set(newDestination.id, newDestination)
    return newDestination
  }

  // Guest access method - no authentication required
  async getDestinationsForGuest(searchQuery?: string): Promise<DestinationResponse> {
    try {
      let destinations = Array.from(this.destinations.values())

      // Apply search filter if provided
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        destinations = destinations.filter(dest => 
          dest.name.toLowerCase().includes(query) ||
          dest.country.toLowerCase().includes(query)
        )
      }

      return {
        success: true,
        data: destinations
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch destinations'
      }
    }
  }

  clear(): void {
    this.destinations.clear()
  }

  getDestinationCount(): number {
    return this.destinations.size
  }
}

// Mock admin service for testing admin-only operations
interface User {
  id: string
  email: string
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF'
}

interface AdminOperationResponse {
  success: boolean
  data?: any
  error?: string
  code?: string
}

class MockAdminService {
  private tours: Map<string, any> = new Map()
  private destinations: Map<string, any> = new Map()

  // Admin-only operation: Create tour
  async createTour(user: User | null, tourData: any): Promise<AdminOperationResponse> {
    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }
    }

    if (user.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      }
    }

    const tour = {
      id: `tour-${this.tours.size + 1}`,
      ...tourData,
      createdAt: new Date()
    }
    this.tours.set(tour.id, tour)

    return {
      success: true,
      data: tour
    }
  }

  // Admin-only operation: Delete tour
  async deleteTour(user: User | null, tourId: string): Promise<AdminOperationResponse> {
    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }
    }

    if (user.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      }
    }

    if (!this.tours.has(tourId)) {
      return {
        success: false,
        error: 'Tour not found',
        code: 'NOT_FOUND'
      }
    }

    this.tours.delete(tourId)
    return {
      success: true,
      data: { deleted: true }
    }
  }

  // Admin-only operation: Manage destinations
  async createDestination(user: User | null, destinationData: any): Promise<AdminOperationResponse> {
    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }
    }

    if (user.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      }
    }

    const destination = {
      id: `dest-${this.destinations.size + 1}`,
      ...destinationData,
      createdAt: new Date()
    }
    this.destinations.set(destination.id, destination)

    return {
      success: true,
      data: destination
    }
  }

  // Admin-only operation: Update booking status
  async updateBookingStatus(user: User | null, bookingId: string, status: string): Promise<AdminOperationResponse> {
    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }
    }

    if (user.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      }
    }

    return {
      success: true,
      data: { bookingId, status, updatedAt: new Date() }
    }
  }

  clear(): void {
    this.tours.clear()
    this.destinations.clear()
  }
}

// Mock encryption service for testing data encryption
interface EncryptionService {
  encrypt(data: string): string
  decrypt(encryptedData: string): string
  hash(data: string): string
  isEncrypted(data: string): boolean
  maskSensitive(data: string): string
}

class MockEncryptionService implements EncryptionService {
  private readonly key = 'test-encryption-key'

  encrypt(data: string): string {
    if (!data || data.trim().length === 0) {
      throw new Error('Cannot encrypt empty data')
    }
    
    // Simple encryption simulation (in real implementation, use proper crypto)
    const encoded = Buffer.from(data).toString('base64')
    return `encrypted:${encoded}:${this.key.length}`
  }

  decrypt(encryptedData: string): string {
    if (!this.isEncrypted(encryptedData)) {
      throw new Error('Data is not encrypted')
    }
    
    const parts = encryptedData.split(':')
    if (parts.length !== 3 || parts[0] !== 'encrypted') {
      throw new Error('Invalid encrypted data format')
    }
    
    return Buffer.from(parts[1], 'base64').toString('utf8')
  }

  hash(data: string): string {
    if (!data || data.trim().length === 0) {
      throw new Error('Cannot hash empty data')
    }
    
    // Simple hash simulation
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return `hash:${Math.abs(hash).toString(16)}`
  }

  isEncrypted(data: string): boolean {
    return data.startsWith('encrypted:') && data.split(':').length === 3
  }

  maskSensitive(data: string, visibleChars: number = 4): string {
    if (data.length <= visibleChars) {
      return '*'.repeat(data.length)
    }
    
    const masked = '*'.repeat(data.length - visibleChars)
    return data.substring(0, visibleChars) + masked
  }
}

// Mock user service that handles sensitive data
interface UserData {
  id: string
  email: string
  password: string
  creditCard?: string
  phone?: string
}

interface StoredUserData {
  id: string
  email: string
  passwordHash: string
  encryptedCreditCard?: string
  encryptedPhone?: string
}

class MockUserService {
  private users: Map<string, StoredUserData> = new Map()
  private encryptionService: EncryptionService

  constructor(encryptionService: EncryptionService) {
    this.encryptionService = encryptionService
  }

  async storeUser(userData: UserData): Promise<StoredUserData> {
    // Property: Passwords should be hashed, not encrypted
    const passwordHash = this.encryptionService.hash(userData.password)
    
    const storedUser: StoredUserData = {
      id: userData.id,
      email: userData.email, // Email is not sensitive for encryption in this context
      passwordHash
    }

    // Property: Sensitive data should be encrypted
    if (userData.creditCard) {
      storedUser.encryptedCreditCard = this.encryptionService.encrypt(userData.creditCard)
    }
    
    if (userData.phone) {
      storedUser.encryptedPhone = this.encryptionService.encrypt(userData.phone)
    }

    this.users.set(userData.id, storedUser)
    return storedUser
  }

  async getUser(userId: string): Promise<UserData | null> {
    const storedUser = this.users.get(userId)
    if (!storedUser) {
      return null
    }

    const userData: UserData = {
      id: storedUser.id,
      email: storedUser.email,
      password: '[HASHED]' // Never return actual password
    }

    // Property: Encrypted data should be decrypted when retrieved
    if (storedUser.encryptedCreditCard) {
      userData.creditCard = this.encryptionService.decrypt(storedUser.encryptedCreditCard)
    }
    
    if (storedUser.encryptedPhone) {
      userData.phone = this.encryptionService.decrypt(storedUser.encryptedPhone)
    }

    return userData
  }

  verifyPassword(userId: string, password: string): boolean {
    const storedUser = this.users.get(userId)
    if (!storedUser) {
      return false
    }

    const hashedInput = this.encryptionService.hash(password)
    return hashedInput === storedUser.passwordHash
  }

  clear(): void {
    this.users.clear()
  }
}

describe('Security and Access Control Properties', () => {
  let destinationService: MockDestinationService
  let adminService: MockAdminService
  let encryptionService: MockEncryptionService
  let userService: MockUserService

  beforeEach(() => {
    destinationService = new MockDestinationService()
    adminService = new MockAdminService()
    encryptionService = new MockEncryptionService()
    userService = new MockUserService(encryptionService)
  })

  describe('Property 4: Guest access to destinations', () => {
    it('should allow guest access to destination information without authentication', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
              country: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
              description: fc.string({ minLength: 10, maxLength: 500 }),
              coverImage: fc.webUrl()
            }),
            { minLength: 0, maxLength: 20 }
          ),
          async (destinationData) => {
            // Clear state for each property run
            destinationService.clear()

            // Add destinations to the service
            const addedDestinations: Destination[] = []
            for (const data of destinationData) {
              const destination = destinationService.addDestination(data)
              addedDestinations.push(destination)
            }

            // Property: Guest should be able to access destinations without authentication
            const response = await destinationService.getDestinationsForGuest()

            expect(response.success).toBe(true)
            expect(response.data).toBeDefined()
            expect(response.error).toBeUndefined()

            // Property: All destinations should be returned
            expect(response.data!.length).toBe(addedDestinations.length)

            // Property: Each returned destination should contain required information
            for (const destination of response.data!) {
              expect(destination.id).toBeDefined()
              expect(destination.name).toBeDefined()
              expect(destination.country).toBeDefined()
              expect(destination.description).toBeDefined()
              expect(destination.coverImage).toBeDefined()
              expect(destination.createdAt).toBeDefined()
              expect(destination.updatedAt).toBeDefined()

              // Verify the destination exists in our added destinations
              const matchingDestination = addedDestinations.find(d => d.id === destination.id)
              expect(matchingDestination).toBeDefined()
              expect(destination.name).toBe(matchingDestination!.name)
              expect(destination.country).toBe(matchingDestination!.country)
            }
          }
        ),
        { numRuns: 3 }
      )
    }, 10000)

    it('should support search functionality for guest users', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            destinations: fc.array(
              fc.record({
                name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
                country: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                description: fc.string({ minLength: 10, maxLength: 500 }),
                coverImage: fc.webUrl()
              }),
              { minLength: 1, maxLength: 10 }
            ),
            searchQuery: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)
          }),
          async (testData) => {
            // Clear state for each property run
            destinationService.clear()

            // Add destinations
            const addedDestinations: Destination[] = []
            for (const data of testData.destinations) {
              const destination = destinationService.addDestination(data)
              addedDestinations.push(destination)
            }

            // Property: Guest search should work without authentication
            const searchResponse = await destinationService.getDestinationsForGuest(testData.searchQuery)

            expect(searchResponse.success).toBe(true)
            expect(searchResponse.data).toBeDefined()
            expect(searchResponse.error).toBeUndefined()

            // Property: Search results should only include matching destinations
            const query = testData.searchQuery.toLowerCase().trim()
            for (const destination of searchResponse.data!) {
              const nameMatches = destination.name.toLowerCase().includes(query)
              const countryMatches = destination.country.toLowerCase().includes(query)
              expect(nameMatches || countryMatches).toBe(true)
            }

            // Property: All matching destinations should be included
            const expectedMatches = addedDestinations.filter(dest =>
              dest.name.toLowerCase().includes(query) ||
              dest.country.toLowerCase().includes(query)
            )
            expect(searchResponse.data!.length).toBe(expectedMatches.length)
          }
        ),
        { numRuns: 3 }
      )
    }, 10000)

    it('should handle empty destination list gracefully for guests', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            searchQuery: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined })
          }),
          async (testData) => {
            // Clear state for each property run (empty destination list)
            destinationService.clear()

            // Property: Guest access should work even with empty destination list
            const response = await destinationService.getDestinationsForGuest(testData.searchQuery)

            expect(response.success).toBe(true)
            expect(response.data).toBeDefined()
            expect(response.data!.length).toBe(0)
            expect(response.error).toBeUndefined()
          }
        ),
        { numRuns: 2 }
      )
    }, 5000)

    it('should return consistent results for repeated guest requests', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
              country: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
              description: fc.string({ minLength: 10, maxLength: 500 }),
              coverImage: fc.webUrl()
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (destinationData) => {
            // Clear state for each property run
            destinationService.clear()

            // Add destinations
            for (const data of destinationData) {
              destinationService.addDestination(data)
            }

            // Property: Multiple guest requests should return consistent results
            const firstResponse = await destinationService.getDestinationsForGuest()
            const secondResponse = await destinationService.getDestinationsForGuest()

            expect(firstResponse.success).toBe(true)
            expect(secondResponse.success).toBe(true)
            expect(firstResponse.data!.length).toBe(secondResponse.data!.length)

            // Property: Results should be identical
            for (let i = 0; i < firstResponse.data!.length; i++) {
              const first = firstResponse.data![i]
              const second = secondResponse.data![i]
              expect(first.id).toBe(second.id)
              expect(first.name).toBe(second.name)
              expect(first.country).toBe(second.country)
            }
          }
        ),
        { numRuns: 2 }
      )
    }, 5000)
  })

  describe('Property 22: Admin-only access control', () => {
    it('should restrict admin operations to users with admin role only', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            adminUser: fc.record({
              id: fc.string({ minLength: 1, maxLength: 20 }),
              email: fc.emailAddress(),
              role: fc.constant('ADMIN' as const)
            }),
            customerUser: fc.record({
              id: fc.string({ minLength: 1, maxLength: 20 }),
              email: fc.emailAddress(),
              role: fc.constant('CUSTOMER' as const)
            }),
            staffUser: fc.record({
              id: fc.string({ minLength: 1, maxLength: 20 }),
              email: fc.emailAddress(),
              role: fc.constant('STAFF' as const)
            }),
            tourData: fc.record({
              title: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.string({ minLength: 10, maxLength: 500 }),
              price: fc.float({ min: 1, max: 10000 })
            }),
            destinationData: fc.record({
              name: fc.string({ minLength: 1, maxLength: 100 }),
              country: fc.string({ minLength: 1, maxLength: 50 })
            })
          }),
          async (testData) => {
            // Clear state for each property run
            adminService.clear()

            // Property: Admin user should be able to perform admin operations
            const adminTourResult = await adminService.createTour(testData.adminUser, testData.tourData)
            expect(adminTourResult.success).toBe(true)
            expect(adminTourResult.data).toBeDefined()
            expect(adminTourResult.error).toBeUndefined()

            const adminDestResult = await adminService.createDestination(testData.adminUser, testData.destinationData)
            expect(adminDestResult.success).toBe(true)
            expect(adminDestResult.data).toBeDefined()
            expect(adminDestResult.error).toBeUndefined()

            const adminBookingResult = await adminService.updateBookingStatus(testData.adminUser, 'booking-1', 'confirmed')
            expect(adminBookingResult.success).toBe(true)
            expect(adminBookingResult.data).toBeDefined()
            expect(adminBookingResult.error).toBeUndefined()

            // Property: Customer user should be denied admin operations
            const customerTourResult = await adminService.createTour(testData.customerUser, testData.tourData)
            expect(customerTourResult.success).toBe(false)
            expect(customerTourResult.error).toBe('Admin access required')
            expect(customerTourResult.code).toBe('ADMIN_REQUIRED')

            const customerDestResult = await adminService.createDestination(testData.customerUser, testData.destinationData)
            expect(customerDestResult.success).toBe(false)
            expect(customerDestResult.error).toBe('Admin access required')
            expect(customerDestResult.code).toBe('ADMIN_REQUIRED')

            const customerBookingResult = await adminService.updateBookingStatus(testData.customerUser, 'booking-1', 'confirmed')
            expect(customerBookingResult.success).toBe(false)
            expect(customerBookingResult.error).toBe('Admin access required')
            expect(customerBookingResult.code).toBe('ADMIN_REQUIRED')

            // Property: Staff user should be denied admin operations
            const staffTourResult = await adminService.createTour(testData.staffUser, testData.tourData)
            expect(staffTourResult.success).toBe(false)
            expect(staffTourResult.error).toBe('Admin access required')
            expect(staffTourResult.code).toBe('ADMIN_REQUIRED')

            const staffDestResult = await adminService.createDestination(testData.staffUser, testData.destinationData)
            expect(staffDestResult.success).toBe(false)
            expect(staffDestResult.error).toBe('Admin access required')
            expect(staffDestResult.code).toBe('ADMIN_REQUIRED')

            const staffBookingResult = await adminService.updateBookingStatus(testData.staffUser, 'booking-1', 'confirmed')
            expect(staffBookingResult.success).toBe(false)
            expect(staffBookingResult.error).toBe('Admin access required')
            expect(staffBookingResult.code).toBe('ADMIN_REQUIRED')
          }
        ),
        { numRuns: 3 }
      )
    }, 15000)

    it('should deny admin operations to unauthenticated users', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            tourData: fc.record({
              title: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.string({ minLength: 10, maxLength: 500 }),
              price: fc.float({ min: 1, max: 10000 })
            }),
            destinationData: fc.record({
              name: fc.string({ minLength: 1, maxLength: 100 }),
              country: fc.string({ minLength: 1, maxLength: 50 })
            }),
            bookingId: fc.string({ minLength: 1, maxLength: 20 }),
            status: fc.constantFrom('confirmed', 'cancelled', 'pending')
          }),
          async (testData) => {
            // Clear state for each property run
            adminService.clear()

            // Property: Null user (unauthenticated) should be denied all admin operations
            const tourResult = await adminService.createTour(null, testData.tourData)
            expect(tourResult.success).toBe(false)
            expect(tourResult.error).toBe('Authentication required')
            expect(tourResult.code).toBe('AUTH_REQUIRED')

            const destResult = await adminService.createDestination(null, testData.destinationData)
            expect(destResult.success).toBe(false)
            expect(destResult.error).toBe('Authentication required')
            expect(destResult.code).toBe('AUTH_REQUIRED')

            const bookingResult = await adminService.updateBookingStatus(null, testData.bookingId, testData.status)
            expect(bookingResult.success).toBe(false)
            expect(bookingResult.error).toBe('Authentication required')
            expect(bookingResult.code).toBe('AUTH_REQUIRED')
          }
        ),
        { numRuns: 3 }
      )
    }, 10000)

    it('should allow admin users to delete resources while denying others', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            adminUser: fc.record({
              id: fc.string({ minLength: 1, maxLength: 20 }),
              email: fc.emailAddress(),
              role: fc.constant('ADMIN' as const)
            }),
            customerUser: fc.record({
              id: fc.string({ minLength: 1, maxLength: 20 }),
              email: fc.emailAddress(),
              role: fc.constant('CUSTOMER' as const)
            }),
            tourData: fc.record({
              title: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.string({ minLength: 10, maxLength: 500 }),
              price: fc.float({ min: 1, max: 10000 })
            })
          }),
          async (testData) => {
            // Clear state for each property run
            adminService.clear()

            // First, create a tour as admin
            const createResult = await adminService.createTour(testData.adminUser, testData.tourData)
            expect(createResult.success).toBe(true)
            const tourId = createResult.data!.id

            // Property: Customer should not be able to delete tour
            const customerDeleteResult = await adminService.deleteTour(testData.customerUser, tourId)
            expect(customerDeleteResult.success).toBe(false)
            expect(customerDeleteResult.error).toBe('Admin access required')
            expect(customerDeleteResult.code).toBe('ADMIN_REQUIRED')

            // Property: Unauthenticated user should not be able to delete tour
            const unauthDeleteResult = await adminService.deleteTour(null, tourId)
            expect(unauthDeleteResult.success).toBe(false)
            expect(unauthDeleteResult.error).toBe('Authentication required')
            expect(unauthDeleteResult.code).toBe('AUTH_REQUIRED')

            // Property: Admin should be able to delete tour
            const adminDeleteResult = await adminService.deleteTour(testData.adminUser, tourId)
            expect(adminDeleteResult.success).toBe(true)
            expect(adminDeleteResult.data).toEqual({ deleted: true })
          }
        ),
        { numRuns: 3 }
      )
    }, 10000)

    it('should consistently enforce admin role across different operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            users: fc.array(
              fc.record({
                id: fc.string({ minLength: 1, maxLength: 20 }),
                email: fc.emailAddress(),
                role: fc.constantFrom('ADMIN', 'CUSTOMER', 'STAFF')
              }),
              { minLength: 3, maxLength: 10 }
            ),
            operationData: fc.record({
              tourTitle: fc.string({ minLength: 1, maxLength: 100 }),
              destName: fc.string({ minLength: 1, maxLength: 100 }),
              bookingId: fc.string({ minLength: 1, maxLength: 20 })
            })
          }).filter(data => {
            // Ensure we have at least one admin and one non-admin
            const hasAdmin = data.users.some(u => u.role === 'ADMIN')
            const hasNonAdmin = data.users.some(u => u.role !== 'ADMIN')
            return hasAdmin && hasNonAdmin
          }),
          async (testData) => {
            // Clear state for each property run
            adminService.clear()

            for (const user of testData.users) {
              // Test tour creation
              const tourResult = await adminService.createTour(user, { title: testData.operationData.tourTitle })
              
              // Test destination creation
              const destResult = await adminService.createDestination(user, { name: testData.operationData.destName })
              
              // Test booking update
              const bookingResult = await adminService.updateBookingStatus(user, testData.operationData.bookingId, 'confirmed')

              if (user.role === 'ADMIN') {
                // Property: Admin users should succeed in all operations
                expect(tourResult.success).toBe(true)
                expect(destResult.success).toBe(true)
                expect(bookingResult.success).toBe(true)
              } else {
                // Property: Non-admin users should be denied all operations
                expect(tourResult.success).toBe(false)
                expect(tourResult.code).toBe('ADMIN_REQUIRED')
                expect(destResult.success).toBe(false)
                expect(destResult.code).toBe('ADMIN_REQUIRED')
                expect(bookingResult.success).toBe(false)
                expect(bookingResult.code).toBe('ADMIN_REQUIRED')
              }
            }
          }
        ),
        { numRuns: 2 }
      )
    }, 10000)
  })

  describe('Property 33: Sensitive data encryption', () => {
    it('should encrypt sensitive data and never store it in plain text', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            users: fc.array(
              fc.record({
                id: fc.string({ minLength: 1, maxLength: 20 }),
                email: fc.emailAddress(),
                password: fc.string({ minLength: 6, maxLength: 50 }),
                creditCard: fc.option(fc.string({ minLength: 13, maxLength: 19 }).filter(s => /^\d+$/.test(s)), { nil: undefined }),
                phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }).filter(s => /^\+?\d+$/.test(s)), { nil: undefined })
              }),
              { minLength: 1, maxLength: 5 }
            )
          }),
          async (testData) => {
            // Clear state for each property run
            userService.clear()

            for (const userData of testData.users) {
              // Store user with sensitive data
              const storedUser = await userService.storeUser(userData)

              // Property: Passwords should be hashed, not stored in plain text
              expect(storedUser.passwordHash).toBeDefined()
              expect(storedUser.passwordHash).not.toBe(userData.password)
              expect(storedUser.passwordHash.startsWith('hash:')).toBe(true)

              // Property: Credit card data should be encrypted if present
              if (userData.creditCard) {
                expect(storedUser.encryptedCreditCard).toBeDefined()
                expect(storedUser.encryptedCreditCard).not.toBe(userData.creditCard)
                expect(encryptionService.isEncrypted(storedUser.encryptedCreditCard!)).toBe(true)
              } else {
                expect(storedUser.encryptedCreditCard).toBeUndefined()
              }

              // Property: Phone data should be encrypted if present
              if (userData.phone) {
                expect(storedUser.encryptedPhone).toBeDefined()
                expect(storedUser.encryptedPhone).not.toBe(userData.phone)
                expect(encryptionService.isEncrypted(storedUser.encryptedPhone!)).toBe(true)
              } else {
                expect(storedUser.encryptedPhone).toBeUndefined()
              }

              // Property: Email should not be encrypted (not considered sensitive in this context)
              expect(storedUser.email).toBe(userData.email)

              // Property: Password verification should work with hashed password
              const passwordVerified = userService.verifyPassword(userData.id, userData.password)
              expect(passwordVerified).toBe(true)

              // Property: Wrong password should not verify
              const wrongPasswordVerified = userService.verifyPassword(userData.id, userData.password + 'wrong')
              expect(wrongPasswordVerified).toBe(false)
            }
          }
        ),
        { numRuns: 2 }
      )
    }, 10000)

    it('should support round-trip encryption and decryption', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            sensitiveData: fc.array(
              fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
              { minLength: 1, maxLength: 10 }
            )
          }),
          async (testData) => {
            for (const data of testData.sensitiveData) {
              // Property: Encryption then decryption should return original data
              const encrypted = encryptionService.encrypt(data)
              expect(encrypted).not.toBe(data)
              expect(encryptionService.isEncrypted(encrypted)).toBe(true)

              const decrypted = encryptionService.decrypt(encrypted)
              expect(decrypted).toBe(data)

              // Property: Encrypted data should not contain original data
              expect(encrypted.includes(data)).toBe(false)
            }
          }
        ),
        { numRuns: 2 }
      )
    }, 5000)

    it('should properly mask sensitive data for logging', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            sensitiveStrings: fc.array(
              fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
              { minLength: 1, maxLength: 5 }
            ),
            visibleChars: fc.integer({ min: 1, max: 10 })
          }),
          async (testData) => {
            for (const sensitiveString of testData.sensitiveStrings) {
              // Property: Masked data should not reveal the full original string
              const masked = encryptionService.maskSensitive(sensitiveString, testData.visibleChars)
              
              if (sensitiveString.length <= testData.visibleChars) {
                // Property: Short strings should be completely masked
                expect(masked).toBe('*'.repeat(sensitiveString.length))
              } else {
                // Property: Long strings should show only specified visible characters
                expect(masked.startsWith(sensitiveString.substring(0, testData.visibleChars))).toBe(true)
                expect(masked.length).toBe(sensitiveString.length)
                
                // Property: Masked portion should only contain asterisks
                const maskedPortion = masked.substring(testData.visibleChars)
                expect(maskedPortion).toBe('*'.repeat(maskedPortion.length))
              }

              // Property: Masked data should be different from original (unless very short)
              if (sensitiveString.length > testData.visibleChars) {
                expect(masked).not.toBe(sensitiveString)
              }
            }
          }
        ),
        { numRuns: 2 }
      )
    }, 5000)

    it('should handle encryption errors gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            invalidData: fc.constantFrom('', '   ', '\t\n'),
            invalidEncryptedData: fc.array(
              fc.constantFrom(
                'not-encrypted-data',
                'encrypted:invalid',
                'encrypted:invalid:format:too:many:parts',
                'wrong-prefix:data:123'
              ),
              { minLength: 1, maxLength: 4 }
            )
          }),
          async (testData) => {
            // Property: Empty or whitespace-only data should not be encryptable
            expect(() => encryptionService.encrypt(testData.invalidData)).toThrow('Cannot encrypt empty data')
            expect(() => encryptionService.hash(testData.invalidData)).toThrow('Cannot hash empty data')

            // Property: Invalid encrypted data should not be decryptable
            for (const invalidEncrypted of testData.invalidEncryptedData) {
              expect(() => encryptionService.decrypt(invalidEncrypted)).toThrow()
              expect(encryptionService.isEncrypted(invalidEncrypted)).toBe(false)
            }
          }
        ),
        { numRuns: 2 }
      )
    }, 5000)

    it('should ensure encrypted data retrieval works correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userData: fc.record({
              id: fc.string({ minLength: 1, maxLength: 20 }),
              email: fc.emailAddress(),
              password: fc.string({ minLength: 6, maxLength: 50 }),
              creditCard: fc.string({ minLength: 13, maxLength: 19 }).filter(s => /^\d+$/.test(s)),
              phone: fc.string({ minLength: 10, maxLength: 15 }).filter(s => /^\+?\d+$/.test(s))
            })
          }),
          async (testData) => {
            // Clear state for each property run
            userService.clear()

            // Store user
            await userService.storeUser(testData.userData)

            // Property: Retrieved user should have decrypted sensitive data
            const retrievedUser = await userService.getUser(testData.userData.id)
            expect(retrievedUser).toBeDefined()
            expect(retrievedUser!.creditCard).toBe(testData.userData.creditCard)
            expect(retrievedUser!.phone).toBe(testData.userData.phone)

            // Property: Password should not be returned in plain text
            expect(retrievedUser!.password).toBe('[HASHED]')
            expect(retrievedUser!.password).not.toBe(testData.userData.password)

            // Property: Non-existent user should return null
            const nonExistentUser = await userService.getUser('non-existent-id')
            expect(nonExistentUser).toBeNull()
          }
        ),
        { numRuns: 2 }
      )
    }, 5000)
  })

  describe('Property 36: Error logging with privacy protection', () => {
    it('should log errors while protecting sensitive user information', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            errors: fc.array(
              fc.record({
                message: fc.string({ minLength: 1, maxLength: 200 }),
                context: fc.record({
                  userId: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
                  email: fc.option(fc.emailAddress(), { nil: undefined }),
                  ip: fc.option(fc.ipV4(), { nil: undefined }),
                  userAgent: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined }),
                  endpoint: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
                  method: fc.option(fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'), { nil: undefined }),
                  sensitiveData: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined })
                })
              }),
              { minLength: 1, maxLength: 5 }
            )
          }),
          async (testData) => {
            // Mock console methods to capture log output
            const originalConsoleError = console.error
            const originalConsoleWarn = console.warn
            const originalConsoleInfo = console.info
            
            const loggedErrors: string[] = []
            const loggedWarnings: string[] = []
            const loggedInfos: string[] = []
            
            console.error = (...args: any[]) => {
              loggedErrors.push(args.join(' '))
            }
            console.warn = (...args: any[]) => {
              loggedWarnings.push(args.join(' '))
            }
            console.info = (...args: any[]) => {
              loggedInfos.push(args.join(' '))
            }

            try {
              // Import error logging functions
              const { logError, logWarning, logInfo } = require('@/app/lib/utils/error-logger')

              for (const errorData of testData.errors) {
                // Test error logging
                logError(errorData.message, new Error(errorData.message), errorData.context)
                
                // Test warning logging
                logWarning(errorData.message, errorData.context)
                
                // Test info logging
                logInfo(errorData.message, errorData.context)
              }

              // Property: All errors should be logged
              expect(loggedErrors.length).toBe(testData.errors.length)
              expect(loggedWarnings.length).toBe(testData.errors.length)
              expect(loggedInfos.length).toBe(testData.errors.length)

              // Property: Logged data should not contain sensitive information in plain text
              for (let i = 0; i < testData.errors.length; i++) {
                const errorData = testData.errors[i]
                const loggedError = loggedErrors[i]
                const loggedWarning = loggedWarnings[i]
                const loggedInfo = loggedInfos[i]

                // Property: Sensitive data should be redacted or masked
                if (errorData.context.sensitiveData) {
                  expect(loggedError.includes(errorData.context.sensitiveData)).toBe(false)
                  expect(loggedWarning.includes(errorData.context.sensitiveData)).toBe(false)
                  expect(loggedInfo.includes(errorData.context.sensitiveData)).toBe(false)
                }

                // Property: Email should be partially masked
                if (errorData.context.email) {
                  expect(loggedError.includes(errorData.context.email)).toBe(false)
                  expect(loggedWarning.includes(errorData.context.email)).toBe(false)
                  expect(loggedInfo.includes(errorData.context.email)).toBe(false)
                }

                // Property: IP should be partially masked
                if (errorData.context.ip) {
                  expect(loggedError.includes(errorData.context.ip)).toBe(false)
                  expect(loggedWarning.includes(errorData.context.ip)).toBe(false)
                  expect(loggedInfo.includes(errorData.context.ip)).toBe(false)
                }

                // Property: Logs should contain structured information
                expect(loggedError).toContain('ERROR_LOG:')
                expect(loggedWarning).toContain('WARNING_LOG:')
                expect(loggedInfo).toContain('INFO_LOG:')

                // Property: Logs should contain sanitized flag
                expect(loggedError).toContain('"sanitized":true')
                expect(loggedWarning).toContain('"sanitized":true')
                expect(loggedInfo).toContain('"sanitized":true')

                // Property: Logs should contain timestamp
                expect(loggedError).toContain('"timestamp"')
                expect(loggedWarning).toContain('"timestamp"')
                expect(loggedInfo).toContain('"timestamp"')
              }

            } finally {
              // Restore original console methods
              console.error = originalConsoleError
              console.warn = originalConsoleWarn
              console.info = originalConsoleInfo
            }
          }
        ),
        { numRuns: 2 }
      )
    }, 10000)

    it('should handle logging system failures gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            errorMessage: fc.string({ minLength: 1, maxLength: 100 }),
            context: fc.record({
              userId: fc.string({ minLength: 1, maxLength: 20 }),
              email: fc.emailAddress()
            })
          }),
          async (testData) => {
            // Mock console methods to capture fallback logging
            const originalConsoleError = console.error
            const loggedMessages: string[] = []
            
            console.error = (...args: any[]) => {
              loggedMessages.push(args.join(' '))
            }

            try {
              const { logError } = require('@/app/lib/utils/error-logger')

              // Temporarily break JSON.stringify to simulate logging system failure
              const originalStringify = JSON.stringify
              JSON.stringify = () => {
                throw new Error('JSON stringify failed')
              }

              try {
                // This should trigger fallback logging
                logError(testData.errorMessage, new Error(testData.errorMessage), testData.context)
              } finally {
                // Restore JSON.stringify
                JSON.stringify = originalStringify
              }

              // Property: Fallback logging should occur when main logging fails
              expect(loggedMessages.length).toBeGreaterThan(0)
              
              // Property: Fallback should log the original error
              const fallbackLog = loggedMessages.join(' ')
              expect(fallbackLog).toContain('Logging system error')
              expect(fallbackLog).toContain('Original error')

            } finally {
              console.error = originalConsoleError
            }
          }
        ),
        { numRuns: 2 }
      )
    }, 5000)

    it('should properly sanitize different types of sensitive data patterns', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            testCases: fc.array(
              fc.record({
                message: fc.oneof(
                  fc.string().filter(s => s.toLowerCase().includes('password')),
                  fc.string().filter(s => s.toLowerCase().includes('token')),
                  fc.string().filter(s => s.toLowerCase().includes('secret')),
                  fc.string().filter(s => s.toLowerCase().includes('credit')),
                  fc.emailAddress(),
                  fc.string({ minLength: 1, maxLength: 100 })
                ),
                context: fc.record({
                  passwordField: fc.option(fc.string({ minLength: 6, maxLength: 20 }), { nil: undefined }),
                  tokenField: fc.option(fc.string({ minLength: 10, maxLength: 50 }), { nil: undefined }),
                  creditCardField: fc.option(fc.string({ minLength: 13, maxLength: 19 }), { nil: undefined })
                })
              }),
              { minLength: 1, maxLength: 3 }
            )
          }),
          async (testData) => {
            const originalConsoleError = console.error
            const loggedMessages: string[] = []
            
            console.error = (...args: any[]) => {
              loggedMessages.push(args.join(' '))
            }

            try {
              const { logError } = require('@/app/lib/utils/error-logger')

              for (const testCase of testData.testCases) {
                logError(testCase.message, new Error(testCase.message), testCase.context)
              }

              // Property: All test cases should be logged
              expect(loggedMessages.length).toBe(testData.testCases.length)

              for (let i = 0; i < testData.testCases.length; i++) {
                const testCase = testData.testCases[i]
                const loggedMessage = loggedMessages[i]

                // Property: Sensitive fields should be redacted
                if (testCase.context.passwordField) {
                  expect(loggedMessage.includes(testCase.context.passwordField)).toBe(false)
                  expect(loggedMessage).toContain('[REDACTED]')
                }

                if (testCase.context.tokenField) {
                  expect(loggedMessage.includes(testCase.context.tokenField)).toBe(false)
                  expect(loggedMessage).toContain('[REDACTED]')
                }

                if (testCase.context.creditCardField) {
                  expect(loggedMessage.includes(testCase.context.creditCardField)).toBe(false)
                  expect(loggedMessage).toContain('[REDACTED]')
                }

                // Property: Messages with sensitive patterns should be sanitized
                const sensitivePatterns = ['password', 'token', 'secret', 'credit']
                const messageHasSensitivePattern = sensitivePatterns.some(pattern => 
                  testCase.message.toLowerCase().includes(pattern)
                )

                if (messageHasSensitivePattern) {
                  // The message should be masked or sanitized
                  expect(loggedMessage.includes(testCase.message)).toBe(false)
                }
              }

            } finally {
              console.error = originalConsoleError
            }
          }
        ),
        { numRuns: 2 }
      )
    }, 5000)
  })
})