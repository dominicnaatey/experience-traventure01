'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Booking {
  id: string
  travelersCount: number
  totalPrice: number
  status: 'pending' | 'confirmed' | 'cancelled'
  createdAt: string
  tour: {
    id: string
    title: string
    description: string
    pricePerPerson: number
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
    method?: string
    provider?: string
  }
}

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const bookingId = params.id as string

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paymentLoading, setPaymentLoading] = useState(false)

  const fetchBookingDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`)
      if (!response.ok) throw new Error('Booking not found')
      
      const data = await response.json()
      setBooking(data.booking)
    } catch (err) {
      setError('Failed to load booking details')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [bookingId])

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    if (bookingId) {
      fetchBookingDetails()
    }
  }, [bookingId, session, status, router, fetchBookingDetails])

  const handlePayment = async () => {
    if (!booking) return

    setPaymentLoading(true)
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: booking.totalPrice,
          method: 'card' // Default to card payment
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Payment initialization failed')
      }

      const data = await response.json()
      console.log('Payment initiated:', data)
      
      // In a real implementation, you would redirect to the payment provider
      // For now, we'll simulate a successful payment
      alert('Payment initiated successfully! In a real app, you would be redirected to the payment provider.')
      
      // Refresh booking details
      fetchBookingDetails()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleCancelBooking = async () => {
    if (!booking || !confirm('Are you sure you want to cancel this booking?')) return

    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'cancelled' })
      })

      if (!response.ok) throw new Error('Failed to cancel booking')
      
      // Refresh booking details
      fetchBookingDetails()
    } catch (err) {
      alert('Failed to cancel booking')
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
      month: 'long',
      day: 'numeric'
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect to sign in
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Booking not found'}</p>
          <Link href="/bookings" className="text-indigo-600 hover:text-indigo-500">
            Back to Bookings
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/bookings" className="text-indigo-600 hover:text-indigo-500">
              ← Back to Bookings
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">
                Dashboard
              </Link>
              <span className="text-gray-700">Welcome, {session.user?.name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Booking Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
              <p className="text-gray-600">Booking ID: {booking.id}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                {booking.status}
              </span>
              {booking.payment && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(booking.payment.status)}`}>
                  Payment: {booking.payment.status}
                </span>
              )}
            </div>
          </div>

          {/* Status Messages */}
          {booking.status === 'pending' && !booking.payment && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <div className="flex">
                <div className="shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Payment Required</h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    Your booking is pending payment. Complete your payment to confirm your booking.
                  </p>
                </div>
              </div>
            </div>
          )}

          {booking.status === 'confirmed' && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
              <div className="flex">
                <div className="shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Booking Confirmed</h3>
                  <p className="mt-1 text-sm text-green-700">
                    Your booking is confirmed! You&apos;ll receive a reminder email before your tour date.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tour Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tour Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{booking.tour.title}</h3>
              <p className="text-gray-600 mb-4">{booking.tour.description}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Destination:</span>
                  <span className="font-medium">{booking.tour.destination.name}, {booking.tour.destination.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price per person:</span>
                  <span className="font-medium">${booking.tour.pricePerPerson}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Number of travelers:</span>
                  <span className="font-medium">{booking.travelersCount}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Travel Dates</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {formatDate(booking.availability.startDate)}
                  </div>
                  <div className="text-sm text-gray-600 my-2">to</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatDate(booking.availability.endDate)}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Booking Date:</span>
                  <span>{formatDate(booking.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${booking.tour.pricePerPerson} × {booking.travelersCount}</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold">Total Amount:</span>
                    <span className="text-lg font-bold text-indigo-600">${booking.totalPrice}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              {booking.payment ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment ID:</span>
                    <span className="font-medium">{booking.payment.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">${booking.payment.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.payment.status)}`}>
                      {booking.payment.status}
                    </span>
                  </div>
                  {booking.payment.method && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Method:</span>
                      <span className="font-medium capitalize">{booking.payment.method}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">No payment information available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {booking.status === 'pending' && !booking.payment && (
              <button
                onClick={handlePayment}
                disabled={paymentLoading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-md font-medium"
              >
                {paymentLoading ? 'Processing...' : 'Pay Now'}
              </button>
            )}
            
            {booking.status === 'pending' && (
              <button
                onClick={handleCancelBooking}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md font-medium"
              >
                Cancel Booking
              </button>
            )}
            
            {booking.status === 'confirmed' && booking.payment?.status === 'success' && (
              <Link
                href={`/api/payments/invoice?bookingId=${booking.id}`}
                target="_blank"
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-md font-medium text-center"
              >
                Download Invoice
              </Link>
            )}
            
            <Link
              href={`/tours/${booking.tour.id}`}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-md font-medium text-center"
            >
              View Tour Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}