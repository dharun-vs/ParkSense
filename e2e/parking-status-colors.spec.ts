import { test, expect } from '@playwright/test'

test.describe('Parking Status Colors & Autonomous Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('Mandatory 4 parking status colors render correctly across Floor Parking Layout and Legend', async ({ page }) => {
    // 1. Sign in as Admin to access both views and simulator
    await page.getByRole('button', { name: /Admin/i }).click()
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await page.waitForURL('**/admin**')

    // Navigate to /admin/parking and open Top-Down Lot Visualizer
    await page.goto('/admin/parking')
    await expect(page.getByRole('heading', { name: /Parking Management/i })).toBeVisible()
    await page.getByRole('button', { name: 'Top-Down Lot Visualizer' }).click()

    // 2. Status legend matches exact colors:
    // Available = Green (#16A34A), Occupied = Red (#DC2626), Reserved = Blue (#2563EB), Out of Service = Yellow/Amber (#EAB308)
    const availableLegendDot = page.locator('span[title="#16A34A"]')
    await expect(availableLegendDot.first()).toBeVisible()

    const occupiedLegendDot = page.locator('span[title="#DC2626"]')
    await expect(occupiedLegendDot).toBeVisible()

    const reservedLegendDot = page.locator('span[title="#2563EB"]')
    await expect(reservedLegendDot).toBeVisible()

    const serviceLegendDot = page.locator('span[title="#EAB308"]')
    await expect(serviceLegendDot).toBeVisible()

    // 3. Verify Bay rendering and status attributes
    // Ground floor has initial slots
    const availableBays = page.locator('button[data-status="available"]')
    await expect(availableBays.first()).toBeVisible()

    // Occupied bays must have data-status="occupied" and NEVER data-status="available"
    const occupiedBays = page.locator('button[data-status="occupied"]')
    await expect(occupiedBays.first()).toBeVisible()
    const firstOcc = occupiedBays.first()
    await expect(firstOcc).not.toHaveAttribute('data-status', 'available')

    // Occupied bay must have [#DC2626] red styling
    await expect(firstOcc).toHaveClass(/\[#DC2626\]/)

    // 4. Test state transition: Available -> Occupied turns bay Red immediately without page refresh
    const testSlot = page.locator('button[data-bay="A03"]').first()
    await testSlot.click()

    // Simulator panel
    await expect(page.getByText('Selected Bay')).toBeVisible()
    const markOccupiedBtn = page.getByRole('button', { name: 'Occupied', exact: true })
    await markOccupiedBtn.click()

    // A03 must now have data-status="occupied" and turn Red
    await expect(page.locator('button[data-bay="A03"]')).toHaveAttribute('data-status', 'occupied')

    // Verify A03 is NOT green
    await expect(page.locator('button[data-bay="A03"]')).not.toHaveAttribute('data-status', 'available')

    // 5. Test state transition: Occupied -> Available turns bay Green
    const markAvailableBtn = page.getByRole('button', { name: 'Free', exact: true })
    await markAvailableBtn.click()
    await expect(page.locator('button[data-bay="A03"]')).toHaveAttribute('data-status', 'available')

    // 6. Test state transition: Any -> Maintenance turns bay Yellow
    const markMaintenanceBtn = page.getByRole('button', { name: 'Service', exact: true })
    await markMaintenanceBtn.click()
    await expect(page.locator('button[data-bay="A03"]')).toHaveAttribute('data-status', 'maintenance')

    // 7. Test state transition: Any -> Reserved turns bay Blue
    const markReservedBtn = page.getByRole('button', { name: 'Reserved', exact: true })
    await markReservedBtn.click()
    await expect(page.locator('button[data-bay="A03"]')).toHaveAttribute('data-status', 'reserved')
  })

  test('Occupied bay renders Red in Customer view and synchronizes on departure/arrival', async ({ page }) => {
    // 1. Sign in as Customer
    await page.getByRole('button', { name: /Customer/i }).click()
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await page.waitForURL('**/dashboard')

    // Navigate to /parking
    await page.getByRole('link', { name: 'Parking', exact: true }).click()
    await page.waitForURL('**/parking')

    // Bay A02 is default occupied in demoStore
    const bayA02 = page.locator('button[data-bay="A02"]')
    await expect(bayA02).toHaveAttribute('data-status', 'occupied')
    await expect(bayA02).not.toHaveAttribute('data-status', 'available')

    // Click A02 to inspect detail panel
    await bayA02.click()
    const detailBadge = page.locator('[data-testid="selected-bay-badge"]')
    await expect(detailBadge).toContainText('Occupied')
    await expect(detailBadge).toHaveClass(/badge-red/)

    // Check-in on an available bay (A03)
    const bayA03 = page.locator('button[data-bay="A03"]')
    await expect(bayA03).toHaveAttribute('data-status', 'available')
    await bayA03.click()

    const checkInBtn = page.getByRole('button', { name: 'Check In' })
    await checkInBtn.click()

    // Immediately turns Red (Occupied) in Customer View
    await expect(page.locator('button[data-bay="A03"]')).toHaveAttribute('data-status', 'occupied')
    await expect(page.locator('button[data-bay="A03"]')).not.toHaveAttribute('data-status', 'available')

    // Check-out restores bay to Green (Available)
    await page.locator('button[data-bay="A03"]').click()
    const checkOutBtn = page.getByRole('button', { name: 'Check Out' })
    await checkOutBtn.click()

    await expect(page.locator('button[data-bay="A03"]')).toHaveAttribute('data-status', 'available')
  })

  test('Multi-viewport responsive status color verification (Desktop, Tablet, Mobile)', async ({ page }) => {
    // Viewport matrix
    const viewports = [
      { name: 'Desktop', width: 1440, height: 900 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 390, height: 844 },
    ]

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/parking')

      // Ensure parking floor layout renders
      await expect(page.getByRole('heading', { name: /Parking/i }).first()).toBeVisible()

      // Legend is visible with all 4 items
      await expect(page.getByText('Available', { exact: true }).first()).toBeVisible()
      await expect(page.getByText('Occupied', { exact: true }).first()).toBeVisible()
      await expect(page.getByText('Reserved', { exact: true }).first()).toBeVisible()
      await expect(page.getByText('Out of Service', { exact: true }).first()).toBeVisible()

      // Both available (green) and occupied (red) bays exist and have consistent styling
      const availBays = page.locator('button[data-status="available"]')
      const occBays = page.locator('button[data-status="occupied"]')

      await expect(availBays.first()).toBeVisible()
      await expect(occBays.first()).toBeVisible()
      await expect(occBays.first()).not.toHaveAttribute('data-status', 'available')

      // Capture screenshot for visual inspection
      await page.screenshot({
        path: `test-results/screenshots/status-colors-${vp.name.toLowerCase()}.png`,
        fullPage: true,
      })
    }
  })
})
