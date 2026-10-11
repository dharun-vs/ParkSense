import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/features/auth/AuthContext'
import { LoginPage } from '@/pages/LoginPage'
import { ProtectedRoute, AdminRoute } from '@/app/router'
import { demoStore } from '@/lib/demoStore'

function renderWithApp(initialEntries = ['/login']) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route
              path="/dashboard"
              element={
                <div>
                  <h1 data-testid="dashboard-heading">Customer Dashboard</h1>
                  <LogoutButton />
                </div>
              }
            />
          </Route>
          <Route element={<AdminRoute />}>
            <Route
              path="/admin"
              element={
                <div>
                  <h1 data-testid="admin-heading">Administrator Dashboard</h1>
                  <LogoutButton />
                </div>
              }
            />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  )
}

function LogoutButton() {
  const { signOut } = useAuth()
  return (
    <button data-testid="logout-button" onClick={() => signOut()}>
      Sign Out
    </button>
  )
}

describe('Auth Regression: Login Redirect Loop & Session Lifecycle', () => {
  beforeEach(() => {
    localStorage.clear()
    demoStore.resetDemoData()
    demoStore.logoutDemo()
  })

  it('unauthenticated users cannot access /dashboard and are redirected to /login', async () => {
    renderWithApp(['/dashboard'])

    await waitFor(() => {
      expect(screen.getByText(/Welcome to ParkSense/i)).toBeInTheDocument()
      expect(screen.queryByTestId('dashboard-heading')).not.toBeInTheDocument()
    })
  })

  it('unauthenticated users cannot access /admin and are redirected to /login', async () => {
    renderWithApp(['/admin'])

    await waitFor(() => {
      expect(screen.getByText(/Welcome to ParkSense/i)).toBeInTheDocument()
      expect(screen.queryByTestId('admin-heading')).not.toBeInTheDocument()
    })
  })

  it('customer logs in with demo credentials and lands directly on /dashboard without redirect loop', async () => {
    const user = userEvent.setup()
    renderWithApp(['/login'])

    // Wait for login page
    await waitFor(() => {
      expect(screen.getByText(/Welcome to ParkSense/i)).toBeInTheDocument()
    })

    // Click Customer demo credentials button
    const customerCard = screen.getByRole('button', { name: /customer/i })
    await user.click(customerCard)

    // Submit form
    const signInBtn = screen.getByRole('button', { name: /sign in/i })
    await user.click(signInBtn)

    // Assert customer lands on dashboard
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-heading')).toBeInTheDocument()
    })

    // Assert session is stored in demoStore and localStorage
    expect(demoStore.getCurrentUser()?.username).toBe('customer')
  })

  it('admin logs in with demo credentials and lands directly on /admin without redirect loop', async () => {
    const user = userEvent.setup()
    renderWithApp(['/login'])

    await waitFor(() => {
      expect(screen.getByText(/Welcome to ParkSense/i)).toBeInTheDocument()
    })

    // Click Admin demo credentials button
    const adminCard = screen.getByRole('button', { name: /admin/i })
    await user.click(adminCard)

    // Submit form
    const signInBtn = screen.getByRole('button', { name: /sign in/i })
    await user.click(signInBtn)

    // Assert admin lands on /admin
    await waitFor(() => {
      expect(screen.getByTestId('admin-heading')).toBeInTheDocument()
    })

    expect(demoStore.getCurrentUser()?.username).toBe('admin')
  })

  it('restores demo session on simulated page reload / refresh', async () => {
    // 1. Simulate existing session in storage
    demoStore.loginDemo('customer')

    // 2. Render fresh component tree at /dashboard
    renderWithApp(['/dashboard'])

    // 3. User session should be restored without bouncing to /login
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-heading')).toBeInTheDocument()
      expect(screen.queryByText(/Welcome to ParkSense/i)).not.toBeInTheDocument()
    })
  })

  it('signing out clears the session and returns user to /login', async () => {
    const user = userEvent.setup()
    demoStore.loginDemo('customer')

    renderWithApp(['/dashboard'])

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-heading')).toBeInTheDocument()
    })

    // Click sign out
    const logoutBtn = screen.getByTestId('logout-button')
    await user.click(logoutBtn)

    // User is returned to login
    await waitFor(() => {
      expect(screen.getByText(/Welcome to ParkSense/i)).toBeInTheDocument()
      expect(screen.queryByTestId('dashboard-heading')).not.toBeInTheDocument()
    })

    // Store is cleared
    expect(demoStore.getCurrentUser()).toBeNull()
  })

  it('customer cannot access /admin and is bounced to /dashboard', async () => {
    demoStore.loginDemo('customer')

    renderWithApp(['/admin'])

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-heading')).toBeInTheDocument()
      expect(screen.queryByTestId('admin-heading')).not.toBeInTheDocument()
    })
  })
})
