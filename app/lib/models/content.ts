import { ContentType } from '@prisma/client'

export interface Content {
  id: string
  type: ContentType
  title: string
  body: string
  published: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateContentData {
  type: ContentType
  title: string
  body: string
  published?: boolean
}

export interface UpdateContentData {
  type?: ContentType
  title?: string
  body?: string
  published?: boolean
}

export interface ContentVersion {
  id: string
  contentId: string
  version: number
  title: string
  body: string
  published: boolean
  createdAt: Date
}

export class ContentValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ContentValidationError'
  }
}

export class ContentValidator {
  static validateCreateData(data: CreateContentData): void {
    // Validate type
    if (!data.type || !Object.values(ContentType).includes(data.type)) {
      throw new ContentValidationError('Content type is required and must be BLOG, FAQ, or PAGE', 'type')
    }

    // Validate title
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      throw new ContentValidationError('Title is required and cannot be empty', 'title')
    }

    if (data.title.trim().length < 3) {
      throw new ContentValidationError('Title must be at least 3 characters long', 'title')
    }

    if (data.title.length > 200) {
      throw new ContentValidationError('Title cannot exceed 200 characters', 'title')
    }

    // Validate body
    if (!data.body || typeof data.body !== 'string' || data.body.trim().length === 0) {
      throw new ContentValidationError('Body is required and cannot be empty', 'body')
    }

    if (data.body.trim().length < 10) {
      throw new ContentValidationError('Body must be at least 10 characters long', 'body')
    }

    if (data.body.length > 50000) {
      throw new ContentValidationError('Body cannot exceed 50,000 characters', 'body')
    }

    // Validate published flag
    if (data.published !== undefined && typeof data.published !== 'boolean') {
      throw new ContentValidationError('Published must be a boolean value', 'published')
    }
  }

  static validateUpdateData(data: UpdateContentData): void {
    // Validate type if provided
    if (data.type !== undefined && !Object.values(ContentType).includes(data.type)) {
      throw new ContentValidationError('Content type must be BLOG, FAQ, or PAGE', 'type')
    }

    // Validate title if provided
    if (data.title !== undefined) {
      if (typeof data.title !== 'string' || data.title.trim().length === 0) {
        throw new ContentValidationError('Title cannot be empty', 'title')
      }

      if (data.title.trim().length < 3) {
        throw new ContentValidationError('Title must be at least 3 characters long', 'title')
      }

      if (data.title.length > 200) {
        throw new ContentValidationError('Title cannot exceed 200 characters', 'title')
      }
    }

    // Validate body if provided
    if (data.body !== undefined) {
      if (typeof data.body !== 'string' || data.body.trim().length === 0) {
        throw new ContentValidationError('Body cannot be empty', 'body')
      }

      if (data.body.trim().length < 10) {
        throw new ContentValidationError('Body must be at least 10 characters long', 'body')
      }

      if (data.body.length > 50000) {
        throw new ContentValidationError('Body cannot exceed 50,000 characters', 'body')
      }
    }

    // Validate published flag if provided
    if (data.published !== undefined && typeof data.published !== 'boolean') {
      throw new ContentValidationError('Published must be a boolean value', 'published')
    }
  }

  static validateContentType(type: string): ContentType {
    if (!Object.values(ContentType).includes(type as ContentType)) {
      throw new ContentValidationError('Invalid content type. Must be BLOG, FAQ, or PAGE', 'type')
    }
    return type as ContentType
  }
}