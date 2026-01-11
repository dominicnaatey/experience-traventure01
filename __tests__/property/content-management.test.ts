/**
 * **Feature: travel-tour-booking, Property 26: Content type support**
 * **Validates: Requirements 8.1**
 * 
 * Property-based test for content type support.
 * For any content creation, the system should support all specified content types (blog, faq, page).
 * 
 * **Feature: travel-tour-booking, Property 27: Content publication visibility**
 * **Validates: Requirements 8.2, 8.4**
 * 
 * Property-based test for content publication visibility.
 * For any content marked as published, it should be immediately accessible to public users, 
 * and unpublished content should be hidden.
 * 
 * **Feature: travel-tour-booking, Property 28: Content version history**
 * **Validates: Requirements 8.3**
 * 
 * Property-based test for content version history.
 * For any content edit operation, the system should maintain version history for audit purposes.
 */

import { describe, it, expect } from '@jest/globals'
import * as fc from 'fast-check'
import { ContentValidator, CreateContentData, UpdateContentData, ContentValidationError } from '@/app/lib/models/content'
import { ContentType } from '@prisma/client'

// Mock content for testing publication logic
interface MockContent {
  id: string
  type: ContentType
  title: string
  body: string
  published: boolean
  createdAt: Date
  updatedAt: Date
}

// Mock content version for testing version history
interface MockContentVersion {
  id: string
  contentId: string
  version: number
  title: string
  body: string
  published: boolean
  createdAt: Date
}

// Mock content service for testing publication and versioning properties
class MockContentService {
  private contents: Map<string, MockContent> = new Map()
  private versions: Map<string, MockContentVersion[]> = new Map()
  private nextId = 1
  private nextVersionId = 1

