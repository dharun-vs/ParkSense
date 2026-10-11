import { describe, it, expect, beforeEach } from 'vitest'
import { demoStore, INITIAL_SEEDED_SLOTS } from '@/lib/demoStore'
import { resolveLoginIdentifier, DEMO_ACCOUNTS, signIn } from '@/features/auth/authService'

describe('End-to-End User Journeys & Business Logic Overhaul', () => {
  beforeEach(() => {
    demoStore.resetDemoData()
    demoStore.logoutDemo()
  })

  // 1. Login form & resolution
  it('Journey 1 & 2: Username-to-account resolution accurately handles demo accounts and standard emails', () => {
    expect(resolveLoginIdentifier('admin')).toBe(DEMO_ACCOUNTS.admin.email)
    expect(resolveLoginIdentifier('ADMIN')).toBe(DEMO_ACCOUNTS.admin.email)
    expect(resolveLoginIdentifier('  customer  ')).toBe(DEMO_ACCOUNTS.customer.email)
    expect(resolveLoginIdentifier('user@domain.com')).toBe('user@domain.com')
  })

  // 3 & 4. Successful demo authentication & role-based redirects
  it('Journey 3 & 4: Admin and Customer authenticate with required credentials and map to correct roles', async () => {
    // Admin login
    const adminRes = await signIn('admin', 'admin')
    expect(adminRes.profile?.role).toBe('admin')
    expect(DEMO_ACCOUNTS.admin.defaultPath).toBe('/admin')

    // Customer login
    const customerRes = await signIn('customer', '1234')
    expect(customerRes.profile?.role).toBe('user')
    expect(DEMO_ACCOUNTS.customer.defaultPath).toBe('/dashboard')
  })

  it('Journey 4 (Security): Invalid credentials fail with generic confidentiality error', async () => {
    await expect(signIn('admin', 'wrong_pass')).rejects.toThrow(
      'Invalid username/email or password. Please try again.'
    )
    await expect(signIn('unknown_user', '1234')).rejects.toThrow(
      'Invalid username/email or password. Please try again.'
    )
  })

  // 7, 8, 9. Bay reservation rules & updates
  it('Journey 7 & 9: Available bays can be reserved and update the bay status and booking list', () => {
    demoStore.loginDemo('customer')
    const availableSlot = demoStore.getSlots().find((s) => s.is_active && s.occupancy_status === 'available')!
    expect(availableSlot).toBeDefined()

    const futureStart = new Date(Date.now() + 3600000).toISOString()
    const futureEnd = new Date(Date.now() + 7200000).toISOString()

    const booking = demoStore.createBooking({
      parking_slot_id: availableSlot.id,
      start_time: futureStart,
      end_time: futureEnd,
      vehicle_plate: 'KA-01-AB-9999',
    })

    expect(booking.status).toBe('confirmed')
    expect(booking.vehicle_plate).toBe('KA-01-AB-9999')

    // Verify slot status updated to reserved
    const updatedSlot = demoStore.getSlotById(availableSlot.id)!
    expect(updatedSlot.occupancy_status).toBe('reserved')

    // Verify in user bookings
    const bookings = demoStore.getBookings('demo-customer-id')
    expect(bookings.some((b) => b.id === booking.id)).toBe(true)
  })

  it('Journey 8: Occupied or Inactive bays cannot be reserved', () => {
    demoStore.loginDemo('customer')
    const maintenanceSlot = demoStore.getSlots().find((s) => !s.is_active)!
    expect(maintenanceSlot).toBeDefined()

    const futureStart = new Date(Date.now() + 3600000).toISOString()
    const futureEnd = new Date(Date.now() + 7200000).toISOString()

    expect(() =>
      demoStore.createBooking({
        parking_slot_id: maintenanceSlot.id,
        start_time: futureStart,
        end_time: futureEnd,
      })
    ).toThrow('Parking bay is currently out of service')
  })

  // 10. Cancellation lifecycle
  it('Journey 10: Cancellation updates the booking and restores bay availability', () => {
    demoStore.loginDemo('customer')
    const slot = demoStore.getSlots().find((s) => s.is_active && s.occupancy_status === 'available')!
    const futureStart = new Date(Date.now() + 3600000).toISOString()
    const futureEnd = new Date(Date.now() + 7200000).toISOString()

    const booking = demoStore.createBooking({
      parking_slot_id: slot.id,
      start_time: futureStart,
      end_time: futureEnd,
    })

    expect(demoStore.getSlotById(slot.id)?.occupancy_status).toBe('reserved')

    // Cancel booking
    demoStore.cancelBooking(booking.id)

    // Booking status updated
    expect(demoStore.getBookingById(booking.id)?.status).toBe('cancelled')

    // Bay restored to available
    expect(demoStore.getSlotById(slot.id)?.occupancy_status).toBe('available')
  })

  // 11. Concurrency / Double-booking prevention
  it('Journey 11: Conflicting overlapping reservations for the same bay are strictly rejected', () => {
    demoStore.loginDemo('customer')
    const slot = demoStore.getSlots().find((s) => s.is_active && s.occupancy_status === 'available')!
    const start1 = new Date(Date.now() + 3600000 * 2).toISOString()
    const end1 = new Date(Date.now() + 3600000 * 4).toISOString()

    // First reservation succeeds
    demoStore.createBooking({
      parking_slot_id: slot.id,
      start_time: start1,
      end_time: end1,
    })

    // Conflicting reservation (overlaps with window)
    const conflictingStart = new Date(Date.now() + 3600000 * 3).toISOString()
    const conflictingEnd = new Date(Date.now() + 3600000 * 5).toISOString()

    expect(() =>
      demoStore.createBooking({
        parking_slot_id: slot.id,
        start_time: conflictingStart,
        end_time: conflictingEnd,
      })
    ).toThrow('This parking space has already been reserved for the requested time window.')
  })

  // 12. Security: User cannot cancel another user's booking
  it("Journey 12: Customer cannot cancel another user's booking unless administrator", () => {
    // Customer 1 creates booking
    demoStore.loginDemo('customer')
    const slot = demoStore.getSlots().find((s) => s.is_active && s.occupancy_status === 'available')!
    const booking = demoStore.createBooking({
      parking_slot_id: slot.id,
      start_time: new Date(Date.now() + 3600000 * 2).toISOString(),
      end_time: new Date(Date.now() + 3600000 * 4).toISOString(),
    })

    // Simulate another customer logged in
    demoStore.logoutDemo()
    // Override current user to another driver
    ;(demoStore as any).currentUser = {
      id: 'other-driver-id',
      display_name: 'Other Driver',
      username: 'other',
      role: 'user',
    }

    expect(() => demoStore.cancelBooking(booking.id)).toThrow('Unauthorized to cancel this booking')

    // Administrator CAN cancel any booking for management
    demoStore.loginDemo('admin')
    expect(() => demoStore.cancelBooking(booking.id)).not.toThrow()
    expect(demoStore.getBookingById(booking.id)?.status).toBe('cancelled')
  })

  // Admin status simulation
  it('Admin Simulator: Administrator can update bay occupancy in real time', () => {
    demoStore.loginDemo('admin')
    const slot = demoStore.getSlots().find((s) => s.label === 'A01')!
    expect(slot.occupancy_status).toBe('available')

    // Simulate Arrival
    demoStore.updateSlotStatus(slot.id, 'occupied')
    expect(demoStore.getSlotById(slot.id)?.occupancy_status).toBe('occupied')

    // Simulate Departure
    demoStore.updateSlotStatus(slot.id, 'available')
    expect(demoStore.getSlotById(slot.id)?.occupancy_status).toBe('available')
  })
})
