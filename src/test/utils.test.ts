import { describe, it, expect } from 'vitest'
import {
  calcOccupancyStats,
  isBookingCancellable,
  isBookingUpcoming,
  isValidTimeRange,
  formatDateTime,
  formatDate,
} from '@/lib/utils'
import {
  normalizeParkingStatus,
  getParkingStatusTheme,
  getParkingStatusHex,
  getParkingStatusLabel,
  PARKING_STATUS_THEMES,
} from '@/lib/statusColors'
import type { ParkingSlot, Booking } from '@/types/database'

describe('calcOccupancyStats', () => {
  it('correctly calculates statistics with mixed slot statuses', () => {
    const slots: ParkingSlot[] = [
      {
        id: '1',
        label: 'A01',
        zone: 'A',
        floor: 'ground',
        slot_type: 'standard',
        is_active: true,
        occupancy_status: 'available',
        notes: null,
        created_at: '',
        updated_at: '',
      },
      {
        id: '2',
        label: 'A02',
        zone: 'A',
        floor: 'ground',
        slot_type: 'standard',
        is_active: true,
        occupancy_status: 'occupied',
        notes: null,
        created_at: '',
        updated_at: '',
      },
      {
        id: '3',
        label: 'A03',
        zone: 'A',
        floor: 'ground',
        slot_type: 'standard',
        is_active: true,
        occupancy_status: 'reserved',
        notes: null,
        created_at: '',
        updated_at: '',
      },
      {
        id: '4',
        label: 'A04',
        zone: 'A',
        floor: 'ground',
        slot_type: 'standard',
        is_active: true,
        occupancy_status: 'available',
        notes: null,
        created_at: '',
        updated_at: '',
      },
      {
        id: '5',
        label: 'A05',
        zone: 'A',
        floor: 'ground',
        slot_type: 'standard',
        is_active: false, // Inactive / Maintenance
        occupancy_status: 'maintenance',
        notes: null,
        created_at: '',
        updated_at: '',
      },
    ]

    const stats = calcOccupancyStats(slots)
    expect(stats.total).toBe(4) // 4 active slots
    expect(stats.available).toBe(2)
    expect(stats.occupied).toBe(1)
    expect(stats.reserved).toBe(1)
    expect(stats.maintenance).toBe(1) // 1 out of service
    // Occupancy = (1 occupied + 1 reserved) / 4 active = 50%
    expect(stats.occupancyPercent).toBe(50)
  })

  it('handles empty slot list without dividing by zero', () => {
    const stats = calcOccupancyStats([])
    expect(stats.total).toBe(0)
    expect(stats.occupancyPercent).toBe(0)
    expect(stats.available).toBe(0)
  })
})

describe('isBookingCancellable and isBookingUpcoming', () => {
  it('allows cancellation for confirmed future bookings', () => {
    const futureDate = new Date(Date.now() + 3600 * 1000 * 5).toISOString()
    const booking = { status: 'confirmed' as const, start_time: futureDate }
    expect(isBookingCancellable(booking)).toBe(true)
    expect(isBookingUpcoming(booking)).toBe(true)
  })

  it('disallows cancellation for past bookings', () => {
    const pastDate = new Date(Date.now() - 3600 * 1000 * 2).toISOString()
    const booking = { status: 'confirmed' as const, start_time: pastDate }
    expect(isBookingCancellable(booking)).toBe(false)
  })

  it('disallows cancellation for already cancelled or completed bookings', () => {
    const futureDate = new Date(Date.now() + 3600 * 1000 * 5).toISOString()
    expect(isBookingCancellable({ status: 'cancelled', start_time: futureDate })).toBe(false)
    expect(isBookingCancellable({ status: 'completed', start_time: futureDate })).toBe(false)
  })
})

