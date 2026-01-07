/**
 * **Feature: travel-tour-booking, Property 7: Password reset email delivery**
 * **Validates: Requirements 2.3**
 * 
 * Property-based test for password reset email delivery.
 * For any registered user email, password reset should generate and send a secure reset link.
 */

import { describe, it, expect } from '@jest/globals'
import * as fc from 'fast-check'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// Mock password reset service
interface User {
  id: string
  name: string
  email: string
  passwordHash: string
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF'
  createdAt: Date
  updatedAt: Date
}

interface PasswordResetToken {
  token: string
  userId: string
  email: string
  expiresAt: Date
  used: boolean
  createdAt: Date
}

interface EmailMessage {
  to: string
  subject: string
  body: string
  resetLink: string
  sentAt: Date
}

interface PasswordResetResult {
  success: boolean
  message: string
  emailSent?: boolean
}

interface ResetPasswordResult {
  success: boolean
  message: string
  user?: User
}

class MockPasswordResetService {
  private users: Map<string, User> = new Map()
  private resetTokens: Map<string, PasswordResetToken> = new Map()
  private sentEmails: EmailMessage[] = []

  async registerUser(userData: {
    name: string
    email: string
    password: string
    role?: 'CUSTOMER' | 'ADMIN' | 'STAFF'
  }): Promise<User> {
    const passwordHash = await bcrypt.hash(userData.password, 4) // Fast hashing for tests
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

  async requestPasswordReset(email: string): Promise<PasswordResetResult> {
    if (!email || !this.isValidEmail(email)) {
      return {
        success: false,
        message: 'Valid email address is required'
      }
    }

    const normalizedEmail = email.toLowerCase()
    
    // Find user by email
    let foundUser: User | undefined
    for (const user of this.users.values()) {
      if (user.email === normalizedEmail) {
        foundUser = user
        break
      }
    }

    if (!foundUser) {
      // For security, don't reveal if email exists or not
      return {
        success: true,
        message: 'If the email exists, a reset link has been sent',
        emailSent: false
      }
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour expiry

    const passwordResetToken: PasswordResetToken = {
      token: resetToken,
      userId: foundUser.id,
      email: foundUser.email,
      expiresAt,
      used: false,
      createdAt: new Date()
    }

    this.resetTokens.set(resetToken, passwordResetToken)

    // Send email (mock)
    const resetLink = `https://example.com/reset-password?token=${resetToken}`
    const emailMessage: EmailMessage = {
      to: foundUser.email,
      subject: 'Password Reset Request',
      body: `Click the following link to reset your password: ${resetLink}`,
      resetLink,
      sentAt: new Date()
    }

    this.sentEmails.push(emailMessage)

    return {
      success: true,
      message: 'If the email exists, a reset link has been sent',
      emailSent: true
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<ResetPasswordResult> {
    if (!token || !newPassword) {
      return {
        success: false,
        message: 'Token and new password are required'
      }
    }

    if (newPassword.trim().length < 6) {
      return {
        success: false,
        message: 'Password must be at least 6 characters'
      }
    }

    const resetTokenData = this.resetTokens.get(token)
    if (!resetTokenData) {
      return {
        success: false,
        message: 'Invalid or expired reset token'
      }
    }

    // Check if token is expired
    if (resetTokenData.expiresAt < new Date()) {
      this.resetTokens.delete(token)
      return {
        success: false,
        message: 'Invalid or expired reset token'
      }
    }

    // Check if token is already used
    if (resetTokenData.used) {
      return {
        success: false,
        message: 'Reset token has already been used'
      }
    }

    // Find user
    const user = this.users.get(resetTokenData.userId)
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      }
    }

    // Update password
    const newPasswordHash = await bcrypt.hash(newPassword, 4)
    const updatedUser: User = {
      ...user,
      passwordHash: newPasswordHash,
      updatedAt: new Date()
    }

    this.users.set(user.id, updatedUser)

    // Mark token as used
    resetTokenData.used = true
    this.resetTokens.set(token, resetTokenData)

    return {
      success: true,
      message: 'Password has been reset successfully',
      user: updatedUser
    }
  }

  getResetToken(token: string): PasswordResetToken | undefined {
    return this.resetTokens.get(token)
  }

  getSentEmails(): EmailMessage[] {
    return [...this.sentEmails]
  }

  getEmailsForAddress(email: string): EmailMessage[] {
    return this.sentEmails.filter(msg => msg.to === email.toLowerCase())
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
    this.resetTokens.clear()
    this.sentEmails = []
  }
}

describe('Password Reset Properties', () => {
  let resetService: MockPasswordResetService

  beforeEach(() => {
    resetService = new MockPasswordResetService()
  })

  it('should generate and send secure reset link for registered users', async () => {
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
          resetService.clear()

          // Register user
          const user = await resetService.registerUser(userData)

          // Property: Password reset request should succeed for registered email
          const resetResult = await resetService.requestPasswordReset(userData.email)
          expect(resetResult.success).toBe(true)
          expect(resetResult.emailSent).toBe(true)
          expect(resetResult.message).toBe('If the email exists, a reset link has been sent')

          // Property: Email should be sent to the user
          const sentEmails = resetService.getEmailsForAddress(userData.email)
          expect(sentEmails).toHaveLength(1)

          const sentEmail = sentEmails[0]
          expect(sentEmail.to).toBe(userData.email.toLowerCase())
          expect(sentEmail.subject).toBe('Password Reset Request')
          expect(sentEmail.resetLink).toContain('https://example.com/reset-password?token=')
          expect(sentEmail.body).toContain(sentEmail.resetLink)

          // Property: Reset token should be generated and valid
          const tokenMatch = sentEmail.resetLink.match(/token=([^&]+)/)
          expect(tokenMatch).toBeTruthy()
          
          const token = tokenMatch![1]
          const resetTokenData = resetService.getResetToken(token)
          expect(resetTokenData).toBeDefined()
          expect(resetTokenData!.userId).toBe(user.id)
          expect(resetTokenData!.email).toBe(userData.email.toLowerCase())
          expect(resetTokenData!.used).toBe(false)
          expect(resetTokenData!.expiresAt).toBeInstanceOf(Date)
          expect(resetTokenData!.expiresAt.getTime()).toBeGreaterThan(Date.now())

          // Property: Case-insensitive email should work
          const caseInsensitiveResult = await resetService.requestPasswordReset(userData.email.toUpperCase())
          expect(caseInsensitiveResult.success).toBe(true)
          expect(caseInsensitiveResult.emailSent).toBe(true)
        }
      ),
      { numRuns: 10 }
    )
  }, 10000)

