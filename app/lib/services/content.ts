import { prisma } from '@/app/lib/prisma'
import { ContentType } from '@prisma/client'
import { 
  Content, 
  CreateContentData, 
  UpdateContentData, 
  ContentVersion,
  ContentValidator 
} from '@/app/lib/models/content'

export interface ContentFilters {
  type?: ContentType
  published?: boolean
  search?: string
}

export interface ContentVersionHistory {
  contentId: string
  versions: ContentVersion[]
}

export class ContentService {
  static async createContent(data: CreateContentData): Promise<Content> {
    ContentValidator.validateCreateData(data)

    const content = await prisma.content.create({
      data: {
        type: data.type,
        title: data.title.trim(),
        body: data.body.trim(),
        published: data.published ?? false
      }
    })

    // Create initial version history entry
    await this.createVersionEntry(content.id, content)

    return content
  }

  static async updateContent(id: string, data: UpdateContentData): Promise<Content> {
    ContentValidator.validateUpdateData(data)

    // Get current content for version history
    const currentContent = await prisma.content.findUnique({
      where: { id }
    })

    if (!currentContent) {
      throw new Error('Content not found')
    }

    const updatedContent = await prisma.content.update({
      where: { id },
      data: {
        ...(data.type && { type: data.type }),
        ...(data.title && { title: data.title.trim() }),
        ...(data.body && { body: data.body.trim() }),
        ...(data.published !== undefined && { published: data.published })
      }
    })

    // Create version history entry if content changed
    if (data.title || data.body || data.published !== undefined) {
      await this.createVersionEntry(id, updatedContent)
    }

    return updatedContent
  }

  static async getContent(id: string): Promise<Content | null> {
    return await prisma.content.findUnique({
      where: { id }
    })
  }

  static async getPublishedContent(id: string): Promise<Content | null> {
    return await prisma.content.findUnique({
      where: { 
        id,
        published: true
      }
    })
  }

  static async listContent(filters: ContentFilters = {}): Promise<Content[]> {
    const where: any = {}

    if (filters.type) {
      where.type = filters.type
    }

    if (filters.published !== undefined) {
      where.published = filters.published
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { body: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    return await prisma.content.findMany({
      where,
      orderBy: { updatedAt: 'desc' }
    })
  }

  static async publishContent(id: string): Promise<Content> {
    const content = await prisma.content.update({
      where: { id },
      data: { published: true }
    })

    // Create version entry for publication change
    await this.createVersionEntry(id, content)
    
    return content
  }

  static async unpublishContent(id: string): Promise<Content> {
    const content = await prisma.content.update({
      where: { id },
      data: { published: false }
    })

    // Create version entry for unpublication change
    await this.createVersionEntry(id, content)
    
    return content
  }

  static async deleteContent(id: string): Promise<void> {
    // Prisma will handle cascade deletion of versions
    await prisma.content.delete({
      where: { id }
    })
  }

  static async getContentVersionHistory(contentId: string): Promise<ContentVersion[]> {
    return await prisma.contentVersion.findMany({
      where: { contentId },
      orderBy: { version: 'desc' }
    })
  }

  private static async createVersionEntry(contentId: string, content: Content): Promise<void> {
    // Get the next version number
    const lastVersion = await prisma.contentVersion.findFirst({
      where: { contentId },
      orderBy: { version: 'desc' },
      select: { version: true }
    })
    
    const nextVersion = (lastVersion?.version || 0) + 1

    // Create version entry
    await prisma.contentVersion.create({
      data: {
        contentId,
        version: nextVersion,
        title: content.title,
        body: content.body,
        published: content.published
      }
    })
  }
}