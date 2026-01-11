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
  priceRange?: string
  duration?: string[]
  activityLevel?: string[]
}

export default function ToursPage() {
  const { data: session } = useSession()
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState<TourFilters>({
    duration: [],
    activityLevel: []
  })
  const [sortBy, setSortBy] = useState('featured')

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
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch tours')
      }
      
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
  }, [fetchTours])

  const handleFilterChange = (key: keyof TourFilters, value: string | number | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }))
  }

  const handlePriceRangeChange = (range: string) => {
    setFilters(prev => {
      let minPrice, maxPrice
      switch (range) {
        case 'under-500':
          minPrice = undefined
          maxPrice = 500
          break
        case '500-1000':
          minPrice = 500
          maxPrice = 1000
          break
        case '1000+':
          minPrice = 1000
          maxPrice = undefined
          break
        default:
          minPrice = undefined
          maxPrice = undefined
      }
      return { ...prev, priceRange: range, minPrice, maxPrice }
    })
  }

  const handleDurationChange = (duration: string, checked: boolean) => {
    setFilters(prev => {
      const newDuration = checked 
        ? [...(prev.duration || []), duration]
        : (prev.duration || []).filter(d => d !== duration)
      return { ...prev, duration: newDuration }
    })
  }

  const handleActivityLevelChange = (level: string, checked: boolean) => {
    setFilters(prev => {
      const newActivityLevel = checked 
        ? [...(prev.activityLevel || []), level]
        : (prev.activityLevel || []).filter(l => l !== level)
      return { ...prev, activityLevel: newActivityLevel }
    })
  }

  const clearFilters = () => {
    setFilters({ duration: [], activityLevel: [] })
    setSortBy('featured')
  }

  const getBadgeForTour = (tour: Tour, index: number) => {
    if (index === 0) return { text: 'Best Seller', className: 'bg-white/90 dark:bg-slate-900/90 backdrop-blur text-slate-900 dark:text-white' }
    if (index === 1) return { text: 'Trending', className: 'bg-blue-500/90 backdrop-blur text-white' }
    if (tour.pricePerPerson > 1000) return { text: 'Premium', className: 'bg-purple-500/90 backdrop-blur text-white' }
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-display flex flex-col">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="text-blue-600">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">TravelCo</h2>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm font-medium hover:text-blue-600 transition-colors">
                Home
              </Link>
              <Link href="/tours" className="text-sm font-medium text-blue-600">
                Tours
              </Link>
              <Link href="/destinations" className="text-sm font-medium hover:text-blue-600 transition-colors">
                Destinations
              </Link>
              <Link href="/about" className="text-sm font-medium hover:text-blue-600 transition-colors">
                About Us
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4 flex-1 justify-end">
              {/* Search Bar */}
              <div className="hidden sm:flex max-w-xs w-full relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  className="block w-full pl-10 pr-3 py-2 border-none rounded-lg bg-slate-100 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-600 placeholder-slate-500"
                  placeholder="Search tours..."
                  type="text"
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>

              {/* Icons */}
              <div className="flex items-center gap-2">
                {session ? (
                  <>
                    <Link href="/bookings" className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </Link>
                    <Link href="/dashboard" className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/auth/signin" className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium">
                      Sign In
                    </Link>
                    <Link href="/auth/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Wrapper */}
      <div className="grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs */}
        <nav className="flex mb-4 text-sm text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900 dark:text-slate-200 font-medium">Tours</span>
        </nav>

        {/* Page Heading */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
            Discover Amazing Tours
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
            Explore our curated selection of global adventures. From mountain peaks to coastal escapes.
          </p>
        </div>

        {/* Layout Split */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 shrink-0 space-y-8">
            {/* Filter Group: Price */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4 flex justify-between items-center">
                Price Range
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </h3>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    checked={!filters.priceRange}
                    className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-600 bg-transparent"
                    name="price"
                    type="radio"
                    onChange={() => handlePriceRangeChange('')}
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-blue-600">All Prices</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    checked={filters.priceRange === 'under-500'}
                    className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-600 bg-transparent"
                    name="price"
                    type="radio"
                    onChange={() => handlePriceRangeChange('under-500')}
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-blue-600">Under $500</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    checked={filters.priceRange === '500-1000'}
                    className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-600 bg-transparent"
                    name="price"
                    type="radio"
                    onChange={() => handlePriceRangeChange('500-1000')}
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-blue-600">$500 - $1000</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    checked={filters.priceRange === '1000+'}
                    className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-600 bg-transparent"
                    name="price"
                    type="radio"
                    onChange={() => handlePriceRangeChange('1000+')}
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-blue-600">$1000+</span>
                </label>
              </div>
            </div>
            <div className="w-full h-px bg-slate-200 dark:bg-slate-700"></div>

            {/* Filter Group: Duration */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4 flex justify-between items-center">
                Duration
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </h3>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 bg-transparent"
                    type="checkbox"
                    checked={filters.duration?.includes('day-trip') || false}
                    onChange={(e) => handleDurationChange('day-trip', e.target.checked)}
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-blue-600">Day Trip</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 bg-transparent"
                    type="checkbox"
                    checked={filters.duration?.includes('3-5-days') || false}
                    onChange={(e) => handleDurationChange('3-5-days', e.target.checked)}
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-blue-600">3-5 Days</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 bg-transparent"
                    type="checkbox"
                    checked={filters.duration?.includes('1-week+') || false}
                    onChange={(e) => handleDurationChange('1-week+', e.target.checked)}
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-blue-600">1 Week+</span>
                </label>
              </div>
            </div>
            <div className="w-full h-px bg-slate-200 dark:bg-slate-700"></div>

            {/* Filter Group: Activity Level */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4 flex justify-between items-center">
                Activity Level
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </h3>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 bg-transparent"
                    type="checkbox"
                    checked={filters.activityLevel?.includes('easy') || false}
                    onChange={(e) => handleActivityLevelChange('easy', e.target.checked)}
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-blue-600">Easy / Relaxing</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 bg-transparent"
                    type="checkbox"
                    checked={filters.activityLevel?.includes('moderate') || false}
                    onChange={(e) => handleActivityLevelChange('moderate', e.target.checked)}
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-blue-600">Moderate</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 bg-transparent"
                    type="checkbox"
                    checked={filters.activityLevel?.includes('intense') || false}
                    onChange={(e) => handleActivityLevelChange('intense', e.target.checked)}
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-blue-600">Intense / Hiking</span>
                </label>
              </div>
            </div>

            {/* Clear Filters Button */}
            <button
              onClick={clearFilters}
              className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all filters
            </button>
          </aside>

          {/* Main Listing Area */}
          <div className="flex-1">
            {/* Actions Bar (Sort/Count) */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Showing {tours.length} results
              </p>
              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-500 dark:text-slate-400 font-medium" htmlFor="sort">
                  Sort by:
                </label>
                <div className="relative">
                  <select
                    className="appearance-none pl-3 pr-8 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-900 dark:text-white focus:ring-blue-600 focus:border-blue-600 cursor-pointer"
                    id="sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="featured">Featured</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Tours Grid */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <button
                  onClick={fetchTours}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : tours.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 dark:text-slate-400">No tours found matching your criteria.</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear filters to see all tours
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tours.map((tour, index) => {
                  const badge = getBadgeForTour(tour, index)
                  return (
                    <div key={tour.id} className="group flex flex-col bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300">
                      <div className="relative aspect-4/3 overflow-hidden">
                        {tour.images && tour.images.length > 0 ? (
                          <Image
                            src={tour.images[0]}
                            alt={tour.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-800">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        {badge && (
                          <span className={`absolute top-3 left-3 text-xs font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wide ${badge.className}`}>
                            {badge.text}
                          </span>
                        )}
                        <button className="absolute top-3 right-3 p-2 bg-white/50 hover:bg-white text-slate-900 rounded-full backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      </div>

                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 transition-colors">
                            {tour.title}
                          </h3>
                        </div>
                        
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          {tour.destination.name}, {tour.destination.country}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-3">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{tour.durationDays} Day{tour.durationDays !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            <span className="text-slate-700 dark:text-slate-200 font-medium">4.8</span>
                            <span className="text-slate-400">(124)</span>
                          </div>
                        </div>
                        
                        <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                          <span className="text-lg font-bold text-blue-600">
                            ${tour.pricePerPerson}
                            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/person</span>
                          </span>
                          <Link
                            href={`/tours/${tour.id}`}
                            className="text-sm font-semibold text-slate-900 dark:text-white cursor-pointer hover:underline decoration-blue-600 underline-offset-4 decoration-2 transition-colors"
                          >
                            View tour
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {tours.length > 0 && (
              <div className="mt-12 flex justify-center">
                <nav className="flex items-center gap-2">
                  <button className="h-10 w-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-600 text-white font-medium shadow-sm">
                    1
                  </button>
                  <button className="h-10 w-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    2
                  </button>
                  <button className="h-10 w-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    3
                  </button>
                  <span className="flex items-center justify-center text-slate-400 px-2">...</span>
                  <button className="h-10 w-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    8
                  </button>
                  <button className="h-10 w-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simple Footer */}
      <footer className="mt-12 py-8 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 dark:text-slate-400 text-sm">
          <p>© 2024 TravelCo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}