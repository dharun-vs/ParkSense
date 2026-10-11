// Database types matching Supabase schema

export type UserRole = 'user' | 'admin'

export type OccupancyStatus = 'available' | 'occupied' | 'reserved' | 'maintenance'

export type BookingStatus = 'confirmed' | 'cancelled' | 'completed' | 'expired'

export type ReservationLifecycle = 'upcoming' | 'active_now' | 'completed' | 'cancelled' | 'expired'

export function getReservationLifecycle(booking: {
  status: BookingStatus
  start_time: string
  end_time: string
}): ReservationLifecycle {
  if (booking.status === 'cancelled') return 'cancelled'
  if (booking.status === 'completed') return 'completed'
  if (booking.status === 'expired') return 'expired'

  const now = Date.now()
  const start = new Date(booking.start_time).getTime()
  const end = new Date(booking.end_time).getTime()

  if (now < start) return 'upcoming'
  if (now >= start && now <= end) return 'active_now'
  return 'expired'
}

export type EventType =
  | 'booking_created'
  | 'booking_cancelled'
  | 'booking_completed'
  | 'slot_occupied'
  | 'slot_vacated'
  | 'slot_created'
  | 'slot_updated'
  | 'slot_status_changed'
  | 'check_in'
  | 'check_out'

export interface Profile {
  id: string
  display_name: string
  username?: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface ParkingSlot {
  id: string
  label: string
  zone: string
  /** Explicit floor: 'ground' | 'level1' | 'level2' */
  floor: 'ground' | 'level1' | 'level2'
  slot_type: string
  is_active: boolean
  occupancy_status: OccupancyStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  user_id: string
  parking_slot_id: string
  start_time: string
  end_time: string
  status: BookingStatus
  vehicle_plate: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined
  parking_slot?: ParkingSlot
  profile?: Profile
}

/**
 * A ParkingSession represents a driver physically parked
 * in a bay (check-in → check-out). This is distinct from a Booking
 * (time-based future reservation). In demo mode this lives in localStorage.
 */
export interface ParkingSession {
  id: string
  user_id: string
  parking_slot_id: string
  checked_in_at: string
  checked_out_at: string | null
  vehicle_plate: string | null
  // Joined
  parking_slot?: ParkingSlot
}

export interface ParkingEvent {
  id: string
  actor_id: string | null
  parking_slot_id: string | null
  booking_id: string | null
  event_type: EventType
  metadata: Record<string, unknown>
  created_at: string
  // Joined
  parking_slot?: ParkingSlot
  actor?: Profile
}

// Dashboard stats derived from DB
export interface OccupancyStats {
  total: number
  available: number
  occupied: number
  reserved: number
  maintenance: number
  occupancyPercent: number
}

// Facility floor definitions
export const FACILITY_FLOORS = [
  {
    id: 'ground' as const,
    label: 'Ground Floor',
    shortLabel: 'GF',
    zone: 'A',
    bayRange: 'A01–A10',
    capacity: 10,
  },
  {
    id: 'level1' as const,
    label: 'Level 1',
    shortLabel: 'L1',
    zone: 'B',
    bayRange: 'B01–B10',
    capacity: 10,
  },
  {
    id: 'level2' as const,
    label: 'Level 2',
    shortLabel: 'L2',
    zone: 'C',
    bayRange: 'C01–C08',
    capacity: 8,
  },
] as const

export type FloorId = typeof FACILITY_FLOORS[number]['id']
