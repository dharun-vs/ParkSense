import type { OccupancyStatus, ParkingSlot } from '@/types/database'

/**
 * ParkSense Centralized Parking Status Configuration
 *
 * Mandatory Semantic Color Mapping:
 * - Available / Free:       Green   (#16A34A)
 * - Service / Maintenance:  Yellow  (#EAB308)
 * - Reserved:               Blue    (#2563EB)
 * - Occupied:               Red     (#DC2626)
 *
 * An occupied parking space must ALWAYS be red, never green.
 */

export type NormalizedParkingStatus = 'available' | 'occupied' | 'reserved' | 'maintenance'

export interface ParkingStatusTheme {
  key: NormalizedParkingStatus
  label: string
  shortLabel: string
  hex: string
  solidHex: string
  // Tailwind color token names
  colorName: 'green' | 'red' | 'blue' | 'yellow'
  // Pre-composed classes for parking layout tiles
  tileBg: string
  tileBorder: string
  tileText: string
  tileClasses: string
  // Pre-composed classes for status badges and chips
  badgeBg: string
  badgeBorder: string
  badgeText: string
  badgeClasses: string
  // Dot indicators
  dotBg: string
  // Active/Indicator border & rings
  ringClass: string
}

export const PARKING_STATUS_THEMES: Record<NormalizedParkingStatus, ParkingStatusTheme> = {
  available: {
    key: 'available',
    label: 'Available',
    shortLabel: 'Free',
    hex: '#16A34A',
    solidHex: '#16A34A',
    colorName: 'green',
    tileBg: 'bg-[#F0FDF4]',
    tileBorder: 'border-[#BBF7D0]',
    tileText: 'text-[#16A34A]',
    tileClasses: 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]',
    badgeBg: 'bg-[#F0FDF4]',
    badgeBorder: 'border-[#BBF7D0]',
    badgeText: 'text-[#16A34A]',
    badgeClasses: 'badge-green bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A]',
    dotBg: 'bg-[#16A34A]',
    ringClass: 'ring-[#16A34A]',
  },
  occupied: {
    key: 'occupied',
    label: 'Occupied',
    shortLabel: 'Occupied',
    hex: '#DC2626',
    solidHex: '#DC2626',
    colorName: 'red',
    tileBg: 'bg-[#FEF2F2]',
    tileBorder: 'border-[#FECACA]',
    tileText: 'text-[#DC2626]',
    tileClasses: 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]',
    badgeBg: 'bg-[#FEF2F2]',
    badgeBorder: 'border-[#FECACA]',
    badgeText: 'text-[#DC2626]',
    badgeClasses: 'badge-red bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626]',
    dotBg: 'bg-[#DC2626]',
    ringClass: 'ring-[#DC2626]',
  },
  reserved: {
    key: 'reserved',
    label: 'Reserved',
    shortLabel: 'Reserved',
    hex: '#2563EB',
    solidHex: '#2563EB',
    colorName: 'blue',
    tileBg: 'bg-[#EFF6FF]',
    tileBorder: 'border-[#BFDBFE]',
    tileText: 'text-[#2563EB]',
    tileClasses: 'bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB]',
    badgeBg: 'bg-[#EFF6FF]',
    badgeBorder: 'border-[#BFDBFE]',
    badgeText: 'text-[#2563EB]',
    badgeClasses: 'badge-blue bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB]',
    dotBg: 'bg-[#2563EB]',
    ringClass: 'ring-[#2563EB]',
  },
  maintenance: {
    key: 'maintenance',
    label: 'Out of Service',
    shortLabel: 'Service',
    hex: '#EAB308',
    solidHex: '#EAB308',
    colorName: 'yellow',
    tileBg: 'bg-[#FEFCE8]',
    tileBorder: 'border-[#FEF08A]',
    tileText: 'text-[#CA8A04]',
    tileClasses: 'bg-[#FEFCE8] border-[#FEF08A] text-[#CA8A04]',
    badgeBg: 'bg-[#FEFCE8]',
    badgeBorder: 'border-[#FEF08A]',
    badgeText: 'text-[#CA8A04]',
    badgeClasses: 'badge-amber bg-[#FEFCE8] border border-[#FEF08A] text-[#CA8A04]',
    dotBg: 'bg-[#EAB308]',
    ringClass: 'ring-[#EAB308]',
  },
}

/**
 * Normalizes any parking slot or status string into one of the 4 authoritative status keys:
 * 'available' | 'occupied' | 'reserved' | 'maintenance'
 */
export function normalizeParkingStatus(
  input:
    | OccupancyStatus
    | string
    | { is_active?: boolean; occupancy_status?: OccupancyStatus }
    | null
    | undefined
): NormalizedParkingStatus {
  if (!input) return 'available'

  // If a slot object was passed, check operational state first
  if (typeof input === 'object') {
    if (input.is_active === false) return 'maintenance'
    return normalizeParkingStatus(input.occupancy_status)
  }

  const raw = String(input).toLowerCase().trim()
  if (raw === 'occupied') return 'occupied'
  if (raw === 'reserved') return 'reserved'
  if (
    raw === 'maintenance' ||
    raw === 'service' ||
    raw === 'out of service' ||
    raw === 'out_of_service' ||
    raw === 'disabled'
  ) {
    return 'maintenance'
  }
  return 'available'
}

/**
 * Returns the centralized theme object for a given slot or status
 */
export function getParkingStatusTheme(
  input:
    | OccupancyStatus
    | string
    | { is_active?: boolean; occupancy_status?: OccupancyStatus }
    | null
    | undefined
): ParkingStatusTheme {
  const normalized = normalizeParkingStatus(input)
  return PARKING_STATUS_THEMES[normalized]
}

/**
 * Returns the hex code for a status
 */
export function getParkingStatusHex(
  input: OccupancyStatus | string | ParkingSlot | null | undefined
): string {
  return getParkingStatusTheme(input).hex
}

/**
 * Returns the human-readable label
 */
export function getParkingStatusLabel(
  input: OccupancyStatus | string | ParkingSlot | null | undefined
): string {
  return getParkingStatusTheme(input).label
}
