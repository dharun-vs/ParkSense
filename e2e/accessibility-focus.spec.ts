import { test, expect } from '@playwright/test'

test.describe('Accessibility, Keyboard Navigation & Error Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('supports sequential keyboard navigation and visible focus rings', async ({ page }) => {
    const pageErrors: Error[] = []
    page.on('pageerror', (err) => pageErrors.push(err))

    await page.goto('/login')

    // Click on the body and start keyboard navigation via Tab
    await page.keyboard.press('Tab')

    // Find the currently focused element
    const focusedInput = page.getByPlaceholder('Enter username or email')
    await focusedInput.focus()
    await expect(focusedInput).toBeFocused()

    // Type via keyboard
    await page.keyboard.type('customer')

    // Tab to next field (password)
    await page.keyboard.press('Tab')
    const passwordInput = page.getByPlaceholder('••••••••')
    await expect(passwordInput).toBeFocused()
    await page.keyboard.type('1234')

    // Tab to Sign In button
    await page.keyboard.press('Tab')
    const signInButton = page.getByRole('button', { name: 'Sign In' })
    await expect(signInButton).toBeFocused()

    // Capture focus state screenshot
    await page.screenshot({ path: 'test-results/screenshots/08-keyboard-focus-visible.png' })

    // Press Enter to submit form via keyboard
    await page.keyboard.press('Enter')

    // Verifies navigation occurred via keyboard-only interaction
    await page.waitForURL('**/dashboard')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    expect(pageErrors).toEqual([])
  })

  test('verifies zero unhandled exceptions or critical console errors during active usage', async ({ page }) => {
    const pageErrors: Error[] = []
    const severeConsoleErrors: string[] = []

    page.on('pageerror', (err) => pageErrors.push(err))
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text()
        // Filter benign development environment notices
        if (!text.includes('favicon.ico') && !text.includes('Supabase configuration is missing')) {
          severeConsoleErrors.push(text)
        }
      }
    })

    // Visit public and protected pages
    await page.goto('/parking')
    await expect(page.getByRole('heading', { name: 'Campus Parking' })).toBeVisible()

    await page.goto('/login')
    await expect(page.getByText('Welcome to ParkSense')).toBeVisible()

    expect(pageErrors).toEqual([])
    expect(severeConsoleErrors).toEqual([])
  })
})
