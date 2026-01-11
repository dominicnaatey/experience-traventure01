'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'

interface Tour {
  id: string
  title: string
  description: string
  pricePerPerson: number
  durationDays: number
  difficulty?: 'easy' | 'medium' | 'hard'
  images: string[]
  destination: {
    id: string
    name: string
    country: string
  }
}

interface TourFilters {
  search?: string
  minPrice?: number
  maxPrice?: number
  difficulty?: string
  destination?: string
}

export default function ToursPage() {
  const { data: session } = useSession()
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState<TourFilters>({})
  const [destinations, setDestinations] = useState<{id: string, name: string, country: string}[]>([])

  const fetchTours = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filters.search) params.append('search', filters.search)
      if (filters.minPrice) params.append('minPrice', filters.minPrice.toString())
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString())
      if (filters.difficulty) params.append('difficulty', filters.difficulty)
      if (filters.destination) params.append('destination', filters.destination)

      const response = await fetch(`/api/tours?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch tours')
      
      const data = await response.json()
      setTours(data.tours || [])
    } catch (err) {
      setError('Failed to load tours')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchTours()
    fetchDestinations()
  }, [fetchTours])

  const fetchDestinations = async () => {
    try {
      const response = await fetch('/api/destinations')
      if (response.ok) {
        const data = await response.json()
        setDestinations(data.destinations || [])
      }
    } catch (err) {
      console.error('Failed to fetch destinations:', err)
    }
  }

  const handleFilterChange = (key: keyof TourFilters, value: string | number | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }))
  }

  const clearFilters = () => {
    setFilters({})
  }

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-semibold text-gray-900">
              Travel & Tours
            </Link>
            <div className="flex items-center space-x-4">
              {session ? (
                <>
                  <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">
                    Dashboard
                  </Link>
                  <span className="text-gray-700">Welcome, {session.user?.name}</span>
                </>
              ) : (
                <>
                  <Link href="/auth/signin" className="text-gray-700 hover:text-gray-900">
                    Sign In
                  </Link>
                  <Link href="/auth/signup" className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md text-sm font-medium">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Discover Amazing Tours</h1>
          <p className="mt-2 text-gray-600">Find your perfect travel experience from our curated collection of tours</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Tours
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search by title or destination..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

            {/* Destination Filter */}
            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
                Destination
              </label>
              <select
                id="destination"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                value={filters.destination || ''}
                onChange={(e) => handleFilterChange('destination', e.target.value)}
              >
                <option value="">All Destinations</option>
                {destinations.map(dest => (
                  <option key={dest.id} value={dest.id}>
                    {dest.name}, {dest.country}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-1">
                Max Price ($)
              </label>
              <input
                type="number"
                id="maxPrice"
                placeholder="Max price"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                value={filters.maxPrice || ''}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>

            {/* Difficulty Filter */}
            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty
              </label>
              <select
                id="difficulty"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                value={filters.difficulty || ''}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              >
                <option value="">All Levels</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="text-sm text-primary hover:text-primary/80"
            >
              Clear all filters
            </button>
          </div>
        </div>

        {/* Tours Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchTours}
              className="mt-4 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md"
            >
              Try Again
            </button>
          </div>
        ) : tours.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No tours found matching your criteria.</p>
            <button
              onClick={clearFilters}
              className="mt-4 text-primary hover:text-primary/80"
            >
              Clear filters to see all tours
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tours.map((tour) => (
              <div key={tour.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Tour Image */}
                <div className="h-48 bg-gray-200 relative">
                {tour.images && tour.images.length > 0 ? (
                  <Image
                    src={tour.images[0]}
                    alt={tour.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image Available
                  </div>
                )}
                {tour.difficulty && (
                    <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(tour.difficulty)}`}>
                      {tour.difficulty}
                    </span>
                  )}
                </div>

                {/* Tour Content */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {tour.title}
                    </h3>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {tour.destination.name}, {tour.destination.country}
                  </p>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {tour.description}
                  </p>
                  
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-gray-500">
                      {tour.durationDays} day{tour.durationDays !== 1 ? 's' : ''}
                    </div>
                    <div className="text-lg font-bold text-primary">
                      ${tour.pricePerPerson}
                      <span className="text-sm font-normal text-gray-500">/person</span>
                    </div>
                  </div>
                  
                  <Link
                    href={`/tours/${tour.id}`}
                    className="w-full bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-md text-center block transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}