describe('isValidTimeRange', () => {
  it('validates future time intervals correctly', () => {
    const start = new Date(Date.now() + 1000 * 60 * 30) // 30 mins future
    const end = new Date(Date.now() + 1000 * 60 * 90) // 90 mins future
    expect(isValidTimeRange(start, end)).toBe(true)
  })

  it('rejects end time earlier than start time', () => {
    const start = new Date(Date.now() + 1000 * 60 * 90)
    const end = new Date(Date.now() + 1000 * 60 * 30)
    expect(isValidTimeRange(start, end)).toBe(false)
  })
})

describe('Parking Status Colors & Normalization', () => {
  it('defines the 4 mandatory status colors exactly as specified', () => {
    expect(PARKING_STATUS_THEMES.available.hex).toBe('#16A34A') // Green
    expect(PARKING_STATUS_THEMES.occupied.hex).toBe('#DC2626') // Red
    expect(PARKING_STATUS_THEMES.reserved.hex).toBe('#2563EB') // Blue
    expect(PARKING_STATUS_THEMES.maintenance.hex).toBe('#EAB308') // Yellow/Amber

    // Occupied must NEVER be green
    expect(PARKING_STATUS_THEMES.occupied.hex).not.toBe(PARKING_STATUS_THEMES.available.hex)
    expect(PARKING_STATUS_THEMES.occupied.hex).not.toBe('#16A34A')
  })

  it('normalizes various status representations correctly', () => {
    expect(normalizeParkingStatus('available')).toBe('available')
    expect(normalizeParkingStatus('free')).toBe('available')
    expect(normalizeParkingStatus('vacant')).toBe('available')
    expect(normalizeParkingStatus('AVAILABLE')).toBe('available')

    expect(normalizeParkingStatus('occupied')).toBe('occupied')
    expect(normalizeParkingStatus('OCCUPIED')).toBe('occupied')

    expect(normalizeParkingStatus('reserved')).toBe('reserved')
    expect(normalizeParkingStatus('RESERVED')).toBe('reserved')

    expect(normalizeParkingStatus('maintenance')).toBe('maintenance')
    expect(normalizeParkingStatus('service')).toBe('maintenance')
    expect(normalizeParkingStatus('out_of_service')).toBe('maintenance')
    expect(normalizeParkingStatus('disabled')).toBe('maintenance')

    // Inactive slot is always normalized to maintenance
    expect(normalizeParkingStatus({ is_active: false, occupancy_status: 'available' })).toBe('maintenance')
    expect(normalizeParkingStatus({ is_active: true, occupancy_status: 'available' })).toBe('available')
    expect(normalizeParkingStatus({ is_active: true, occupancy_status: 'occupied' })).toBe('occupied')
  })

  it('returns appropriate themes and hex values for ParkingSlot objects', () => {
    const slotAvail = { id: 's1', is_active: true, occupancy_status: 'available' } as ParkingSlot
    const slotOcc = { id: 's2', is_active: true, occupancy_status: 'occupied' } as ParkingSlot
    const slotRes = { id: 's3', is_active: true, occupancy_status: 'reserved' } as ParkingSlot
    const slotMaint = { id: 's4', is_active: false, occupancy_status: 'available' } as ParkingSlot

    expect(getParkingStatusHex(slotAvail)).toBe('#16A34A')
    expect(getParkingStatusHex(slotOcc)).toBe('#DC2626')
    expect(getParkingStatusHex(slotRes)).toBe('#2563EB')
    expect(getParkingStatusHex(slotMaint)).toBe('#EAB308')

    expect(getParkingStatusLabel(slotAvail)).toBe('Available')
    expect(getParkingStatusLabel(slotOcc)).toBe('Occupied')
    expect(getParkingStatusLabel(slotRes)).toBe('Reserved')
    expect(getParkingStatusLabel(slotMaint)).toBe('Out of Service')

    const occTheme = getParkingStatusTheme(slotOcc)
    expect(occTheme.hex).toBe('#DC2626')
    expect(occTheme.badgeClasses).toContain('badge-red')
  })
})

