import { test, expect } from '@playwright/test'

test.describe('Navigation, Responsive Layouts & Routing', () => {
  test('navigates through all customer portal pages without errors', async ({ page }) => {
    const pageErrors: Error[] = []
    page.on('pageerror', (err) => pageErrors.push(err))

    // Log in as customer
    await page.goto('/login')
    await page.getByRole('button', { name: /Customer/i }).click()
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL('**/dashboard')

    // 1. Dashboard
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    // 2. Parking
    await page.getByRole('link', { name: 'Parking', exact: true }).click()
    await page.waitForURL('**/parking')
    await expect(page.getByRole('heading', { name: 'Campus Parking' })).toBeVisible()

    // 3. Bookings
    await page.getByRole('link', { name: 'Reservations', exact: true }).click()
    await page.waitForURL('**/bookings')
    await expect(page.getByRole('heading', { name: 'Reservations', exact: true })).toBeVisible()

    // 4. Activity
    await page.getByRole('link', { name: 'My Activity', exact: true }).click()
    await page.waitForURL('**/activity')
    await expect(page.getByRole('heading', { name: 'My Activity' })).toBeVisible()

    // 5. Profile
    await page.getByRole('link', { name: 'Profile', exact: true }).click()
    await page.waitForURL('**/profile')
    await expect(page.getByRole('heading', { name: /User Account & Profile/i })).toBeVisible()

    expect(pageErrors).toEqual([])
  })

  test('navigates through all administrator control pages', async ({ page }) => {
    const pageErrors: Error[] = []
    page.on('pageerror', (err) => pageErrors.push(err))

    // Log in as admin
    await page.goto('/login')
    await page.getByRole('button', { name: /Admin/i }).click()
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL('**/admin')

    // 1. Facility Overview
    await expect(page.getByRole('heading', { name: /Administrator Control Center/i })).toBeVisible()

    // 2. Bay Simulator & Inventory
    await page.getByRole('link', { name: 'Bay Simulator & Inventory' }).click()
    await page.waitForURL('**/admin/parking')
    await expect(page.getByRole('heading', { name: /Bay Management & Sensor Simulator/i })).toBeVisible()

    // 3. All Reservations
    await page.getByRole('link', { name: 'All Reservations' }).click()
    await page.waitForURL('**/admin/bookings')
    await expect(page.getByRole('heading', { name: /Facility Reservation Management/i })).toBeVisible()

    // 4. Facility Analytics
    await page.getByRole('link', { name: 'Facility Analytics' }).click()
    await page.waitForURL('**/admin/analytics')
    await expect(page.getByRole('heading', { name: /Facility Analytics & Intelligence/i })).toBeVisible()

    expect(pageErrors).toEqual([])
  })

  test('displays responsive layout across tablet and mobile viewports', async ({ page }) => {
    const pageErrors: Error[] = []
    page.on('pageerror', (err) => pageErrors.push(err))

    // 1. Mobile viewport (iPhone SE: 375x667)
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/login')

    // On mobile, login page stacks and shows mobile header
    await expect(page.getByText('Welcome to ParkSense')).toBeVisible()
    await page.screenshot({ path: 'test-results/screenshots/05-mobile-login.png' })

    // Log in on mobile
    await page.getByRole('button', { name: /Customer/i }).click()
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL('**/dashboard')

    // Mobile Navbar toggle button should be visible
    const menuButton = page.getByRole('button', { name: 'Toggle Navigation' })
    await expect(menuButton).toBeVisible()

    // Open mobile sidebar drawer
    await menuButton.click()

    // Drawer should show navigation links
    const drawerLink = page.getByRole('link', { name: 'Parking', exact: true })
    await expect(drawerLink).toBeVisible()
    await page.screenshot({ path: 'test-results/screenshots/06-mobile-drawer.png' })

    // Click link inside drawer
    await drawerLink.click()
    await page.waitForURL('**/parking')
    await expect(page.getByRole('heading', { name: 'Campus Parking' })).toBeVisible()

    // 2. Tablet viewport (iPad Mini: 768x1024)
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.screenshot({ path: 'test-results/screenshots/07-tablet-parking.png' })
    await expect(page.getByRole('heading', { name: 'Campus Parking' })).toBeVisible()

    expect(pageErrors).toEqual([])
  })

  test('handles 404 not found page cleanly with return navigation', async ({ page }) => {
    const pageErrors: Error[] = []
    page.on('pageerror', (err) => pageErrors.push(err))

    await page.goto('/this-route-does-not-exist')

    // Checks 404 page presentation
    await expect(page.getByText('404')).toBeVisible()
    await expect(page.getByText('Page Not Found')).toBeVisible()

    // Click Return Home button
    const returnButton = page.getByRole('button', { name: 'Go to Dashboard' })
    await returnButton.click()

    // Verifies navigation away from 404
    expect(page.url()).not.toContain('/this-route-does-not-exist')
    expect(pageErrors).toEqual([])
  })
})
