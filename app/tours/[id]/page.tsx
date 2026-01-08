'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Tour {
  id: string
  title: string
  description: string
  pricePerPerson: number
  durationDays: number
  maxGroupSize: number
  difficulty?: 'easy' | 'medium' | 'hard'
  inclusions: string[]
  exclusions: string[]
  itinerary: { day: number; title: string; description: string }[]
  images: string[]
  destination: {
    id: string
    name: string
    country: string
    description: string
  }
}

interface TourAvailability {
  id: string
  startDate: string
  endDate: string
  availableSlots: number
}

interface Review {
  id: string
  rating: number
  comment: string
  user: {
    name: string
  }
  createdAt: string
}

export default function TourDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const tourId = params.id as string

  const [tour, setTour] = useState<Tour | null>(null)
  const [availability, setAvailability] = useState<TourAvailability[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Booking state
  const [selectedAvailability, setSelectedAvailability] = useState<string>('')
  const [travelersCount, setTravelersCount] = useState(1)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [showBookingForm, setShowBookingForm] = useState(false)

  useEffect(() => {
    if (tourId) {
      fetchTourDetails()
      fetchAvailability()
      fetchReviews()
    }
  }, [tourId])

  const fetchTourDetails = async () => {
    try {
      const response = await fetch(`/api/tours/${tourId}`)
      if (!response.ok) throw new Error('Tour not found')
      
      const data = await response.json()
      setTour(data.tour)
    } catch (err) {
      setError('Failed to load tour details')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailability = async () => {
    try {
      const response = await fetch(`/api/tours/${tourId}/availability`)
      if (response.ok) {
        const data = await response.json()
        setAvailability(data.availability || [])
      }
    } catch (err) {
      console.error('Failed to fetch availability:', err)
    }
  }

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/tours/${tourId}/reviews`)
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews || [])
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err)
    }
  }

  const handleBooking = async () => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (!selectedAvailability) {
      alert('Please select a date')
      return
    }

    setBookingLoading(true)
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tourId,
          availabilityId: selectedAvailability,
          travelersCount
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Booking failed')
      }

      const data = await response.json()
      router.push(`/bookings/${data.booking.id}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Booking failed')
    } finally {
      setBookingLoading(false)
    }
  }

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error || !tour) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Tour not found'}</p>
          <Link href="/tours" className="text-indigo-600 hover:text-indigo-500">
            Back to Tours
          </Link>
        </div>
      </div>
    )
  }

  const totalPrice = tour.pricePerPerson * travelersCount

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/tours" className="text-indigo-600 hover:text-indigo-500">
              ← Back to Tours
            </Link>
            <div className="flex items-center space-x-4">
              {session ? (
                <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">
                  Dashboard
                </Link>
              ) : (
                <Link href="/auth/signin" className="text-gray-700 hover:text-gray-900">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tour Images */}
            <div className="mb-8">
              {tour.images && tour.images.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <img
                    src={tour.images[0]}
                    alt={tour.title}
                    className="w-full h-64 md:h-80 object-cover rounded-lg"
                  />
                  {tour.images.slice(1, 3).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${tour.title} ${index + 2}`}
                      className="w-full h-32 md:h-40 object-cover rounded-lg"
                    />
                  ))}
                </div>
              ) : (
                <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">No images available</span>
                </div>
              )}
            </div>

            {/* Tour Info */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{tour.title}</h1>
                  <p className="text-lg text-gray-600">
                    {tour.destination.name}, {tour.destination.country}
                  </p>
                </div>
                {tour.difficulty && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(tour.difficulty)}`}>
                    {tour.difficulty}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{tour.durationDays}</div>
                  <div className="text-sm text-gray-500">Days</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{tour.maxGroupSize}</div>
                  <div className="text-sm text-gray-500">Max Group</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">${tour.pricePerPerson}</div>
                  <div className="text-sm text-gray-500">Per Person</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{reviews.length}</div>
                  <div className="text-sm text-gray-500">Reviews</div>
                </div>
              </div>

              <p className="text-gray-700 mb-6">{tour.description}</p>

              {/* Inclusions & Exclusions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">What's Included</h3>
                  <ul className="space-y-2">
                    {tour.inclusions.map((item, index) => (
                      <li key={index} className="flex items-center text-green-700">
                        <span className="mr-2">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">What's Not Included</h3>
                  <ul className="space-y-2">
                    {tour.exclusions.map((item, index) => (
                      <li key={index} className="flex items-center text-red-700">
                        <span className="mr-2">✗</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Itinerary */}
            {tour.itinerary && tour.itinerary.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Itinerary</h2>
                <div className="space-y-6">
                  {tour.itinerary.map((day) => (
                    <div key={day.day} className="border-l-4 border-indigo-500 pl-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Day {day.day}: {day.title}
                      </h3>
                      <p className="text-gray-600 mt-2">{day.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h2>
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900">{review.user.name}</span>
                          <div className="ml-2 flex">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Book This Tour</h2>
              
              {!session ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">Sign in to book this tour</p>
                  <Link
                    href="/auth/signin"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md block text-center"
                  >
                    Sign In
                  </Link>
                </div>
              ) : (
                <>
                  {/* Date Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Date
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={selectedAvailability}
                      onChange={(e) => setSelectedAvailability(e.target.value)}
                    >
                      <option value="">Choose a date</option>
                      {availability.map((slot) => (
                        <option key={slot.id} value={slot.id}>
                          {formatDate(slot.startDate)} - {formatDate(slot.endDate)} 
                          ({slot.availableSlots} slots available)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Travelers Count */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Travelers
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={travelersCount}
                      onChange={(e) => setTravelersCount(parseInt(e.target.value))}
                    >
                      {Array.from({ length: Math.min(tour.maxGroupSize, 10) }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1} {i === 0 ? 'Traveler' : 'Travelers'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Summary */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">
                        ${tour.pricePerPerson} × {travelersCount} traveler{travelersCount !== 1 ? 's' : ''}
                      </span>
                      <span className="font-medium">${totalPrice}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">Total</span>
                        <span className="text-lg font-bold text-indigo-600">${totalPrice}</span>
                      </div>
                    </div>
                  </div>

                  {/* Book Button */}
                  <button
                    onClick={handleBooking}
                    disabled={!selectedAvailability || bookingLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-md font-medium transition-colors"
                  >
                    {bookingLoading ? 'Booking...' : 'Book Now'}
                  </button>

                  <p className="text-xs text-gray-500 mt-2 text-center">
                    You won't be charged yet. Review your booking details first.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}