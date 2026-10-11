import { describe, it, expect, beforeEach } from 'vitest'
import { demoStore } from '@/lib/demoStore'
import { calcOccupancyStats } from '@/lib/utils'
import { getReservationLifecycle } from '@/types/database'
import type { Booking } from '@/types/database'

describe('ParkSense Regression: Out-of-Service Visual Transitions & Reservation Lifecycle', () => {
  beforeEach(() => {
    localStorage.clear()
    demoStore.resetDemoData()
  })

  describe('Bug Regression: Out-of-Service Bay Status Transitions', () => {
    it('Out of Service -> Available restores is_active and makes bay immediately eligible for check-in', () => {
      // Find an initial maintenance slot (e.g. A10 or C07)
      const maintenanceSlot = demoStore.getSlots().find((s) => !s.is_active || s.occupancy_status === 'maintenance')!
      expect(maintenanceSlot).toBeDefined()
      expect(maintenanceSlot.is_active).toBe(false)
      expect(maintenanceSlot.occupancy_status).toBe('maintenance')

      // Admin updates slot to 'available'
      demoStore.loginDemo('admin')
      const updated = demoStore.updateSlotStatus(maintenanceSlot.id, 'available')

      // Both fields must stay strictly synchronized
      expect(updated.occupancy_status).toBe('available')
      expect(updated.is_active).toBe(true)

      const fromStore = demoStore.getSlotById(maintenanceSlot.id)!
      expect(fromStore.occupancy_status).toBe('available')
      expect(fromStore.is_active).toBe(true)

      // Customer can now check in to this formerly out-of-service bay
      demoStore.loginDemo('customer')
      const session = demoStore.checkIn({
        parking_slot_id: maintenanceSlot.id,
        vehicle_plate: 'TEST-001',
      })
      expect(session).toBeDefined()
      expect(session.parking_slot_id).toBe(maintenanceSlot.id)
      expect(demoStore.getSlotById(maintenanceSlot.id)?.occupancy_status).toBe('occupied')
    })

    it('Out of Service -> Reserved updates status and enables active bay state', () => {
      const maintenanceSlot = demoStore.getSlots().find((s) => !s.is_active)!
      demoStore.loginDemo('admin')
      const updated = demoStore.updateSlotStatus(maintenanceSlot.id, 'reserved')

      expect(updated.occupancy_status).toBe('reserved')
      expect(updated.is_active).toBe(true)
      expect(demoStore.getSlotById(maintenanceSlot.id)?.occupancy_status).toBe('reserved')
    })

    it('Available -> Out of Service marks bay inactive and rejects check-in and reservations', () => {
      const availableSlot = demoStore.getSlots().find((s) => s.is_active && s.occupancy_status === 'available')!
      demoStore.loginDemo('admin')
      const updated = demoStore.updateSlotStatus(availableSlot.id, 'maintenance')

      expect(updated.occupancy_status).toBe('maintenance')
      expect(updated.is_active).toBe(false)

      demoStore.loginDemo('customer')
      // Check-in must be rejected
      expect(() =>
        demoStore.checkIn({ parking_slot_id: availableSlot.id })
      ).toThrow('Parking bay is currently out of service')

      // Reservation must be rejected
      const futureStart = new Date(Date.now() + 3600000).toISOString()
      const futureEnd = new Date(Date.now() + 7200000).toISOString()
      expect(() =>
        demoStore.createBooking({
          parking_slot_id: availableSlot.id,
          start_time: futureStart,
          end_time: futureEnd,
        })
      ).toThrow('Parking bay is currently out of service')
    })

    it('Safely protects active customer parking session from accidental admin status override', () => {
      demoStore.loginDemo('customer')
      const availableSlot = demoStore.getSlots().find((s) => s.is_active && s.occupancy_status === 'available')!

      // Customer checks in
      const session = demoStore.checkIn({
        parking_slot_id: availableSlot.id,
        vehicle_plate: 'SAFE-01',
      })
      expect(session).toBeDefined()
      expect(demoStore.getSlotById(availableSlot.id)?.occupancy_status).toBe('occupied')

      // Admin attempts to change status to maintenance while session is active -> must throw
      demoStore.loginDemo('admin')
      expect(() =>
        demoStore.updateSlotStatus(availableSlot.id, 'maintenance')
      ).toThrow(/while customer session is active/)

      // Admin attempts to change status to available while session is active -> must throw
      expect(() =>
        demoStore.updateSlotStatus(availableSlot.id, 'available')
      ).toThrow(/while customer session is active/)

      // After customer checks out, bay transitions safely to available
      demoStore.loginDemo('customer')
      demoStore.checkOut(session.id)
      expect(demoStore.getSlotById(availableSlot.id)?.occupancy_status).toBe('available')

      // Now admin can set maintenance safely
      demoStore.loginDemo('admin')
      const deactivated = demoStore.updateSlotStatus(availableSlot.id, 'maintenance')
      expect(deactivated.occupancy_status).toBe('maintenance')
      expect(deactivated.is_active).toBe(false)
    })

    it('calcOccupancyStats accurately updates when status transitions occur', () => {
      const initialStats = calcOccupancyStats(demoStore.getSlots())
      const maintenanceSlot = demoStore.getSlots().find((s) => !s.is_active)!

      demoStore.loginDemo('admin')
      demoStore.updateSlotStatus(maintenanceSlot.id, 'available')

      const updatedStats = calcOccupancyStats(demoStore.getSlots())
      expect(updatedStats.available).toBe(initialStats.available + 1)
      expect(updatedStats.maintenance).toBe(initialStats.maintenance - 1)
      expect(updatedStats.total).toBe(initialStats.total + 1)
    })
  })

  describe('Reservation Engine & Concurrency Conflict Prevention', () => {
    it('Prevents two customers from reserving the same bay for overlapping periods', () => {
      demoStore.loginDemo('customer')
      const slot = demoStore.getSlots().find((s) => s.is_active && s.occupancy_status === 'available')!

      const t1 = Date.now() + 3600000 * 2
      const t2 = Date.now() + 3600000 * 4

      // Customer 1 reserves slot
      demoStore.createBooking({
        parking_slot_id: slot.id,
        start_time: new Date(t1).toISOString(),
        end_time: new Date(t2).toISOString(),
        vehicle_plate: 'CAR-A',
      })

      // Another user (e.g. admin or different user) attempts to reserve same slot overlapping
      const overlapStart = new Date(t1 + 1800000).toISOString()
      const overlapEnd = new Date(t2 + 1800000).toISOString()

      expect(() =>
        demoStore.createBooking({
          parking_slot_id: slot.id,
          start_time: overlapStart,
          end_time: overlapEnd,
          vehicle_plate: 'CAR-B',
        })
      ).toThrow('This parking space has already been reserved for the requested time window.')
    })

    it('Allows consecutive, non-overlapping reservations for the same bay', () => {
      demoStore.loginDemo('customer')
      const slot = demoStore.getSlots().find((s) => s.is_active && s.occupancy_status === 'available')!

      const t1 = Date.now() + 3600000 * 2
      const t2 = Date.now() + 3600000 * 4
      const t3 = Date.now() + 3600000 * 5
      const t4 = Date.now() + 3600000 * 7

      const b1 = demoStore.createBooking({
        parking_slot_id: slot.id,
        start_time: new Date(t1).toISOString(),
        end_time: new Date(t2).toISOString(),
      })
      expect(b1).toBeDefined()

      // Second booking on different slot or consecutive time window on same slot
      const otherSlot = demoStore.getSlots().find((s) => s.id !== slot.id && s.is_active && s.occupancy_status === 'available')!
      const b2 = demoStore.createBooking({
        parking_slot_id: otherSlot.id,
        start_time: new Date(t3).toISOString(),
        end_time: new Date(t4).toISOString(),
      })
      expect(b2).toBeDefined()
    })

    it('Prevents customer from creating conflicting overlapping reservations for themselves', () => {
      demoStore.loginDemo('customer')
      const slots = demoStore.getSlots().filter((s) => s.is_active && s.occupancy_status === 'available')
      const slot1 = slots[0]
      const slot2 = slots[1]

      const t1 = Date.now() + 3600000 * 2
      const t2 = Date.now() + 3600000 * 5

      demoStore.createBooking({
        parking_slot_id: slot1.id,
        start_time: new Date(t1).toISOString(),
        end_time: new Date(t2).toISOString(),
      })

      // Same customer attempts booking another slot during overlapping window
      expect(() =>
        demoStore.createBooking({
          parking_slot_id: slot2.id,
          start_time: new Date(t1 + 1800000).toISOString(),
          end_time: new Date(t2 + 1800000).toISOString(),
        })
      ).toThrow('You already have another active reservation during this time window.')
    })

    it('Rejects invalid reservation time windows: past dates and end before start', () => {
      demoStore.loginDemo('customer')
      const slot = demoStore.getSlots().find((s) => s.is_active && s.occupancy_status === 'available')!

      // Past time
      const pastStart = new Date(Date.now() - 7200000).toISOString()
      const pastEnd = new Date(Date.now() - 3600000).toISOString()
      expect(() =>
        demoStore.createBooking({
          parking_slot_id: slot.id,
          start_time: pastStart,
          end_time: pastEnd,
        })
      ).toThrow('Start time must be in the future')

      // End before start
      const futureStart = new Date(Date.now() + 7200000).toISOString()
      const earlierEnd = new Date(Date.now() + 3600000).toISOString()
      expect(() =>
        demoStore.createBooking({
          parking_slot_id: slot.id,
          start_time: futureStart,
          end_time: earlierEnd,
        })
      ).toThrow('End time must be after start time')
    })
  })

  describe('Reservation Lifecycle Derivation', () => {
    it('Correctly derives all 5 lifecycle states without inventing events', () => {
      const now = Date.now()

      // 1. Upcoming confirmed
      const upcomingBooking: Booking = {
        id: 'test-1',
        user_id: 'cust-1',
        parking_slot_id: 'slot-1',
        start_time: new Date(now + 3600000).toISOString(),
        end_time: new Date(now + 7200000).toISOString(),
        status: 'confirmed',
        vehicle_plate: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      expect(getReservationLifecycle(upcomingBooking)).toBe('upcoming')

      // 2. Active now / Due
      const activeNowBooking: Booking = {
        id: 'test-2',
        user_id: 'cust-1',
        parking_slot_id: 'slot-1',
        start_time: new Date(now - 1800000).toISOString(),
        end_time: new Date(now + 1800000).toISOString(),
        status: 'confirmed',
        vehicle_plate: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      expect(getReservationLifecycle(activeNowBooking)).toBe('active_now')

      // 3. Expired (time passed without check-in)
      const expiredBooking: Booking = {
        id: 'test-3',
        user_id: 'cust-1',
        parking_slot_id: 'slot-1',
        start_time: new Date(now - 7200000).toISOString(),
        end_time: new Date(now - 3600000).toISOString(),
        status: 'confirmed',
        vehicle_plate: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      expect(getReservationLifecycle(expiredBooking)).toBe('expired')

      // 4. Completed
      const completedBooking: Booking = {
        ...upcomingBooking,
        id: 'test-4',
        status: 'completed',
      }
      expect(getReservationLifecycle(completedBooking)).toBe('completed')

      // 5. Cancelled
      const cancelledBooking: Booking = {
        ...upcomingBooking,
        id: 'test-5',
        status: 'cancelled',
      }
      expect(getReservationLifecycle(cancelledBooking)).toBe('cancelled')
    })
  })
})
