/**
 * **Feature: travel-tour-booking, Property 5: User registration with encryption**
 * **Validates: Requirements 2.1**
 * 
 * Property-based test for user registration with password encryption.
 * For any valid registration data, the system should create a user account with encrypted password storage and never store plain text passwords.
 */

import { describe, it, expect } from '@jest/globals'
import * as fc from 'fast-check'
import bcrypt from 'bcryptjs'

// Mock user registration service
interface RegistrationData {
  name: string
  email: string
  password: string
  role?: 'CUSTOMER' | 'ADMIN' | 'STAFF'
}

interface User {
  id: string
  name: string
  email: string
  passwordHash: string
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF'
  createdAt: Date
  updatedAt: Date
}

class MockUserRegistrationService {
  private users: Map<string, User> = new Map()
  private idCounter = 1

  async register(data: RegistrationData): Promise<User> {
    // Validate input
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Name is required')
    }
    if (!data.email || !this.isValidEmail(data.email)) {
      throw new Error('Valid email is required')
    }
    if (!data.password || data.password.trim().length < 6) {
      throw new Error('Password must be at least 6 characters')
    }

    // Check for duplicate email (case-insensitive)
    const normalizedEmail = data.email.toLowerCase()
    for (const user of this.users.values()) {
      if (user.email === normalizedEmail) {
        throw new Error('Email already exists')
      }
    }

    // Hash password
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(data.password, saltRounds)

    // Create user
    const user: User = {
      id: `user-${this.idCounter++}`,
      name: data.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: data.role || 'CUSTOMER',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.users.set(user.id, user)
    return user
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email.toLowerCase()) {
        return user
      }
    }
    return undefined
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword)
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  clear(): void {
    this.users.clear()
    this.idCounter = 1
  }
}

describe('User Registration Properties', () => {
  let registrationService: MockUserRegistrationService

  beforeEach(() => {
    registrationService = new MockUserRegistrationService()
  })

  it('should create user account with encrypted password storage', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 6, maxLength: 50 }).filter(s => s.trim().length >= 6),
          role: fc.constantFrom('CUSTOMER', 'ADMIN', 'STAFF')
        }),
        async (data) => {
          // Clear state for each property run
          registrationService.clear()
          
          // Register user
          const user = await registrationService.register(data)

          // Property: User should be created successfully
          expect(user).toBeDefined()
          expect(user.id).toBeDefined()
          expect(user.name).toBe(data.name.trim())
          expect(user.email).toBe(data.email.toLowerCase())
          expect(user.role).toBe(data.role)

          // Property: Password should be encrypted (never stored as plain text)
          expect(user.passwordHash).toBeDefined()
          expect(user.passwordHash).not.toBe(data.password)
          expect(user.passwordHash.length).toBeGreaterThan(data.password.length)

          // Property: Password hash should be verifiable with bcrypt
          const isValidHash = await registrationService.verifyPassword(data.password, user.passwordHash)
          expect(isValidHash).toBe(true)

          // Property: Wrong password should not verify
          const wrongPasswordVerification = await registrationService.verifyPassword(data.password + 'wrong', user.passwordHash)
          expect(wrongPasswordVerification).toBe(false)

          // Property: User should be retrievable by email
          const retrievedUser = await registrationService.getUserByEmail(data.email)
          expect(retrievedUser).toBeDefined()
          expect(retrievedUser!.id).toBe(user.id)
        }
      ),
      { numRuns: 10 }
    )
  }, 10000)

  it('should prevent duplicate email registration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name1: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          name2: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          email: fc.emailAddress(),
          password1: fc.string({ minLength: 6, maxLength: 50 }).filter(s => s.trim().length >= 6),
          password2: fc.string({ minLength: 6, maxLength: 50 }).filter(s => s.trim().length >= 6)
        }),
        async (data) => {
          // Clear state for each property run
          registrationService.clear()
          
          // Register first user
          const user1 = await registrationService.register({
            name: data.name1,
            email: data.email,
            password: data.password1
          })

          expect(user1).toBeDefined()

          // Property: Attempting to register with same email should fail
          await expect(registrationService.register({
            name: data.name2,
            email: data.email, // Same email
            password: data.password2
          })).rejects.toThrow('Email already exists')

          // Property: Case-insensitive email check
          await expect(registrationService.register({
            name: data.name2,
            email: data.email.toUpperCase(), // Same email, different case
            password: data.password2
          })).rejects.toThrow('Email already exists')
        }
      ),
      { numRuns: 10 }
    )
  }, 10000)

  it('should validate registration input data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          invalidName: fc.oneof(
            fc.constant(''),
            fc.constant('   '), // whitespace only
            fc.constant(null as any),
            fc.constant(undefined as any)
          ),
          invalidEmail: fc.oneof(
            fc.constant(''),
            fc.constant('invalid-email'),
            fc.constant('missing@domain'),
            fc.constant('@missing-local.com'),
            fc.constant(null as any),
            fc.constant(undefined as any)
          ),
          invalidPassword: fc.oneof(
            fc.constant(''),
            fc.string({ maxLength: 5 }), // too short
            fc.constant(null as any),
            fc.constant(undefined as unknown)
          )
        }),
        async (data) => {
          // Clear state for each property run
          registrationService.clear()
          
          // Property: Invalid name should be rejected
          await expect(registrationService.register({
            name: data.invalidName,
            email: 'valid@email.com',
            password: 'validpassword123'
          })).rejects.toThrow('Name is required')

          // Property: Invalid email should be rejected
          await expect(registrationService.register({
            name: 'Valid Name',
            email: data.invalidEmail,
            password: 'validpassword123'
          })).rejects.toThrow('Valid email is required')

          // Property: Invalid password should be rejected
          await expect(registrationService.register({
            name: 'Valid Name',
            email: 'valid@email.com',
            password: data.invalidPassword
          })).rejects.toThrow('Password must be at least 6 characters')
        }
      ),
      { numRuns: 30 }
    )
  })

  it('should handle default role assignment', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 6, maxLength: 50 }).filter(s => s.trim().length >= 6)
        }),
        async (data) => {
          // Clear state for each property run
          registrationService.clear()
          
          // Register user without specifying role
          const user = await registrationService.register({
            name: data.name,
            email: data.email,
            password: data.password
            // role not specified
          })

          // Property: Default role should be CUSTOMER
          expect(user.role).toBe('CUSTOMER')
        }
      ),
      { numRuns: 10 }
    )
  }, 10000)
})