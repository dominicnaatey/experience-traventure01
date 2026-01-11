/**
 * **Feature: travel-tour-booking, Property 1: Active tour visibility**
 * **Validates: Requirements 1.1, 1.2**
 * 
 * Property-based test for active tour visibility.
 * For any tour listing request, all returned tours should have active status and include required display information.
 */

import { describe, it, expect, jest } from '@jest/globals'
import { TourStatus } from '@prisma/client'

// Mock Prisma client
const mockPrisma = {
  tour: {
    findMany: jest.fn()
  },
  destination: {
    findMany: jest.fn()
  }
}

// Mock the prisma import
jest.mock('../../app/lib/prisma', () => ({
  prisma: mockPrisma
}))

// Import after mocking
const { GET: getTours } = require('../../app/api/tours/route')
const { GET: getDestinations } = require('../../app/api/destinations/route')

describe('Tour Management Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should only return active tours in public listing', async () => {
    // **Feature: travel-tour-booking, Property 1: Active tour visibility**
    // **Validates: Requirements 1.1, 1.2**
    
    const activeTours = [
      {
        id: 'tour-1',
        title: 'Adventure Tour 1',
        description: 'This is a wonderful adventure tour experience',
        durationDays: 3,
        pricePerPerson: 100,
        maxGroupSize: 10,
        status: TourStatus.ACTIVE,
        destination: {
          id: 'dest-1',
          name: 'Destination 1',
          country: 'Country 1',
          coverImage: 'https://example.com/dest.jpg'
        },
        _count: {
          reviews: 5
        }
      }
    ]
    
    mockPrisma.tour.findMany.mockResolvedValue(activeTours)
    
    const request = new Request('http://localhost:3000/api/tours')
    const response = await getTours(request)
    const responseData = await response.json()
    
    // Property 1: All returned tours should have ACTIVE status
    expect(responseData.success).toBe(true)
    expect(Array.isArray(responseData.data)).toBe(true)
    expect(responseData.data).toHaveLength(activeTours.length)
    
    responseData.data.forEach((tour: any) => {
      expect(tour.status).toBe(TourStatus.ACTIVE)
      expect(tour).toHaveProperty('id')
      expect(tour).toHaveProperty('title')
      expect(tour).toHaveProperty('pricePerPerson')
      expect(tour).toHaveProperty('durationDays')
      expect(tour).toHaveProperty('destination')
      expect(tour.destination).toHaveProperty('name')
      expect(tour.destination).toHaveProperty('country')
      
      expect(typeof tour.title).toBe('string')
      expect(typeof tour.pricePerPerson).toBe('number')
      expect(typeof tour.durationDays).toBe('number')
      expect(tour.pricePerPerson).toBeGreaterThan(0)
      expect(tour.durationDays).toBeGreaterThan(0)
    })
    
    expect(mockPrisma.tour.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: TourStatus.ACTIVE
        })
      })
    )
  })

  it('should allow guest access to destinations without authentication', async () => {
    // **Feature: travel-tour-booking, Property 4: Guest access to destinations**
    // **Validates: Requirements 1.5**
    
    const destinations = [
      {
        id: 'dest-1',
        name: 'Destination 1',
        country: 'Country 1',
        description: 'This is a beautiful destination',
        coverImage: 'https://example.com/destination.jpg',
        _count: { tours: 3 }
      }
    ]
    
    mockPrisma.destination.findMany.mockResolvedValue(destinations)
    
    const request = new Request('http://localhost:3000/api/destinations')
    const response = await getDestinations(request)
    const responseData = await response.json()
    
    expect(responseData.success).toBe(true)
    expect(Array.isArray(responseData.data)).toBe(true)
    expect(responseData.data).toHaveLength(destinations.length)
    
    responseData.data.forEach((destination: any) => {
      expect(destination).toHaveProperty('id')
      expect(destination).toHaveProperty('name')
      expect(destination).toHaveProperty('country')
      expect(destination).toHaveProperty('description')
      expect(destination).toHaveProperty('coverImage')
      
      expect(typeof destination.name).toBe('string')
      expect(typeof destination.country).toBe('string')
      expect(destination.name.trim().length).toBeGreaterThan(0)
      expect(destination.country.trim().length).toBeGreaterThan(0)
    })
  })

  it('should handle search functionality correctly', async () => {
    // **Feature: travel-tour-booking, Property 2: Search result relevance**
    // **Validates: Requirements 1.3**
    
    const searchTerm = 'Adventure'
    const matchingTours = [
      {
        id: 'tour-1',
        title: `${searchTerm} Tour Experience`,
        status: TourStatus.ACTIVE,
        destination: {
          name: `${searchTerm} Destination`,
          country: 'Test Country',
          coverImage: 'https://example.com/dest.jpg'
        },
        _count: { reviews: 5 }
      }
    ]
    
    mockPrisma.tour.findMany.mockResolvedValue(matchingTours)
    
    const searchUrl = `http://localhost:3000/api/tours?search=${encodeURIComponent(searchTerm)}`
    const request = new Request(searchUrl)
    const response = await getTours(request)
    const responseData = await response.json()
    
    expect(responseData.success).toBe(true)
    expect(Array.isArray(responseData.data)).toBe(true)
    
    responseData.data.forEach((tour: any) => {
      const titleMatch = tour.title.toLowerCase().includes(searchTerm.toLowerCase())
      const destinationMatch = tour.destination.name.toLowerCase().includes(searchTerm.toLowerCase())
      expect(titleMatch || destinationMatch).toBe(true)
    })
    
    expect(mockPrisma.tour.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({
              title: expect.objectContaining({
                contains: searchTerm,
                mode: 'insensitive'
              })
            })
          ])
        })
      })
    )
  })

  it('should handle filtering correctly', async () => {
    // **Feature: travel-tour-booking, Property 3: Filter result compliance**
    // **Validates: Requirements 1.4**
    
    const minPrice = 100
    const maxPrice = 500
    const filteredTours = [
      {
        id: 'tour-1',
        title: 'Filtered Tour Experience',
        pricePerPerson: 250,
        durationDays: 3,
        status: TourStatus.ACTIVE,
        destination: {
          name: 'Test Destination',
          country: 'Test Country',
          coverImage: 'https://example.com/dest.jpg'
        },
        _count: { reviews: 2 }
      }
    ]
    
    mockPrisma.tour.findMany.mockResolvedValue(filteredTours)
    
    const filterUrl = `http://localhost:3000/api/tours?minPrice=${minPrice}&maxPrice=${maxPrice}`
    const request = new Request(filterUrl)
    const response = await getTours(request)
    const responseData = await response.json()
    
    expect(responseData.success).toBe(true)
    responseData.data.forEach((tour: any) => {
      expect(tour.pricePerPerson).toBeGreaterThanOrEqual(minPrice)
      expect(tour.pricePerPerson).toBeLessThanOrEqual(maxPrice)
    })
    
    expect(mockPrisma.tour.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          pricePerPerson: expect.objectContaining({
            gte: minPrice,
            lte: maxPrice
          })
        })
      })
    )
  })

  it('should handle tour deactivation visibility correctly', async () => {
    // **Feature: travel-tour-booking, Property 21: Tour deactivation visibility**
    // **Validates: Requirements 6.3**
    
    const activeTours = [
      {
        id: 'tour-1',
        title: 'Active Tour 1',
        status: TourStatus.ACTIVE,
        destination: {
          name: 'Destination 1',
          country: 'Country 1',
          coverImage: 'https://example.com/dest.jpg'
        },
        _count: { reviews: 3 }
      }
    ]
    
    mockPrisma.tour.findMany.mockResolvedValue(activeTours)
    
    const request = new Request('http://localhost:3000/api/tours')
    const response = await getTours(request)
    const responseData = await response.json()
    
    expect(responseData.success).toBe(true)
    expect(responseData.data).toHaveLength(activeTours.length)
    
    responseData.data.forEach((tour: unknown) => {
      expect(tour.status).toBe(TourStatus.ACTIVE)
    })
    
    expect(mockPrisma.tour.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: TourStatus.ACTIVE
        })
      })
    )
  })
})