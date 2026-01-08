import { User as PrismaUser, UserRole } from '@/app/generated/prisma';

export type User = PrismaUser;

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  phone?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
}

export class UserValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserValidationError';
  }
}

export class UserValidator {
  static validateCreateData(data: CreateUserData): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new UserValidationError('Name is required');
    }

    if (data.name.trim().length < 2) {
      throw new UserValidationError('Name must be at least 2 characters long');
    }

    if (!data.email || data.email.trim().length === 0) {
      throw new UserValidationError('Email is required');
    }

    if (!this.isValidEmail(data.email)) {
      throw new UserValidationError('Invalid email format');
    }

    if (!data.password || data.password.length === 0) {
      throw new UserValidationError('Password is required');
    }

    if (data.password.length < 8) {
      throw new UserValidationError('Password must be at least 8 characters long');
    }

    if (data.phone && !this.isValidPhone(data.phone)) {
      throw new UserValidationError('Invalid phone number format');
    }

    if (data.role && !Object.values(UserRole).includes(data.role)) {
      throw new UserValidationError('Invalid user role');
    }
  }

  static validateUpdateData(data: UpdateUserData): void {
    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        throw new UserValidationError('Name cannot be empty');
      }
      if (data.name.trim().length < 2) {
        throw new UserValidationError('Name must be at least 2 characters long');
      }
    }

    if (data.email !== undefined) {
      if (!data.email || data.email.trim().length === 0) {
        throw new UserValidationError('Email cannot be empty');
      }
      if (!this.isValidEmail(data.email)) {
        throw new UserValidationError('Invalid email format');
      }
    }

    if (data.phone !== undefined && data.phone !== null && !this.isValidPhone(data.phone)) {
      throw new UserValidationError('Invalid phone number format');
    }

    if (data.role !== undefined && !Object.values(UserRole).includes(data.role)) {
      throw new UserValidationError('Invalid user role');
    }
  }

  static hasPermission(user: User, requiredRole: UserRole): boolean {
    const roleHierarchy = {
      [UserRole.CUSTOMER]: 0,
      [UserRole.STAFF]: 1,
      [UserRole.ADMIN]: 2,
    };

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  }

  static isAdmin(user: User): boolean {
    return user.role === UserRole.ADMIN;
  }

  static isStaff(user: User): boolean {
    return user.role === UserRole.STAFF || user.role === UserRole.ADMIN;
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidPhone(phone: string): boolean {
    // Basic phone validation - accepts various international formats
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }
}