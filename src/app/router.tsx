import React from 'react'
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ParkingPage } from '@/pages/ParkingPage'
import { BookingsPage } from '@/pages/BookingsPage'
import { BookingDetailPage } from '@/pages/BookingDetailPage'
import { ActivityPage } from '@/pages/ActivityPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminParkingPage } from '@/pages/admin/AdminParkingPage'
import { AdminBookingsPage } from '@/pages/admin/AdminBookingsPage'
import { AdminAnalyticsPage } from '@/pages/admin/AdminAnalyticsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PageLoading } from '@/components/ui/Feedback'

// Protected Route Guard for logged in users
export const ProtectedRoute: React.FC = () => {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <PageLoading message="Verifying ParkSense credentials…" />
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

// Admin-Only Route Guard
export const AdminRoute: React.FC = () => {
  const { user, isAdmin, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <PageLoading message="Verifying administrator permissions…" />
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

// Root redirect
export const RootRedirect: React.FC = () => {
  const { user, isAdmin, isLoading } = useAuth()
  if (isLoading) return <PageLoading message="Initializing ParkSense…" />
  if (user) {
    return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />
  }
  return <Navigate to="/parking" replace />
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    element: <AppLayout />,
    children: [
      // Public / guest accessible parking browse
      {
        path: '/parking',
        element: <ParkingPage />,
      },
      // Authenticated User Routes
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: '/dashboard',
            element: <DashboardPage />,
          },
          {
            path: '/bookings',
            element: <BookingsPage />,
          },
          {
            path: '/bookings/:id',
            element: <BookingDetailPage />,
          },
          {
            path: '/activity',
            element: <ActivityPage />,
          },
          {
            path: '/profile',
            element: <ProfilePage />,
          },
        ],
      },
      // Administrator Only Routes
      {
        element: <AdminRoute />,
        children: [
          {
            path: '/admin',
            element: <AdminDashboardPage />,
          },
          {
            path: '/admin/parking',
            element: <AdminParkingPage />,
          },
          {
            path: '/admin/bookings',
            element: <AdminBookingsPage />,
          },
          {
            path: '/admin/analytics',
            element: <AdminAnalyticsPage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
