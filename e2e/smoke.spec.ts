import { test, expect } from '@playwright/test'

test.describe('ParkSense End-to-End Smoke Tests', () => {
  test('application loads login page with official ParkSense branding and zero uncaught errors', async ({ page }) => {
    const pageErrors: Error[] = []
    const consoleErrors: string[] = []

    page.on('pageerror', (err) => {
      pageErrors.push(err)
    })

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        // Exclude benign missing favicon or intentional development notices if any
        consoleErrors.push(msg.text())
      }
    })

    // Navigate to Root URL / — must display Login immediately
    await page.goto('/')
    await page.waitForURL('**/login')

    // Wait for main brand header to be visible
    await expect(page.getByText('Welcome to ParkSense')).toBeVisible()
    await expect(page.getByText('Intelligent Parking Architecture & Real-Time Bays')).toBeVisible()

    // Verify demo access options exist
    await expect(page.getByRole('button', { name: /Admin/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Customer/i })).toBeVisible()

    // Verify form elements exist
    await expect(page.getByPlaceholder('Enter username or email')).toBeVisible()
    await expect(page.getByPlaceholder('••••••••')).toBeVisible()
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible()

    // Verify no uncaught runtime page errors occurred
    expect(pageErrors).toEqual([])
  })

  test('customer demo authentication lands on dashboard with real facility metrics', async ({ page }) => {
    const pageErrors: Error[] = []
    page.on('pageerror', (err) => pageErrors.push(err))

    await page.goto('/login')

    // Click customer demo button
    await page.getByRole('button', { name: /Customer/i }).click()

    // Form inputs should be filled
    await expect(page.getByPlaceholder('Enter username or email')).toHaveValue('customer')

    // Submit login
    await page.getByRole('button', { name: /Sign In/i }).click()

    // Must navigate to Dashboard
    await page.waitForURL('**/dashboard')

    // Verify dashboard metrics and floor overview
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByText('Total Bays')).toBeVisible()
    await expect(page.getByText('Available', { exact: true })).toBeVisible()
    await expect(page.getByText('Campus Parking — Floor Availability')).toBeVisible()

    // Verify no uncaught runtime page errors occurred
    expect(pageErrors).toEqual([])
  })

  test('parking layout renders floor plans and bay selectors seamlessly for authenticated customer', async ({ page }) => {
    const pageErrors: Error[] = []
    page.on('pageerror', (err) => pageErrors.push(err))

    // Authenticate as customer
    await page.goto('/login')
    await page.getByRole('button', { name: /Customer/i }).click()
    await page.getByRole('button', { name: /Sign In/i }).click()
    await page.waitForURL('**/dashboard')

    // Navigate to parking browser page
    await page.goto('/parking')

    // Check facility floor indicators
    await expect(page.getByText('Ground Floor — Zone A')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Campus Parking' })).toBeVisible()

    // Check legend / status indicators exist
    await expect(page.getByText('Available').first()).toBeVisible()
    await expect(page.getByText('Occupied').first()).toBeVisible()

    // Verify no uncaught page errors
    expect(pageErrors).toEqual([])
  })
})
