'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline'

interface Tour {
  id: string
  title: string
  description: string
  pricePerPerson: number
  durationDays: number
  maxGroupSize: number
  difficulty?: 'easy' | 'medium' | 'hard'
  status: 'active' | 'inactive'
  destination: {
    name: string
    country: string
  }
  createdAt: string
  _count?: {
    bookings: number
  }
}

export default function AdminToursPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const fetchTours = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('status', filter)
      
      const response = await fetch(`/api/admin/tours?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch tours')
      
      const data = await response.json()
      setTours(data.tours || [])
    } catch (err) {
      setError('Failed to load tours')
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
    fetchTours()
  }, [session, status, router, fetchTours])

  const handleStatusToggle = async (tourId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    
    try {
      const response = await fetch(`/api/admin/tours/${tourId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update tour status')
      
      // Refresh tours
      fetchTours()
    } catch (err) {
      alert('Failed to update tour status')
      console.error(err)
    }
  }

  const handleDeleteTour = async (tourId: string) => {
    if (!confirm('Are you sure you want to delete this tour? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/tours/${tourId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete tour')
      
      // Refresh tours
      fetchTours()
    } catch (err) {
      alert('Failed to delete tour')
      console.error(err)
    }
  }

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800'
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
              <h1 className="text-xl font-semibold text-gray-900">Tour Management</h1>
            </div>
            <Link
              href="/admin/tours/new"
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Add New Tour</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              All Tours ({tours.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'active'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'inactive'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>

        {error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchTours}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md"
            >
              Try Again
            </button>
          </div>
        ) : tours.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tours found</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first tour.</p>
            <Link
              href="/admin/tours/new"
              className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-md font-medium"
            >
              Add New Tour
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {tours.map((tour) => (
                <li key={tour.id}>
                  <div className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-gray-900">
                            {tour.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tour.status)}`}>
                              {tour.status}
                            </span>
                            {tour.difficulty && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(tour.difficulty)}`}>
                                {tour.difficulty}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">
                          {tour.destination.name}, {tour.destination.country}
                        </p>
                        
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                          {tour.description}
                        </p>
                        
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <span>${tour.pricePerPerson}/person</span>
                            <span>{tour.durationDays} days</span>
                            <span>Max {tour.maxGroupSize} people</span>
                            <span>{tour._count?.bookings || 0} bookings</span>
                            <span>Created {formatDate(tour.createdAt)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/tours/${tour.id}`}
                              target="_blank"
                              className="text-primary hover:text-primary/80 text-sm font-medium"
                            >
                              View
                            </Link>
                            <Link
                              href={`/admin/tours/${tour.id}/edit`}
                              className="text-primary hover:text-primary/80 text-sm font-medium"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleStatusToggle(tour.id, tour.status)}
                              className="text-yellow-600 hover:text-yellow-500 text-sm font-medium"
                            >
                              {tour.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteTour(tour.id)}
                              className="text-red-600 hover:text-red-500 text-sm font-medium"
                            >
                              Delete
                            </button>
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