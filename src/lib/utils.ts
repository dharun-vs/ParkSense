import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isAfter, isBefore } from 'date-fns'
import type { OccupancyStatus, BookingStatus, OccupancyStats, ParkingSlot } from '@/types/database'

// Merge tailwind classes safely
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format a date to local readable string
export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy h:mm a')
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), 'h:mm a')
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export {
  normalizeParkingStatus,
  getParkingStatusTheme,
  getParkingStatusHex,
  getParkingStatusLabel,
  PARKING_STATUS_THEMES,
} from './statusColors'

// Occupancy color / class helpers
export const OCCUPANCY_LABELS: Record<OccupancyStatus, string> = {
  available: 'Available',
  occupied: 'Occupied',
  reserved: 'Reserved',
  maintenance: 'Out of Service',
}

export const OCCUPANCY_BADGE_CLASS: Record<OccupancyStatus, string> = {
  available: 'badge-green',
  occupied: 'badge-red',
  reserved: 'badge-blue',
  maintenance: 'badge-amber',
}

export const SLOT_CARD_CLASS: Record<OccupancyStatus, string> = {
  available: 'slot-available',
  occupied: 'slot-occupied',
  reserved: 'slot-reserved',
  maintenance: 'slot-maintenance',
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  expired: 'Expired',
}

export const BOOKING_STATUS_BADGE: Record<BookingStatus, string> = {
  confirmed: 'badge-green',
  cancelled: 'badge-gray',
  completed: 'badge-blue',
  expired: 'badge-amber',
}

export const LIFECYCLE_LABELS = {
  upcoming: 'Upcoming',
  active_now: 'Active Now',
  completed: 'Completed',
  cancelled: 'Cancelled',
  expired: 'Expired',
} as const

export const LIFECYCLE_BADGE = {
  upcoming: 'badge-amber',
  active_now: 'badge-blue',
  completed: 'badge-green',
  cancelled: 'badge-red',
  expired: 'badge-gray',
} as const

export const RESERVATION_LIFECYCLE_LABELS = LIFECYCLE_LABELS
export const RESERVATION_LIFECYCLE_BADGE = LIFECYCLE_BADGE

// Calculate occupancy stats from slot list
export function calcOccupancyStats(slots: ParkingSlot[]): OccupancyStats {
  const activeSlots = slots.filter((s) => s.is_active)
  const total = activeSlots.length
  const available = activeSlots.filter((s) => s.occupancy_status === 'available').length
  const occupied = activeSlots.filter((s) => s.occupancy_status === 'occupied').length
  const reserved = activeSlots.filter((s) => s.occupancy_status === 'reserved').length
  const maintenance = slots.filter((s) => !s.is_active || s.occupancy_status === 'maintenance').length
  const occupancyPercent = total > 0 ? Math.round(((occupied + reserved) / total) * 100) : 0

  return { total, available, occupied, reserved, maintenance, occupancyPercent }
}

// Check if a booking is cancellable (status is confirmed and start_time is in the future)
export function isBookingCancellable(booking: { status: BookingStatus; start_time: string }): boolean {
  return booking.status === 'confirmed' && isAfter(new Date(booking.start_time), new Date())
}

// Check if a booking is upcoming (confirmed, start_time in the future)
export function isBookingUpcoming(booking: { status: BookingStatus; start_time: string }): boolean {
  return booking.status === 'confirmed' && isAfter(new Date(booking.start_time), new Date())
}

// Check if a time range is valid
export function isValidTimeRange(startTime: Date, endTime: Date): boolean {
  return isAfter(endTime, startTime) && isAfter(startTime, new Date())
}

// Check if a time is in the future
export function isFutureTime(date: Date): boolean {
  return isAfter(date, new Date())
}

// Check if a booking has started (start_time is in the past or now)
export function hasBookingStarted(booking: { start_time: string }): boolean {
  return isBefore(new Date(booking.start_time), new Date())
}

// Group slots by zone
export function groupSlotsByZone(slots: ParkingSlot[]): Record<string, ParkingSlot[]> {
  return slots.reduce<Record<string, ParkingSlot[]>>((acc, slot) => {
    const zone = slot.zone || 'General'
    if (!acc[zone]) acc[zone] = []
    acc[zone].push(slot)
    return acc
  }, {})
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '…'
}

// Generate initials from display name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
}
