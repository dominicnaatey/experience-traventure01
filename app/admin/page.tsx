'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DashboardStats {
  totalBookings: number
  totalRevenue: number
  pendingBookings: number
  confirmedBookings: number
  totalTours: number
  activeTours: number
  totalUsers: number
  recentBookings: Array<{
    id: string
    tour: { title: string }
    user: { name: string }
    totalPrice: number
    status: string
    createdAt: string
  }>
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
    fetchDashboardStats()
  }, [session, status, router])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard')
      if (!response.ok) throw new Error('Failed to fetch dashboard stats')
      
      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {session.user?.name}</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {session.user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchDashboardStats}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md"
            >
              Try Again
            </button>
          </div>
        ) : !stats ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : (
          <>
            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                  href="/admin/tours"
                  className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center"
                >
                  <div className="text-2xl mb-2">🏞️</div>
                  <div className="font-medium text-gray-900">Manage Tours</div>
                </Link>
                <Link
                  href="/admin/bookings"
                  className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center"
                >
                  <div className="text-2xl mb-2">📅</div>
                  <div className="font-medium text-gray-900">View Bookings</div>
                </Link>
                <Link
                  href="/admin/destinations"
                  className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center"
                >
                  <div className="text-2xl mb-2">🌍</div>
                  <div className="font-medium text-gray-900">Destinations</div>
                </Link>
                <Link
                  href="/admin/content"
                  className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center"
                >
                  <div className="text-2xl mb-2">📝</div>
                  <div className="font-medium text-gray-900">Content</div>
                </Link>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="shrink-0">
                      <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">$</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                      <p className="text-2xl font-semibold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">📅</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.totalBookings}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="shrink-0">
                      <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">🏞️</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Active Tours</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.activeTours}</p>
                      <p className="text-xs text-gray-500">of {stats.totalTours} total</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">👥</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Users</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Status Breakdown */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Booking Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">{stats.pendingBookings}</div>
                    <div className="text-sm text-gray-500">Pending Bookings</div>
                    <div className="mt-2 text-xs text-gray-400">
                      Require payment or confirmation
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{stats.confirmedBookings}</div>
                    <div className="text-sm text-gray-500">Confirmed Bookings</div>
                    <div className="mt-2 text-xs text-gray-400">
                      Paid and confirmed
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {stats.confirmedBookings > 0 ? Math.round((stats.confirmedBookings / stats.totalBookings) * 100) : 0}%
                    </div>
                    <div className="text-sm text-gray-500">Conversion Rate</div>
                    <div className="mt-2 text-xs text-gray-400">
                      Confirmed vs total bookings
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Recent Bookings</h2>
                  <Link
                    href="/admin/bookings"
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    View all
                  </Link>
                </div>
              </div>
              <div className="overflow-hidden">
                {stats.recentBookings.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No recent bookings
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {stats.recentBookings.map((booking) => (
                      <div key={booking.id} className="p-6 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">
                                {booking.tour.title}
                              </p>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                {booking.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              Customer: {booking.user.name}
                            </p>
                            <div className="flex justify-between items-center mt-2">
                              <p className="text-sm text-gray-500">
                                {formatDate(booking.createdAt)}
                              </p>
                              <p className="text-sm font-medium text-primary">
                                ${booking.totalPrice}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}