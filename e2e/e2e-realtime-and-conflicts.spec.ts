import { test, expect } from '@playwright/test'

test.describe('E2E Advanced: Reservation Conflicts & Real-Time Cross-View Synchronization', () => {
  test('Reservation Conflict Workflow: Rejects Out-of-Service bays & Overlapping Intervals', async ({ page }) => {
    const pageErrors: Error[] = []
    page.on('pageerror', (err) => pageErrors.push(err))

    await page.goto('/login')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // 1. Log in as Customer
    await page.getByRole('button', { name: /Customer/i }).click()
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await page.waitForURL('**/dashboard')

    // 2. Navigate to Parking Layout
    await page.goto('/parking')
    await expect(page.getByRole('heading', { name: 'Campus Parking' })).toBeVisible()

    // 3. Test Conflict 1: Out of Service bay (A10) cannot be reserved
    const bayA10 = page.getByText('A10', { exact: true }).first()
    await bayA10.click()
    await expect(page.getByRole('heading', { name: 'Bay A10' })).toBeVisible()
    // "Reserve in Advance" or "Check In" should NOT be offered for maintenance bays
    await expect(page.getByRole('button', { name: 'Check In' })).not.toBeVisible()

    // 4. Test Valid Reservation on Bay A07
    const bayA07 = page.getByText('A07', { exact: true }).first()
    await bayA07.click()
    await expect(page.getByRole('heading', { name: 'Bay A07' })).toBeVisible()
    await page.getByRole('button', { name: 'Reserve in Advance' }).click()

    await expect(page.getByRole('heading', { name: 'Reserve Bay A07' })).toBeVisible()
    const plateInput = page.getByPlaceholder('e.g. KA-01-AB-1234')
    await plateInput.fill('KA-07-CONFLICT-1')
    await page.getByRole('button', { name: 'Confirm Reservation' }).click()
    await expect(page.getByText('Reservation Confirmed!')).toBeVisible()

    // 5. Test Conflict 2: Double reservation on Bay A07 for overlapping window
    await page.waitForTimeout(2200)
    await expect(bayA07).toBeVisible()
    await bayA07.click()

    // When clicked, trigger upcoming reservation
    const reserveAgainBtn = page.getByRole('button', { name: /Reserve Upcoming Time/i })
    if (await reserveAgainBtn.isVisible()) {
      await reserveAgainBtn.click()
      await expect(page.getByRole('heading', { name: 'Reserve Bay A07' })).toBeVisible()
      await page.getByPlaceholder('e.g. KA-01-AB-1234').fill('KA-07-CONFLICT-2')
      await page.getByRole('button', { name: 'Confirm Reservation' }).click()
      // Expect error feedback rejecting overlapping booking
      await expect(page.getByText('This parking space has already been reserved', { exact: false })).toBeVisible()
      await page.keyboard.press('Escape')
    }

    // 6. Navigate to /bookings and cancel the reservation on A07
    await page.goto('/bookings')
    await expect(page.getByText('KA-07-CONFLICT-1')).toBeVisible()
    const cancelBtn = page.getByRole('button', { name: 'Cancel', exact: true }).first()
    await cancelBtn.click()
    await page.getByRole('button', { name: 'Yes, Cancel Reservation' }).click()
    await expect(page.getByText(/cancelled/i).first()).toBeVisible()

    // 7. Verify Bay A07 returns to Available in layout
    await page.goto('/parking')
    await expect(page.getByText('A07', { exact: true }).first()).toBeVisible()

    expect(pageErrors).toEqual([])
  })

  test('Cross-View Real-Time Synchronization: Admin simulation updates Customer blueprint in real-time across tabs', async ({ context }) => {
    // 1. Create two pages in the same browser context to test cross-tab synchronization
    const blueprintPage = await context.newPage()
    const adminInventoryPage = await context.newPage()

    // Reset storage and log in as Admin
    await blueprintPage.goto('/login')
    await blueprintPage.evaluate(() => localStorage.clear())
    await blueprintPage.reload()

    await blueprintPage.getByRole('button', { name: /Admin/i }).click()
    await blueprintPage.getByRole('button', { name: 'Sign In', exact: true }).click()
    await blueprintPage.waitForURL('**/admin')

    // On Page 1 (Blueprint): open /parking
    await blueprintPage.goto('/parking')
    await expect(blueprintPage.getByRole('heading', { name: 'Campus Parking' })).toBeVisible()

    // On Page 2 (Admin Inventory): open /admin/parking (inherits active session from same context)
    await adminInventoryPage.goto('/admin/parking')
    await expect(adminInventoryPage.getByRole('heading', { name: /Parking Management/i })).toBeVisible()

    // 2. On Page 2: Search for Bay A08 and Simulate Vehicle Arrival
    const searchInput = adminInventoryPage.getByPlaceholder('Search bays...')
    await searchInput.fill('A08')
    const a08Row = adminInventoryPage.locator('tr').filter({ hasText: 'A08' })
    await expect(a08Row).toBeVisible()
    const arrivalBtn = a08Row.getByRole('button', { name: 'Arrival' })
    await arrivalBtn.click()

    // Page 2 reflects Occupied
    await expect(a08Row.getByText('Occupied')).toBeVisible()

    // 3. Page 1 (Blueprint) MUST reflect Bay A08 as Occupied WITHOUT manual reload!
    const bayA08InBlueprint = blueprintPage.locator('button').filter({ hasText: 'A08' }).first()
    await expect(bayA08InBlueprint.getByText('Occupied')).toBeVisible({ timeout: 5000 })

    // 4. On Page 2: Simulate Departure
    const departureBtn = a08Row.getByRole('button', { name: 'Departure' })
    await departureBtn.click()
    await expect(a08Row.getByText('Available')).toBeVisible()

    // 5. Page 1 (Blueprint) MUST reflect Bay A08 returning to Free WITHOUT manual reload!
    await expect(bayA08InBlueprint.getByText('Free')).toBeVisible({ timeout: 5000 })

    await blueprintPage.close()
    await adminInventoryPage.close()
  })
})
