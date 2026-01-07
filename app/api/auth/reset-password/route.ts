import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { PrismaClient } from '../../../generated/prisma'

const prisma = new PrismaClient()

// Add PasswordResetToken model to Prisma schema if not exists
// This is a temporary mock implementation for the password reset token storage
// In a real implementation, you would add this to your Prisma schema

interface PasswordResetToken {
  token: string
  userId: string
  email: string
  expiresAt: Date
  used: boolean
  createdAt: Date
}

// Temporary in-memory storage for reset tokens (replace with database in production)
const resetTokens = new Map<string, PasswordResetToken>()

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase()

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    // For security, always return success message regardless of whether email exists
    if (!user) {
      return NextResponse.json({
        message: 'If the email exists, a reset link has been sent'
      })
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour expiry

    const passwordResetToken: PasswordResetToken = {
      token: resetToken,
      userId: user.id,
      email: user.email,
      expiresAt,
      used: false,
      createdAt: new Date()
    }

    resetTokens.set(resetToken, passwordResetToken)

    // In a real implementation, you would send an email here
    // For now, we'll just log the reset link
    const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`
    console.log(`Password reset link for ${user.email}: ${resetLink}`)

    // TODO: Send email with reset link
    // await sendPasswordResetEmail(user.email, resetLink)

    return NextResponse.json({
      message: 'If the email exists, a reset link has been sent'
    })

  } catch (error) {
    console.error('Password reset request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json()

    // Validate input
    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.trim().length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Get reset token data
    const resetTokenData = resetTokens.get(token)
    if (!resetTokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (resetTokenData.expiresAt < new Date()) {
      resetTokens.delete(token)
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Check if token is already used
    if (resetTokenData.used) {
      return NextResponse.json(
        { error: 'Reset token has already been used' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: resetTokenData.userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Hash new password
    const bcrypt = require('bcryptjs')
    const saltRounds = 12
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      }
    })

    // Mark token as used
    resetTokenData.used = true
    resetTokens.set(token, resetTokenData)

    return NextResponse.json({
      message: 'Password has been reset successfully'
    })

  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}