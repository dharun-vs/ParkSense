import { test, expect } from '@playwright/test'

test.describe('Parking Bay Management & Advance Reservation Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    // Log in as customer
    await page.goto('/login')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.getByRole('button', { name: /Customer/i }).click()
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL('**/dashboard')
  })

  test('switches floor tabs and updates bay view accurately', async ({ page }) => {
    const pageErrors: Error[] = []
    page.on('pageerror', (err) => pageErrors.push(err))

    await page.goto('/parking')
    await expect(page.getByRole('heading', { name: 'Campus Parking' })).toBeVisible()

    // Default is Ground Floor
    await expect(page.getByText('Ground Floor — Zone A')).toBeVisible()

    // Switch to Level 1
    const level1Tab = page.getByRole('button', { name: /Level 1/i }).first()
    await level1Tab.click()
    await expect(page.getByText('Level 1 — Zone B')).toBeVisible()
    await expect(page.getByText('B01', { exact: true }).first()).toBeVisible()

    // Switch to Level 2
    const level2Tab = page.getByRole('button', { name: /Level 2/i }).first()
    await level2Tab.click()
    await expect(page.getByText('Level 2 — Zone C')).toBeVisible()
    await expect(page.getByText('C01', { exact: true }).first()).toBeVisible()

    expect(pageErrors).toEqual([])
  })

  test('creates an advance reservation with vehicle plate and validates lifecycle transitions', async ({ page }) => {
    const pageErrors: Error[] = []
    page.on('pageerror', (err) => pageErrors.push(err))

    await page.goto('/parking')

    // Find and select an available bay (A01)
    const bayA01 = page.getByText('A01', { exact: true }).first()
    await bayA01.click()

    // Bay Inspector opens on the right side
    await expect(page.getByRole('heading', { name: 'Bay A01' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reserve in Advance' })).toBeVisible()

    // Open Advance Reservation Modal
    await page.getByRole('button', { name: 'Reserve in Advance' }).click()
    await expect(page.getByRole('heading', { name: 'Reserve Bay A01' })).toBeVisible()

    // Fill vehicle registration plate and notes
    const plateInput = page.getByPlaceholder('e.g. KA-01-AB-1234')
    await plateInput.fill('KA-05-PS-2026')

    const notesInput = page.getByPlaceholder('e.g. Visiting engineering building')
    await notesInput.fill('E2E Automated Test Reservation')

    // Capture screenshot of reservation modal
    await page.screenshot({ path: 'test-results/screenshots/03-reserve-bay-modal.png' })

    // Submit reservation
    await page.getByRole('button', { name: 'Confirm Reservation' }).click()

    // Verify success modal feedback
    await expect(page.getByText('Reservation Confirmed!')).toBeVisible()

    // Wait for modal to auto-close and navigate to /bookings
    await page.waitForTimeout(1500)
    await page.goto('/bookings')

    // Verify booking is listed
    await expect(page.getByRole('heading', { name: 'Reservations' })).toBeVisible()
    await expect(page.getByText('Bay A01').first()).toBeVisible()
    await expect(page.getByText('KA-05-PS-2026')).toBeVisible()

    // Capture screenshot of bookings page
    await page.screenshot({ path: 'test-results/screenshots/04-bookings-list.png', fullPage: true })

    // Test cancellation flow on the booking card (exact button name prevents matching filter tabs)
    const cancelButton = page.getByRole('button', { name: 'Cancel', exact: true }).first()
    await cancelButton.click()

    // Confirm cancel in confirmation dialog
    await expect(page.getByRole('heading', { name: /Cancel Parking Reservation/i })).toBeVisible()
    await page.getByRole('button', { name: 'Yes, Cancel Reservation' }).click()

    // Check cancellation feedback notification
    await expect(page.getByText(/cancelled/i).first()).toBeVisible()

    expect(pageErrors).toEqual([])
  })
})
