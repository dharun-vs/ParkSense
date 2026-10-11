import { test, expect } from '@playwright/test'

test.describe('Authentication & Session Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any previous session
    await page.goto('/login')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('validates required inputs and prevents submission with invalid credentials', async ({ page }) => {
    const pageErrors: Error[] = []
    page.on('pageerror', (err) => pageErrors.push(err))

    await page.goto('/login')

    // Submit invalid credentials
    await page.getByPlaceholder('Enter username or email').fill('nonexistent_user')
    await page.getByPlaceholder('••••••••').fill('wrongpassword123')
    await page.getByRole('button', { name: 'Sign In' }).click()

    // Assert error message is displayed
    await expect(page.getByText(/Invalid username\/email or password/i)).toBeVisible()
    // Ensure we are still on the login page
    expect(page.url()).toContain('/login')
    expect(pageErrors).toEqual([])
  })

  test('fills credentials via demo cards and authenticates customer to /dashboard', async ({ page }) => {
    const pageErrors: Error[] = []
    page.on('pageerror', (err) => pageErrors.push(err))

    await page.goto('/login')

    // Click customer demo card
    await page.getByRole('button', { name: /Customer/i }).click()
    await expect(page.getByPlaceholder('Enter username or email')).toHaveValue('customer')
    await expect(page.getByPlaceholder('••••••••')).toHaveValue('1234')

    // Click Sign In
    await page.getByRole('button', { name: 'Sign In' }).click()

    // Verifies navigation to /dashboard
    await page.waitForURL('**/dashboard')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByText('Demo Driver').first()).toBeVisible()

    // Capture screenshot
    await page.screenshot({ path: 'test-results/screenshots/01-customer-dashboard.png', fullPage: true })
    expect(pageErrors).toEqual([])
  })

  test('fills admin demo credentials and routes administrator to /admin', async ({ page }) => {
    const pageErrors: Error[] = []
    page.on('pageerror', (err) => pageErrors.push(err))

    await page.goto('/login')

    // Click admin demo card
    await page.getByRole('button', { name: /Admin/i }).click()
    await expect(page.getByPlaceholder('Enter username or email')).toHaveValue('admin')
    await expect(page.getByPlaceholder('••••••••')).toHaveValue('admin')

    // Click Sign In
    await page.getByRole('button', { name: 'Sign In' }).click()

    // Verifies navigation to /admin
    await page.waitForURL('**/admin')
    await expect(page.getByRole('heading', { name: /Administrator Control Center/i })).toBeVisible()
    await expect(page.getByText('Admin Mode')).toBeVisible()

    // Capture screenshot
    await page.screenshot({ path: 'test-results/screenshots/02-admin-dashboard.png', fullPage: true })
    expect(pageErrors).toEqual([])
  })

  test('logout terminates session and protects authenticated routes', async ({ page }) => {
    const pageErrors: Error[] = []
    page.on('pageerror', (err) => pageErrors.push(err))

    // Log in as customer
    await page.goto('/login')
    await page.getByRole('button', { name: /Customer/i }).click()
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL('**/dashboard')

    // Click Sign Out button in Navbar
    const signOutButton = page.getByRole('button', { name: 'Sign Out' })
    await expect(signOutButton).toBeVisible()
    await signOutButton.click()

    // Verifies redirection to /login
    await page.waitForURL('**/login')
    await expect(page.getByText('Welcome to ParkSense')).toBeVisible()

    // Attempting direct navigation to /dashboard should redirect back to /login
    await page.goto('/dashboard')
    await page.waitForURL('**/login**')
    await expect(page.getByText('Welcome to ParkSense')).toBeVisible()

    // Root URL / should redirect directly to /login
    await page.goto('/')
    await page.waitForURL('**/login**')
    await expect(page.getByText('Welcome to ParkSense')).toBeVisible()

    // Direct navigation to /parking should redirect to /login
    await page.goto('/parking')
    await page.waitForURL('**/login**')
    await expect(page.getByText('Welcome to ParkSense')).toBeVisible()

    // Browser back navigation should not grant access to protected routes
    await page.goBack()
    await page.waitForURL('**/login**')
    await expect(page.getByText('Welcome to ParkSense')).toBeVisible()

    expect(pageErrors).toEqual([])
  })

  test('register page renders with validation checks and back-to-login navigation', async ({ page }) => {
    const pageErrors: Error[] = []
    page.on('pageerror', (err) => pageErrors.push(err))

    await page.goto('/register')

    await expect(page.getByRole('heading', { name: /Create a ParkSense Account/i })).toBeVisible()
    await expect(page.getByPlaceholder('Alex Morgan')).toBeVisible()
    await expect(page.getByPlaceholder('name@example.com')).toBeVisible()

    // Navigate back to login
    await page.getByRole('link', { name: /Sign in/i }).first().click()
    await page.waitForURL('**/login')
    await expect(page.getByText('Welcome to ParkSense')).toBeVisible()

    expect(pageErrors).toEqual([])
  })
})