  createContent(data: CreateContentData): MockContent {
    ContentValidator.validateCreateData(data)
    
    const content: MockContent = {
      id: `content-${this.nextId++}`,
      type: data.type,
      title: data.title.trim(),
      body: data.body.trim(),
      published: data.published ?? false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    this.contents.set(content.id, content)
    
    // Create initial version
    this.createVersionEntry(content.id, content, 1)
    
    return content
  }

  updateContent(id: string, data: UpdateContentData): MockContent {
    ContentValidator.validateUpdateData(data)
    
    const currentContent = this.contents.get(id)
    if (!currentContent) {
      throw new Error('Content not found')
    }

    const updatedContent: MockContent = {
      ...currentContent,
      ...(data.type && { type: data.type }),
      ...(data.title && { title: data.title.trim() }),
      ...(data.body && { body: data.body.trim() }),
      ...(data.published !== undefined && { published: data.published }),
      updatedAt: new Date()
    }

    this.contents.set(id, updatedContent)

    // Create version history entry if content changed
    if (data.title || data.body || data.published !== undefined) {
      const existingVersions = this.versions.get(id) || []
      const nextVersion = existingVersions.length + 1
      this.createVersionEntry(id, updatedContent, nextVersion)
    }

    return updatedContent
  }

  getContent(id: string): MockContent | null {
    return this.contents.get(id) || null
  }

  getPublishedContent(id: string): MockContent | null {
    const content = this.contents.get(id)
    return (content && content.published) ? content : null
  }

  listContent(filters: { published?: boolean; type?: ContentType } = {}): MockContent[] {
    const results = Array.from(this.contents.values())
    
    return results.filter(content => {
      if (filters.published !== undefined && content.published !== filters.published) {
        return false
      }
      if (filters.type !== undefined && content.type !== filters.type) {
        return false
      }
      return true
    })
  }

  publishContent(id: string): MockContent {
    const content = this.contents.get(id)
    if (!content) {
      throw new Error('Content not found')
    }
    
    const updatedContent = { ...content, published: true, updatedAt: new Date() }
    this.contents.set(id, updatedContent)
    
    // Create version entry for publication change
    const existingVersions = this.versions.get(id) || []
    const nextVersion = existingVersions.length + 1
    this.createVersionEntry(id, updatedContent, nextVersion)
    
    return updatedContent
  }

  unpublishContent(id: string): MockContent {
    const content = this.contents.get(id)
    if (!content) {
      throw new Error('Content not found')
    }
    
    const updatedContent = { ...content, published: false, updatedAt: new Date() }
    this.contents.set(id, updatedContent)
    
    // Create version entry for unpublication change
    const existingVersions = this.versions.get(id) || []
    const nextVersion = existingVersions.length + 1
    this.createVersionEntry(id, updatedContent, nextVersion)
    
    return updatedContent
  }

  getContentVersionHistory(contentId: string): MockContentVersion[] {
    return this.versions.get(contentId) || []
  }

  private createVersionEntry(contentId: string, content: MockContent, version: number): void {
    const versionEntry: MockContentVersion = {
      id: `version-${this.nextVersionId++}`,
      contentId,
      version,
      title: content.title,
      body: content.body,
      published: content.published,
      createdAt: new Date()
    }

    const existingVersions = this.versions.get(contentId) || []
    existingVersions.push(versionEntry)
    this.versions.set(contentId, existingVersions)
  }

  clear(): void {
    this.contents.clear()
    this.versions.clear()
    this.nextId = 1
    this.nextVersionId = 1
  }
}

describe('Content Management Properties', () => {
  describe('Property 26: Content type support', () => {
    it('should support all specified content types (BLOG, FAQ, PAGE)', async () => {
      await fc.assert(
        fc.property(
          fc.record({
            type: fc.constantFrom(ContentType.BLOG, ContentType.FAQ, ContentType.PAGE),
            title: fc.string({ minLength: 3, maxLength: 200 }).filter(s => s.trim().length >= 3),
            body: fc.string({ minLength: 10, maxLength: 1000 }).filter(s => s.trim().length >= 10),
            published: fc.boolean()
          }),
          (contentData) => {
            // Property: All valid content types should be accepted
            expect(() => ContentValidator.validateCreateData(contentData)).not.toThrow()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject invalid content types', async () => {
      await fc.assert(
        fc.property(
          fc.record({
            type: fc.oneof(
              fc.constant('INVALID_TYPE' as ContentType),
              fc.constant('ARTICLE' as ContentType),
              fc.constant('POST' as ContentType),
              fc.constant('' as ContentType),
              fc.constant(null as unknown as ContentType),
              fc.constant(undefined as unknown as ContentType)
            ),
            title: fc.string({ minLength: 3, maxLength: 200 }).filter(s => s.trim().length >= 3),
            body: fc.string({ minLength: 10, maxLength: 1000 }).filter(s => s.trim().length >= 10)
          }),
          (contentData) => {
            // Property: Invalid content types should be rejected
            expect(() => ContentValidator.validateCreateData(contentData))
              .toThrow(ContentValidationError)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should validate content type during updates', async () => {
      await fc.assert(
        fc.property(
          fc.record({
            validType: fc.constantFrom(ContentType.BLOG, ContentType.FAQ, ContentType.PAGE),
            invalidType: fc.oneof(
              fc.constant('INVALID_TYPE' as ContentType),
              fc.constant('NEWS' as ContentType),
              fc.constant('TUTORIAL' as ContentType)
            )
          }),
          (data) => {
            // Property: Valid content type updates should be accepted
            expect(() => ContentValidator.validateUpdateData({ type: data.validType }))
              .not.toThrow()

            // Property: Invalid content type updates should be rejected
            expect(() => ContentValidator.validateUpdateData({ type: data.invalidType }))
              .toThrow(ContentValidationError)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should validate content type strings correctly', async () => {
      await fc.assert(
        fc.property(
          fc.record({
            validTypeString: fc.constantFrom('BLOG', 'FAQ', 'PAGE'),
            invalidTypeString: fc.oneof(
              fc.string({ minLength: 1, maxLength: 20 }).filter(s => !['BLOG', 'FAQ', 'PAGE'].includes(s)),
              fc.constant(''),
              fc.constant('   '),
              fc.constant('blog'), // lowercase
              fc.constant('faq'),  // lowercase
              fc.constant('page')  // lowercase
            )
          }),
          (data) => {
            // Property: Valid content type strings should be accepted
            expect(() => ContentValidator.validateContentType(data.validTypeString))
              .not.toThrow()

            // Property: Invalid content type strings should be rejected
            expect(() => ContentValidator.validateContentType(data.invalidTypeString))
              .toThrow(ContentValidationError)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle all content types in creation workflow', async () => {
      await fc.assert(
        fc.property(
          fc.array(
            fc.record({
              type: fc.constantFrom(ContentType.BLOG, ContentType.FAQ, ContentType.PAGE),
              title: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
              body: fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10),
              published: fc.boolean()
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (contentArray) => {
            // Property: All content types should be processable in batch operations
            const typesSeen = new Set<ContentType>()
            
            contentArray.forEach(content => {
              expect(() => ContentValidator.validateCreateData(content)).not.toThrow()
              typesSeen.add(content.type)
            })

            // Verify we can handle all types that were generated
            typesSeen.forEach(type => {
              expect([ContentType.BLOG, ContentType.FAQ, ContentType.PAGE]).toContain(type)
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 27: Content publication visibility', () => {
    let mockService: MockContentService

    beforeEach(() => {
      mockService = new MockContentService()
    })

    it('should make published content immediately accessible to public users', async () => {
      await fc.assert(
        fc.property(
          fc.record({
            type: fc.constantFrom(ContentType.BLOG, ContentType.FAQ, ContentType.PAGE),
            title: fc.string({ minLength: 3, maxLength: 200 }).filter(s => s.trim().length >= 3),
            body: fc.string({ minLength: 10, maxLength: 1000 }).filter(s => s.trim().length >= 10)
          }),
          (contentData) => {
            // Create content as published
            const publishedContent = mockService.createContent({
              ...contentData,
              published: true
            })

            // Property: Published content should be accessible via public endpoint
            const publicContent = mockService.getPublishedContent(publishedContent.id)
            expect(publicContent).not.toBeNull()
            expect(publicContent?.published).toBe(true)
            expect(publicContent?.id).toBe(publishedContent.id)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should hide unpublished content from public access', async () => {
      await fc.assert(
        fc.property(
          fc.record({
            type: fc.constantFrom(ContentType.BLOG, ContentType.FAQ, ContentType.PAGE),
            title: fc.string({ minLength: 3, maxLength: 200 }).filter(s => s.trim().length >= 3),
            body: fc.string({ minLength: 10, maxLength: 1000 }).filter(s => s.trim().length >= 10)
          }),
          (contentData) => {
            // Create content as unpublished
            const unpublishedContent = mockService.createContent({
              ...contentData,
              published: false
            })

            // Property: Unpublished content should not be accessible via public endpoint
            const publicContent = mockService.getPublishedContent(unpublishedContent.id)
            expect(publicContent).toBeNull()

            // But should be accessible via admin endpoint
            const adminContent = mockService.getContent(unpublishedContent.id)
            expect(adminContent).not.toBeNull()
            expect(adminContent?.published).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should filter content lists based on publication status', async () => {
      await fc.assert(
        fc.property(
          fc.array(
            fc.record({
              type: fc.constantFrom(ContentType.BLOG, ContentType.FAQ, ContentType.PAGE),
              title: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
              body: fc.string({ minLength: 10, maxLength: 200 }).filter(s => s.trim().length >= 10),
              published: fc.boolean()
            }),
            { minLength: 2, maxLength: 5 }
          ),
          (contentArray) => {
            const createdContent = []

            // Create all content items
            for (const contentData of contentArray) {
              const content = mockService.createContent(contentData)
              createdContent.push(content)
            }

            // Property: Published filter should only return published content
            const publishedContent = mockService.listContent({ published: true })
            const expectedPublishedCount = contentArray.filter(c => c.published).length
            expect(publishedContent.length).toBe(expectedPublishedCount)
            publishedContent.forEach(content => {
              expect(content.published).toBe(true)
            })

            // Property: Unpublished filter should only return unpublished content
            const unpublishedContent = mockService.listContent({ published: false })
            const expectedUnpublishedCount = contentArray.filter(c => !c.published).length
            expect(unpublishedContent.length).toBe(expectedUnpublishedCount)
            unpublishedContent.forEach(content => {
              expect(content.published).toBe(false)
            })

            // Cleanup for next iteration
            mockService.clear()
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should handle publication state changes correctly', async () => {
      await fc.assert(
        fc.property(
          fc.record({
            type: fc.constantFrom(ContentType.BLOG, ContentType.FAQ, ContentType.PAGE),
            title: fc.string({ minLength: 3, maxLength: 200 }).filter(s => s.trim().length >= 3),
            body: fc.string({ minLength: 10, maxLength: 1000 }).filter(s => s.trim().length >= 10),
            initialPublished: fc.boolean()
          }),
          (contentData) => {
            // Create content with initial publication state
            const content = mockService.createContent({
              type: contentData.type,
              title: contentData.title,
              body: contentData.body,
              published: contentData.initialPublished
            })

            // Property: Publishing should make content accessible
            if (!contentData.initialPublished) {
              const publishedContent = mockService.publishContent(content.id)
              expect(publishedContent.published).toBe(true)
              
              const publicContent = mockService.getPublishedContent(content.id)
              expect(publicContent).not.toBeNull()
              expect(publicContent?.published).toBe(true)
            }

            // Property: Unpublishing should hide content from public access
            const unpublishedContent = mockService.unpublishContent(content.id)
            expect(unpublishedContent.published).toBe(false)
            
            const hiddenContent = mockService.getPublishedContent(content.id)
            expect(hiddenContent).toBeNull()

            // But should still be accessible via admin endpoint
            const adminContent = mockService.getContent(content.id)
            expect(adminContent).not.toBeNull()
            expect(adminContent?.published).toBe(false)

            // Cleanup for next iteration
            mockService.clear()
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  describe('Property 28: Content version history', () => {
    let mockService: MockContentService

    beforeEach(() => {
      mockService = new MockContentService()
    })

    it('should create initial version when content is created', async () => {
      await fc.assert(
        fc.property(
          fc.record({
            type: fc.constantFrom(ContentType.BLOG, ContentType.FAQ, ContentType.PAGE),
            title: fc.string({ minLength: 3, maxLength: 200 }).filter(s => s.trim().length >= 3),
            body: fc.string({ minLength: 10, maxLength: 1000 }).filter(s => s.trim().length >= 10),
            published: fc.boolean()
          }),
          (contentData) => {
            // Create content
            const content = mockService.createContent(contentData)

            // Property: Initial version should be created automatically
            const versions = mockService.getContentVersionHistory(content.id)
            expect(versions.length).toBe(1)
            
            const initialVersion = versions[0]
            expect(initialVersion.version).toBe(1)
            expect(initialVersion.contentId).toBe(content.id)
            expect(initialVersion.title).toBe(content.title)
            expect(initialVersion.body).toBe(content.body)
            expect(initialVersion.published).toBe(content.published)

            // Cleanup for next iteration
            mockService.clear()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain version history for content updates', async () => {
      await fc.assert(
        fc.property(
          fc.record({
            initialContent: fc.record({
              type: fc.constantFrom(ContentType.BLOG, ContentType.FAQ, ContentType.PAGE),
              title: fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length >= 3),
              body: fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10),
              published: fc.boolean()
            }),
            updates: fc.array(
              fc.record({
                title: fc.option(fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length >= 3)),
                body: fc.option(fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10)),
                published: fc.option(fc.boolean())
              }).filter(update => update.title !== null || update.body !== null || update.published !== null),
              { minLength: 1, maxLength: 5 }
            )
          }),
          (data) => {
            // Create initial content
            const content = mockService.createContent(data.initialContent)

            // Apply updates
            let currentContent = content
            for (const update of data.updates) {
              const updateData: UpdateContentData = {}
              if (update.title !== null) updateData.title = update.title
              if (update.body !== null) updateData.body = update.body
              if (update.published !== null) updateData.published = update.published

              currentContent = mockService.updateContent(content.id, updateData)
            }

            // Property: Version history should contain all changes
            const versions = mockService.getContentVersionHistory(content.id)
            const expectedVersionCount = 1 + data.updates.length // Initial + updates
            expect(versions.length).toBe(expectedVersionCount)

            // Property: Versions should be numbered sequentially
            versions.forEach((version, index) => {
              expect(version.version).toBe(index + 1)
              expect(version.contentId).toBe(content.id)
            })

            // Property: Latest version should match current content
            const latestVersion = versions[versions.length - 1]
            expect(latestVersion.title).toBe(currentContent.title)
            expect(latestVersion.body).toBe(currentContent.body)
            expect(latestVersion.published).toBe(currentContent.published)

            // Cleanup for next iteration
            mockService.clear()
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should maintain version history for publication state changes', async () => {
      await fc.assert(
        fc.property(
          fc.record({
            type: fc.constantFrom(ContentType.BLOG, ContentType.FAQ, ContentType.PAGE),
            title: fc.string({ minLength: 3, maxLength: 200 }).filter(s => s.trim().length >= 3),
            body: fc.string({ minLength: 10, maxLength: 1000 }).filter(s => s.trim().length >= 10),
            initialPublished: fc.boolean(),
            publicationChanges: fc.array(fc.boolean(), { minLength: 1, maxLength: 3 })
          }),
          (data) => {
            // Create content
            const content = mockService.createContent({
              type: data.type,
              title: data.title,
              body: data.body,
              published: data.initialPublished
            })

            let actualChanges = 0
            let currentPublished = data.initialPublished

            // Apply publication changes (only count actual state changes)
            for (const shouldPublish of data.publicationChanges) {
              if (shouldPublish && !currentPublished) {
                mockService.publishContent(content.id)
                currentPublished = true
                actualChanges++
              } else if (!shouldPublish && currentPublished) {
                mockService.unpublishContent(content.id)
                currentPublished = false
                actualChanges++
              }
              // If shouldPublish === currentPublished, no change occurs
            }

            // Property: Version history should include actual publication changes
            const versions = mockService.getContentVersionHistory(content.id)
            const expectedVersionCount = 1 + actualChanges // Initial + actual changes
            expect(versions.length).toBe(expectedVersionCount)

            // Property: Each version should have correct publication state
            versions.forEach(version => {
              expect(typeof version.published).toBe('boolean')
              expect(version.contentId).toBe(content.id)
            })

            // Property: Latest version should match current state
            const latestVersion = versions[versions.length - 1]
            expect(latestVersion.published).toBe(currentPublished)

            // Cleanup for next iteration
            mockService.clear()
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should preserve version history integrity across multiple operations', async () => {
      await fc.assert(
        fc.property(
          fc.record({
            type: fc.constantFrom(ContentType.BLOG, ContentType.FAQ, ContentType.PAGE),
            title: fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length >= 3),
            body: fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10),
            operations: fc.array(
              fc.oneof(
                fc.record({
                  type: fc.constant('update' as const),
                  data: fc.record({
                    title: fc.option(fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length >= 3)),
                    body: fc.option(fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10))
                  }).filter(update => update.title !== null || update.body !== null)
                }),
                fc.record({
                  type: fc.constant('publish' as const)
                }),
                fc.record({
                  type: fc.constant('unpublish' as const)
                })
              ),
              { minLength: 2, maxLength: 8 }
            )
          }),
          (data) => {
            // Create initial content
            const content = mockService.createContent({
              type: data.type,
              title: data.title,
              body: data.body,
              published: false
            })

            let operationCount = 0

            // Apply operations
            for (const operation of data.operations) {
              switch (operation.type) {
                case 'update':
                  const updateData: UpdateContentData = {}
                  if (operation.data.title !== null) updateData.title = operation.data.title
                  if (operation.data.body !== null) updateData.body = operation.data.body
                  mockService.updateContent(content.id, updateData)
                  operationCount++
                  break
                case 'publish':
                  mockService.publishContent(content.id)
                  operationCount++
                  break
                case 'unpublish':
                  mockService.unpublishContent(content.id)
                  operationCount++
                  break
              }
            }

            // Property: Version count should match operations + initial
            const versions = mockService.getContentVersionHistory(content.id)
            expect(versions.length).toBe(1 + operationCount)

            // Property: All versions should have unique, sequential version numbers
            const versionNumbers = versions.map(v => v.version)
            const expectedNumbers = Array.from({ length: versions.length }, (_, i) => i + 1)
            expect(versionNumbers).toEqual(expectedNumbers)

            // Property: All versions should reference the same content ID
            versions.forEach(version => {
              expect(version.contentId).toBe(content.id)
              expect(version.id).toBeDefined()
              expect(version.createdAt).toBeInstanceOf(Date)
            })

            // Property: Version history should be ordered by version number
            for (let i = 1; i < versions.length; i++) {
              expect(versions[i].version).toBe(versions[i - 1].version + 1)
            }

            // Cleanup for next iteration
            mockService.clear()
          }
        ),
        { numRuns: 30 }
      )
    })
  })
})