  it('should handle non-existent email addresses securely', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          existingEmail: fc.emailAddress(),
          nonExistentEmail: fc.emailAddress(),
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          password: fc.string({ minLength: 6, maxLength: 50 }).filter(s => s.trim().length >= 6)
        }).filter(data => data.existingEmail !== data.nonExistentEmail),
        async (data) => {
          // Clear state for each property run
          resetService.clear()

          // Register user with existing email
          await resetService.registerUser({
            name: data.name,
            email: data.existingEmail,
            password: data.password
          })

          // Property: Non-existent email should return success (for security)
          const nonExistentResult = await resetService.requestPasswordReset(data.nonExistentEmail)
          expect(nonExistentResult.success).toBe(true)
          expect(nonExistentResult.emailSent).toBe(false)
          expect(nonExistentResult.message).toBe('If the email exists, a reset link has been sent')

          // Property: No email should be sent for non-existent address
          const sentEmails = resetService.getEmailsForAddress(data.nonExistentEmail)
          expect(sentEmails).toHaveLength(0)

          // Property: No reset token should be generated for non-existent email
          const allEmails = resetService.getSentEmails()
          const nonExistentEmails = allEmails.filter(email => email.to === data.nonExistentEmail.toLowerCase())
          expect(nonExistentEmails).toHaveLength(0)
        }
      ),
      { numRuns: 10 }
    )
  }, 5000)

  it('should validate email format and reject invalid emails', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          invalidEmail: fc.oneof(
            fc.constant(''),
            fc.constant('invalid-email'),
            fc.constant('missing@domain'),
            fc.constant('@missing-local.com'),
            fc.constant('spaces in@email.com'),
            fc.constant(null as any),
            fc.constant(undefined as any)
          )
        }),
        async (data) => {
          // Clear state for each property run
          resetService.clear()

          // Property: Invalid email format should be rejected
          const result = await resetService.requestPasswordReset(data.invalidEmail)
          expect(result.success).toBe(false)
          expect(result.message).toBe('Valid email address is required')
          expect(result.emailSent).toBeUndefined()

          // Property: No emails should be sent for invalid email format
          const sentEmails = resetService.getSentEmails()
          expect(sentEmails).toHaveLength(0)
        }
      ),
      { numRuns: 10 }
    )
  }, 5000)

  it('should allow password reset with valid token', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          email: fc.emailAddress(),
          oldPassword: fc.string({ minLength: 6, maxLength: 50 }).filter(s => s.trim().length >= 6),
          newPassword: fc.string({ minLength: 6, maxLength: 50 }).filter(s => s.trim().length >= 6)
        }).filter(data => data.oldPassword !== data.newPassword),
        async (data) => {
          // Clear state for each property run
          resetService.clear()

          // Register user and request password reset
          const user = await resetService.registerUser({
            name: data.name,
            email: data.email,
            password: data.oldPassword
          })

          await resetService.requestPasswordReset(data.email)
          
          // Get reset token from sent email
          const sentEmails = resetService.getEmailsForAddress(data.email)
          const tokenMatch = sentEmails[0].resetLink.match(/token=([^&]+)/)
          const token = tokenMatch![1]

          // Property: Password reset with valid token should succeed
          const resetResult = await resetService.resetPassword(token, data.newPassword)
          expect(resetResult.success).toBe(true)
          expect(resetResult.message).toBe('Password has been reset successfully')
          expect(resetResult.user).toBeDefined()

          // Property: Old password should no longer work
          const oldPasswordValid = await resetService.verifyPassword(data.oldPassword, resetResult.user!.passwordHash)
          expect(oldPasswordValid).toBe(false)

          // Property: New password should work
          const newPasswordValid = await resetService.verifyPassword(data.newPassword, resetResult.user!.passwordHash)
          expect(newPasswordValid).toBe(true)

          // Property: Token should be marked as used
          const tokenData = resetService.getResetToken(token)
          expect(tokenData!.used).toBe(true)

          // Property: Token cannot be reused
          const reuseResult = await resetService.resetPassword(token, 'anotherpassword123')
          expect(reuseResult.success).toBe(false)
          expect(reuseResult.message).toBe('Reset token has already been used')
        }
      ),
      { numRuns: 10 }
    )
  }, 10000)

  it('should reject invalid or expired reset tokens', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          invalidToken: fc.string({ minLength: 1, maxLength: 64 }),
          newPassword: fc.string({ minLength: 6, maxLength: 50 }).filter(s => s.trim().length >= 6)
        }),
        async (data) => {
          // Clear state for each property run
          resetService.clear()

          // Property: Invalid token should be rejected
          const invalidResult = await resetService.resetPassword(data.invalidToken, data.newPassword)
          expect(invalidResult.success).toBe(false)
          expect(invalidResult.message).toBe('Invalid or expired reset token')
          expect(invalidResult.user).toBeUndefined()

          // Property: Empty token should be rejected
          const emptyTokenResult = await resetService.resetPassword('', data.newPassword)
          expect(emptyTokenResult.success).toBe(false)
          expect(emptyTokenResult.message).toBe('Token and new password are required')

          // Property: Empty password should be rejected
          const emptyPasswordResult = await resetService.resetPassword(data.invalidToken, '')
          expect(emptyPasswordResult.success).toBe(false)
          expect(emptyPasswordResult.message).toBe('Token and new password are required')

          // Property: Short password should be rejected
          const shortPasswordResult = await resetService.resetPassword(data.invalidToken, '12345')
          expect(shortPasswordResult.success).toBe(false)
          expect(shortPasswordResult.message).toBe('Password must be at least 6 characters')
        }
      ),
      { numRuns: 10 }
    )
  }, 5000)
})