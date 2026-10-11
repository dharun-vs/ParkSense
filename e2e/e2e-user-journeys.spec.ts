import { test, expect } from '@playwright/test'

test.describe('E2E User Journeys: Customer & Administrator Complete Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('Customer Complete Workflow: Check-in, Check-out, Advance Reservation, Activity & Cancellation', async ({ page }) => {
    const pageErrors: Error[] = []
    page.on('pageerror', (err) => pageErrors.push(err))

    // 1. Authenticate as Customer
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible()
    await page.getByRole('button', { name: /Customer/i }).click()
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await page.waitForURL('**/dashboard')

    // 2. Validate Customer Dashboard Metrics
    await expect(page.getByRole('heading', { name: /Good morning, Demo Driver/i })).toBeVisible()
    await expect(page.getByText('TOTAL BAYS')).toBeVisible()
    await expect(page.getByText('Available', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Occupied', { exact: true }).first()).toBeVisible()

    // 3. Navigate to /parking
    await page.getByRole('link', { name: 'Parking', exact: true }).click()
    await page.waitForURL('**/parking')
    await expect(page.getByRole('heading', { name: 'Campus Parking' })).toBeVisible()

    // 4. Floor tab switching
    const level1Tab = page.getByRole('button', { name: /Level 1/i }).first()
    await level1Tab.click()
    await expect(page.getByText('Level 1 — Zone B')).toBeVisible()

    const groundTab = page.getByRole('button', { name: /Ground Floor/i }).first()
    await groundTab.click()
    await expect(page.getByText('Ground Floor — Zone A')).toBeVisible()

    // 5. Check-In to Bay A03 (Available accessible bay)
    const bayA03 = page.getByText('A03', { exact: true }).first()
    await bayA03.click()
    await expect(page.getByRole('heading', { name: 'Bay A03' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Check In' })).toBeVisible()
    await page.getByRole('button', { name: 'Check In' }).click()

    // Verify successful check-in notification and active session banner
    await expect(page.getByText(/Checked in to Bay A03/i)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Find My Car' })).toBeVisible()

    // 6. Check-Out from Bay A03
    await bayA03.click()
    await expect(page.getByRole('button', { name: 'Check Out' })).toBeVisible()
    await page.getByRole('button', { name: 'Check Out' }).click()
    await expect(page.getByText(/Checked out successfully/i)).toBeVisible()

    // 7. Advance Reservation on Bay A05
    const bayA05 = page.getByText('A05', { exact: true }).first()
    await bayA05.click()
    await expect(page.getByRole('heading', { name: 'Bay A05' })).toBeVisible()
    await page.getByRole('button', { name: 'Reserve in Advance' }).click()

    // Fill Advance Reservation details
    await expect(page.getByRole('heading', { name: 'Reserve Bay A05' })).toBeVisible()
    const plateInput = page.getByPlaceholder('e.g. KA-01-AB-1234')
    await plateInput.fill('KA-01-E2E-9999')
    const notesInput = page.getByPlaceholder('e.g. Visiting engineering building')
    await notesInput.fill('Customer Automated E2E Journey')

    await page.getByRole('button', { name: 'Confirm Reservation' }).click()
    await expect(page.getByText('Reservation Confirmed!')).toBeVisible()

    // 8. Verify reservation in /bookings
    await page.waitForTimeout(2200)
    await page.goto('/bookings')
    await expect(page.getByRole('heading', { name: 'Reservations' })).toBeVisible()
    await expect(page.getByText('Bay A05').first()).toBeVisible()
    await expect(page.getByText('KA-01-E2E-9999')).toBeVisible()

    // 9. Verify event in /activity
    await page.goto('/activity')
    await expect(page.getByRole('heading', { name: 'My Activity' })).toBeVisible()
    await expect(page.getByText(/A05/i).first()).toBeVisible()

    // 10. Persistence across page reload
    await page.reload()
    await expect(page.getByRole('heading', { name: 'My Activity' })).toBeVisible()
    await page.goto('/bookings')
    await expect(page.getByText('Bay A05').first()).toBeVisible()

    // 11. Cancel Reservation
    const cancelButton = page.getByRole('button', { name: 'Cancel', exact: true }).first()
    await cancelButton.click()
    await expect(page.getByRole('heading', { name: /Cancel Parking Reservation/i })).toBeVisible()
    await page.getByRole('button', { name: 'Yes, Cancel Reservation' }).click()
    await expect(page.getByText(/cancelled/i).first()).toBeVisible()

    // 12. Logout & Route Guard check
    await page.getByRole('button', { name: 'Sign Out' }).click()
    await page.waitForURL('**/login')
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible()

    // Protected route check
    await page.goto('/dashboard')
    await page.waitForURL('**/login')

    expect(pageErrors).toEqual([])
  })

  test('Administrator Complete Workflow: Dashboard, Simulation, Bay Management & Audit Log', async ({ page }) => {
    const pageErrors: Error[] = []
    page.on('pageerror', (err) => pageErrors.push(err))

    // 1. Authenticate as Administrator
    await page.getByRole('button', { name: /Admin/i }).click()
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await page.waitForURL('**/admin')

    // 2. Administrator Control Center verification
    await expect(page.getByRole('heading', { name: 'Administrator Control Center' })).toBeVisible()
    await expect(page.getByText('Admin Mode')).toBeVisible()
    await expect(page.getByText('Simulate Vehicle Arrival & Departure')).toBeVisible()
    await expect(page.getByRole('heading', { name: /System Activity & Audit Log/i })).toBeVisible()

    // 3. Navigate to Bay Simulator & Inventory (/admin/parking)
    await page.getByRole('link', { name: /Bay Simulator & Inventory/i }).click()
    await page.waitForURL('**/admin/parking')
    await expect(page.getByRole('heading', { name: /Parking Management/i })).toBeVisible()

    // 4. Test Table Filters (Floor, Zone, Search)
    const floorSelect = page.locator('select').first()
    await floorSelect.selectOption('level1')
    await expect(page.getByText('B01').first()).toBeVisible()

    const zoneSelect = page.locator('select').nth(1)
    await zoneSelect.selectOption('B')
    await expect(page.locator('td').filter({ hasText: 'Zone B' }).first()).toBeVisible()

    // Search query test
    const searchInput = page.getByPlaceholder('Search bays...')
    await searchInput.fill('B01')
    await expect(page.getByText('B01', { exact: true })).toBeVisible()
    await searchInput.fill('')

    // Reset filters
    await floorSelect.selectOption('all')
    await zoneSelect.selectOption('all')

    // 5. Test Hardware Sensor Simulation: Arrival on B01
    // Filter to B01 row
    await searchInput.fill('B01')
    const b01Row = page.locator('tr').filter({ hasText: 'B01' })
    const arrivalBtn = b01Row.getByRole('button', { name: 'Arrival' })
    await arrivalBtn.click()

    // Verify B01 reflects Occupied
    await expect(b01Row.getByText('Occupied')).toBeVisible()

    // Test Departure on B01
    const departureBtn = b01Row.getByRole('button', { name: 'Departure' })
    await departureBtn.click()
    await expect(b01Row.getByText('Available')).toBeVisible()
    await searchInput.fill('')

    // 6. Test Bay Deactivation (Toggle Active State)
    await searchInput.fill('B05')
    const b05Row = page.locator('tr').filter({ hasText: 'B05' })
    const toggleBtn = b05Row.locator('button[title="Deactivate bay"]')
    await toggleBtn.click()

    // Confirm dialog
    await expect(page.getByRole('heading', { name: /Deactivate Parking Bay/i })).toBeVisible()
    await page.getByRole('button', { name: 'Deactivate Bay', exact: true }).click()

    // Verify B05 is now Out of Service
    await expect(b05Row.getByText('Out of Service')).toBeVisible()

    // 7. Check persistence after reload
    await page.reload()
    await searchInput.fill('B05')
    await expect(page.locator('tr').filter({ hasText: 'B05' }).getByText('Out of Service')).toBeVisible()

    // Reactivate B05 to clean up state
    const activateBtn = page.locator('tr').filter({ hasText: 'B05' }).locator('button[title="Activate bay"]')
    await activateBtn.click()
    await expect(page.getByRole('heading', { name: /Activate Parking Bay/i })).toBeVisible()
    await page.getByRole('button', { name: 'Activate Bay', exact: true }).click()
    await expect(page.locator('tr').filter({ hasText: 'B05' }).getByText('Available')).toBeVisible()

    // 8. Verify Audit Log recorded actions
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: 'Administrator Control Center' })).toBeVisible()
    await expect(page.getByText(/Slot Deactivated/i).or(page.getByText(/Slot Occupied/i)).first()).toBeVisible()

    // 9. Logout
    await page.getByRole('button', { name: 'Sign Out' }).click()
    await page.waitForURL('**/login')
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible()

    expect(pageErrors).toEqual([])
  })
})
