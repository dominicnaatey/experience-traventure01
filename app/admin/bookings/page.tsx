'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

interface Booking {
  id: string
  travelersCount: number
  totalPrice: number
  status: 'pending' | 'confirmed' | 'cancelled'
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
  tour: {
    id: string
    title: string
    destination: {
      name: string
      country: string
    }
  }
  availability: {
    startDate: string
    endDate: string
  }
  payment?: {
    id: string
    status: 'pending' | 'success' | 'failed'
    amount: number
  }
}

export default function AdminBookingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all')

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('status', filter)
      
      const response = await fetch(`/api/admin/bookings?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch bookings')
      
      const data = await response.json()
      setBookings(data.bookings || [])
    } catch (err) {
      setError('Failed to load bookings')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    if (session.user?.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
    fetchBookings()
  }, [session, status, router, fetchBookings])

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to ${newStatus} this booking?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update booking status')
      
      // Refresh bookings
      fetchBookings()
    } catch (err) {
      alert('Failed to update booking status')
      console.error(err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTourDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session || session.user?.role !== 'ADMIN') {
    return null // Will redirect
  }

  const pendingCount = bookings.filter(b => b.status === 'pending').length
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-primary hover:text-primary/80 flex items-center gap-2">
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Admin Dashboard</span>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Booking Management</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">{bookings.length}</div>
            <div className="text-sm text-gray-500">Total Bookings</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{confirmedCount}</div>
            <div className="text-sm text-gray-500">Confirmed</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">{cancelledCount}</div>
            <div className="text-sm text-gray-500">Cancelled</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Bookings ({bookings.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'pending'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('confirmed')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'confirmed'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Confirmed ({confirmedCount})
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'cancelled'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancelled ({cancelledCount})
            </button>
          </div>
        </div>

        {error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchBookings}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md"
            >
              Try Again
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-500">No bookings match the current filter.</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {bookings.map((booking) => (
                <li key={booking.id}>
                  <div className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {booking.tour.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                            {booking.payment && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.payment.status)}`}>
                                Payment: {booking.payment.status}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p><span className="font-medium">Customer:</span> {booking.user.name}</p>
                            <p><span className="font-medium">Email:</span> {booking.user.email}</p>
                            <p><span className="font-medium">Travelers:</span> {booking.travelersCount}</p>
                          </div>
                          <div>
                            <p><span className="font-medium">Destination:</span> {booking.tour.destination.name}, {booking.tour.destination.country}</p>
                            <p><span className="font-medium">Tour Dates:</span> {formatTourDate(booking.availability.startDate)} - {formatTourDate(booking.availability.endDate)}</p>
                            <p><span className="font-medium">Total Price:</span> <span className="text-lg font-bold text-primary">${booking.totalPrice}</span></p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4">
                          <p className="text-sm text-gray-500">
                            Booked on {formatDate(booking.createdAt)}
                          </p>
                          
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/bookings/${booking.id}`}
                              target="_blank"
                              className="text-primary hover:text-primary/80 text-sm font-medium"
                            >
                              View Details
                            </Link>
                            
                            {booking.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                                  className="text-green-600 hover:text-green-500 text-sm font-medium"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                  className="text-red-600 hover:text-red-500 text-sm font-medium"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            
                            {booking.status === 'confirmed' && (
                              <button
                                onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                className="text-red-600 hover:text-red-500 text-sm font-medium"
                              >
                                Cancel
                              </button>
                            )}
                            
                            {booking.payment?.status === 'success' && (
                              <Link
                                href={`/api/payments/invoice?bookingId=${booking.id}`}
                                target="_blank"
                                className="text-gray-600 hover:text-gray-500 text-sm font-medium"
                              >
                                Invoice
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}