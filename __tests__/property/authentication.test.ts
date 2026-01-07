/**
 * **Feature: travel-tour-booking, Property 6: Authentication success with valid credentials**
 * **Validates: Requirements 2.2, 2.5**
 * 
 * Property-based test for authentication success with valid credentials.
 * For any user with valid credentials, login should succeed and establish a secure session with appropriate role permissions.
 */

import { describe, it, expect } from '@jest/globals'
import * as fc from 'fast-check'
import bcrypt from 'bcryptjs'

// Mock authentication service
interface LoginCredentials {
  email: string
  password: string
}

interface AuthResult {
  success: boolean
  user?: User
  token?: string
  error?: string
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

interface Session {
  userId: string
  token: string
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF'
  createdAt: Date
  expiresAt: Date
}

class MockAuthenticationService {
  private users: Map<string, User> = new Map()
  private sessions: Map<string, Session> = new Map()
  private tokenCounter = 1

  async registerUser(userData: {
    name: string
    email: string
    password: string
    role?: 'CUSTOMER' | 'ADMIN' | 'STAFF'
  }): Promise<User> {
    const passwordHash = await bcrypt.hash(userData.password, 4) // Reduced salt rounds for testing
    const user: User = {
      id: `user-${this.users.size + 1}`,
      name: userData.name,
      email: userData.email.toLowerCase(),
      passwordHash,
      role: userData.role || 'CUSTOMER',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.users.set(user.id, user)
    return user
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    // Validate input
    if (!credentials.email || !credentials.password) {
      return {
        success: false,
        error: 'Email and password are required'
      }
    }

    // Find user by email (case-insensitive)
    const normalizedEmail = credentials.email.toLowerCase()
    let foundUser: User | undefined
    for (const user of this.users.values()) {
      if (user.email === normalizedEmail) {
        foundUser = user
        break
      }
    }

    if (!foundUser) {
      return {
        success: false,
        error: 'Invalid credentials'
      }
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(credentials.password, foundUser.passwordHash)
    if (!isValidPassword) {
      return {
        success: false,
        error: 'Invalid credentials'
      }
    }

    // Create session
    const token = `token-${this.tokenCounter++}`
    const session: Session = {
      userId: foundUser.id,
      token,
      role: foundUser.role,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }
    this.sessions.set(token, session)

    return {
      success: true,
      user: foundUser,
      token
    }
  }

  async verifyToken(token: string): Promise<User | null> {
    const session = this.sessions.get(token)
    if (!session) {
      return null
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      this.sessions.delete(token)
      return null
    }

    const user = this.users.get(session.userId)
    return user || null
  }

  getSessionRole(token: string): 'CUSTOMER' | 'ADMIN' | 'STAFF' | null {
    const session = this.sessions.get(token)
    if (!session || session.expiresAt < new Date()) {
      return null
    }
    return session.role
  }

  logout(token: string): boolean {
    return this.sessions.delete(token)
  }

  clear(): void {
    this.users.clear()
    this.sessions.clear()
    this.tokenCounter = 1
  }
}

describe('Authentication Properties', () => {
  let authService: MockAuthenticationService

  beforeEach(() => {
    authService = new MockAuthenticationService()
  })

  it('should authenticate users with valid credentials and establish secure session', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 6, maxLength: 50 }).filter(s => s.trim().length >= 6),
          role: fc.constantFrom('CUSTOMER', 'ADMIN', 'STAFF')
        }),
        async (userData) => {
          // Clear state for each property run
          authService.clear()

          // Register user first
          const user = await authService.registerUser(userData)

          // Property: Login with correct credentials should succeed
          const loginResult = await authService.login({
            email: userData.email,
            password: userData.password
          })

          expect(loginResult.success).toBe(true)
          expect(loginResult.user).toBeDefined()
          expect(loginResult.token).toBeDefined()
          expect(loginResult.error).toBeUndefined()

          // Property: Returned user should match registered user
          expect(loginResult.user!.id).toBe(user.id)
          expect(loginResult.user!.email).toBe(userData.email.toLowerCase())
          expect(loginResult.user!.role).toBe(userData.role)

          // Property: Token should be valid and verifiable
          const verifiedUser = await authService.verifyToken(loginResult.token!)
          expect(verifiedUser).toBeDefined()
          expect(verifiedUser!.id).toBe(user.id)

          // Property: Session should have appropriate role permissions
          const sessionRole = authService.getSessionRole(loginResult.token!)
          expect(sessionRole).toBe(userData.role)

          // Property: Case-insensitive email login should work
          const caseInsensitiveLogin = await authService.login({
            email: userData.email.toUpperCase(),
            password: userData.password
          })
          expect(caseInsensitiveLogin.success).toBe(true)
        }
      ),
      { numRuns: 10 }
    )
  }, 15000)

  it('should reject authentication with invalid credentials', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 6, maxLength: 50 }).filter(s => s.trim().length >= 6),
          wrongPassword: fc.string({ minLength: 6, maxLength: 50 }).filter(s => s.trim().length >= 6),
          wrongEmail: fc.emailAddress()
        }).filter(data => data.password !== data.wrongPassword && data.email !== data.wrongEmail),
        async (data) => {
          // Clear state for each property run
          authService.clear()

          // Register user
          await authService.registerUser({
            name: data.name,
            email: data.email,
            password: data.password
          })

          // Property: Login with wrong password should fail
          const wrongPasswordResult = await authService.login({
            email: data.email,
            password: data.wrongPassword
          })
          expect(wrongPasswordResult.success).toBe(false)
          expect(wrongPasswordResult.error).toBe('Invalid credentials')
          expect(wrongPasswordResult.user).toBeUndefined()
          expect(wrongPasswordResult.token).toBeUndefined()

          // Property: Login with wrong email should fail
          const wrongEmailResult = await authService.login({
            email: data.wrongEmail,
            password: data.password
          })
          expect(wrongEmailResult.success).toBe(false)
          expect(wrongEmailResult.error).toBe('Invalid credentials')
          expect(wrongEmailResult.user).toBeUndefined()
          expect(wrongEmailResult.token).toBeUndefined()

          // Property: Login with empty credentials should fail
          const emptyEmailResult = await authService.login({
            email: '',
            password: data.password
          })
          expect(emptyEmailResult.success).toBe(false)
          expect(emptyEmailResult.error).toBe('Email and password are required')

          const emptyPasswordResult = await authService.login({
            email: data.email,
            password: ''
          })
          expect(emptyPasswordResult.success).toBe(false)
          expect(emptyPasswordResult.error).toBe('Email and password are required')
        }
      ),
      { numRuns: 10 }
    )
  }, 10000)

  it('should handle session management correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 6, maxLength: 50 }).filter(s => s.trim().length >= 6),
          role: fc.constantFrom('CUSTOMER', 'ADMIN', 'STAFF')
        }),
        async (userData) => {
          // Clear state for each property run
          authService.clear()

          // Register and login user
          await authService.registerUser(userData)
          const loginResult = await authService.login({
            email: userData.email,
            password: userData.password
          })

          expect(loginResult.success).toBe(true)
          const token = loginResult.token!

          // Property: Valid token should verify successfully
          const verifiedUser = await authService.verifyToken(token)
          expect(verifiedUser).toBeDefined()
          expect(verifiedUser!.email).toBe(userData.email.toLowerCase())

          // Property: Session role should match user role
          const sessionRole = authService.getSessionRole(token)
          expect(sessionRole).toBe(userData.role)

          // Property: Logout should invalidate token
          const logoutSuccess = authService.logout(token)
          expect(logoutSuccess).toBe(true)

          // Property: Token should be invalid after logout
          const verifiedAfterLogout = await authService.verifyToken(token)
          expect(verifiedAfterLogout).toBeNull()

          const roleAfterLogout = authService.getSessionRole(token)
          expect(roleAfterLogout).toBeNull()
        }
      ),
      { numRuns: 10 }
    )
  }, 10000)

  it('should enforce role-based permissions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          customerName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          adminName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          customerEmail: fc.emailAddress(),
          adminEmail: fc.emailAddress(),
          password: fc.string({ minLength: 6, maxLength: 50 }).filter(s => s.trim().length >= 6)
        }).filter(data => data.customerEmail !== data.adminEmail),
        async (data) => {
          // Clear state for each property run
          authService.clear()

          // Register users with different roles
          await authService.registerUser({
            name: data.customerName,
            email: data.customerEmail,
            password: data.password,
            role: 'CUSTOMER'
          })

          await authService.registerUser({
            name: data.adminName,
            email: data.adminEmail,
            password: data.password,
            role: 'ADMIN'
          })

          // Login both users
          const customerLogin = await authService.login({
            email: data.customerEmail,
            password: data.password
          })

          const adminLogin = await authService.login({
            email: data.adminEmail,
            password: data.password
          })

          expect(customerLogin.success).toBe(true)
          expect(adminLogin.success).toBe(true)

          // Property: Customer session should have CUSTOMER role
          const customerRole = authService.getSessionRole(customerLogin.token!)
          expect(customerRole).toBe('CUSTOMER')

          // Property: Admin session should have ADMIN role
          const adminRole = authService.getSessionRole(adminLogin.token!)
          expect(adminRole).toBe('ADMIN')

          // Property: Roles should be different
          expect(customerRole).not.toBe(adminRole)
        }
      ),
      { numRuns: 5 }
    )
  }, 10000)

  it('should handle invalid token verification', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          invalidToken: fc.string({ minLength: 1, maxLength: 50 }),
          emptyToken: fc.constant('')
        }),
        async (data) => {
          // Clear state for each property run
          authService.clear()

          // Property: Invalid token should return null
          const invalidTokenResult = await authService.verifyToken(data.invalidToken)
          expect(invalidTokenResult).toBeNull()

          // Property: Empty token should return null
          const emptyTokenResult = await authService.verifyToken(data.emptyToken)
          expect(emptyTokenResult).toBeNull()

          // Property: Non-existent token should return null role
          const invalidRole = authService.getSessionRole(data.invalidToken)
          expect(invalidRole).toBeNull()
        }
      ),
      { numRuns: 5 }
    )
  }, 5000)
})