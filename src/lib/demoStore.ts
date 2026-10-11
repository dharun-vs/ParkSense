import type { ParkingSlot, Booking, ParkingEvent, Profile, OccupancyStatus, ParkingSession } from '@/types/database'

// Default 28 parking bays identical to supabase/seed.sql, with explicit floor assignments
export const INITIAL_SEEDED_SLOTS: ParkingSlot[] = [
  // ZONE A (Ground Floor / Premium, EV & Accessible)
  { id: 'slot-a01', label: 'A01', zone: 'A', floor: 'ground', slot_type: 'ev', is_active: true, occupancy_status: 'available', notes: 'Level-2 22kW EV Fast Charger', created_at: '2026-10-10T00:00:00Z', updated_at: '2026-10-10T00:00:00Z' },
  { id: 'slot-a02', label: 'A02', zone: 'A', floor: 'ground', slot_type: 'ev', is_active: true, occupancy_status: 'occupied', notes: 'Level-2 22kW EV Fast Charger', created_at: '2026-10-10T00:00:00Z', updated_at: '2026-10-10T00:00:00Z' },
  { id: 'slot-a03', label: 'A03', zone: 'A', floor: 'ground', slot_type: 'accessible', is_active: true, occupancy_status: 'available', notes: 'Extra wide clearance near elevator entrance', created_at: '2026-10-10T00:00:00Z', updated_at: '2026-10-10T00:00:00Z' },
  { id: 'slot-a04', label: 'A04', zone: 'A', floor: 'ground', slot_type: 'accessible', is_active: true, occupancy_status: 'reserved', notes: 'Reserved for accessibility permit holder', created_at: '2026-10-10T00:00:00Z', updated_at: '2026-10-10T00:00:00Z' },
  { id: 'slot-a05', label: 'A05', zone: 'A', floor: 'ground', slot_type: 'standard', is_active: true, occupancy_status: 'available', notes: 'Close to main terminal entrance', created_at: '2026-10-10T00:00:00Z', updated_at: '2026-10-10T00:00:00Z' },
  { id: 'slot-a06', label: 'A06', zone: 'A', floor: 'ground', slot_type: 'standard', is_active: true, occupancy_status: 'occupied', notes: 'Close to main terminal entrance', created_at: '2026-10-10T00:00:00Z', updated_at: '2026-10-10T00:00:00Z' },
  { id: 'slot-a07', label: 'A07', zone: 'A', floor: 'ground', slot_type: 'standard', is_active: true, occupancy_status: 'available', notes: 'Direct access to pedestrian walkway', created_at: '2026-10-10T00:00:00Z', updated_at: '2026-10-10T00:00:00Z' },
  { id: 'slot-a08', label: 'A08', zone: 'A', floor: 'ground', slot_type: 'standard', is_active: true, occupancy_status: 'available', notes: 'Direct access to pedestrian walkway', created_at: '2026-10-10T00:00:00Z', updated_at: '2026-10-10T00:00:00Z' },
  { id: 'slot-a09', label: 'A09', zone: 'A', floor: 'ground', slot_type: 'compact', is_active: true, occupancy_status: 'available', notes: 'Suitable for compact vehicles and sedans', created_at: '2026-10-10T00:00:00Z', updated_at: '2026-10-10T00:00:00Z' },
  { id: 'slot-a10', label: 'A10', zone: 'A', floor: 'ground', slot_type: 'standard', is_active: false, occupancy_status: 'maintenance', notes: 'Sensor calibration in progress', created_at: '2026-10-10T00:00:00Z', updated_at: '2026-10-10T00:00:00Z' },

  // ZONE B (Level 1 / General Fleet Parking)
  { id: 'slot-b01', label: 'B01', zone: 'B', floor: 'level1', slot_type: 'standard', is_active: true, occupancy_status: 'available', notes: 'North wing bay', created_at: '2026-10-10T00:00:00Z', updated_at: '2026-10-10T00:00:00Z' },
  { id: 'slot-b02', label: 'B02', zone: 'B', floor: 'level1', slot_type: 'standard', is_active: true, occupancy_status: 'available', notes: 'North wing bay', created_at: '2026-10-10T00:00:00Z', updated_at: '2026-10-10T00:00:00Z' },
  { id: 'slot-b03', label: 'B03', zone: 'B', floor: 'level1', slot_type: 'standard', is_active: true, occupancy_status: 'occupied', notes: 'North wing bay', created_at: '2026-10-10T00:00:00Z', updated_at: '2026-10-10T00:00:00Z' },
  { id: 'slot-b04', label: 'B04', zone: 'B', floor: 'level1', slot_type: 'standard', is_active: true, occupancy_status: 'available', notes: 'North wing bay', created_at: '2026-10-10T00:00:00Z', updated_at: '2026-10-10T00:00:00Z' },
  { id: 'slot-b05', label: 'B05', zone: 'B', floor: 'level1', slot_type: 'standard', is_active: true, occupancy_status: 'available', notes: 'Central aisle bay', created_at: '2026-10-10T00:00:00Z', updated_at: '2026-10-10T00:00:00Z' },
  { id: 'slot-b06', label: 'B06', zone: 'B', floor: 'level1', slot_type: 'compact', is_active: true, occupancy_status: 'occupied', notes: 'Central aisle bay', created_at: '2026-10-10T00:00:00Z', updated_at: '2026-10-10T00:00:00Z' },
  { id: 'slot-b07', label: 'B07', zone: 'B', floor: 'level1', slot_type: 'standard', is_active: true, occupancy_status: 'available', notes: 'Central aisle bay', created_at: '2026-10-10T00:00:00Z', updated_at: '2026-10-10T00:00:00Z' },
  { id: 'slot-b08', label: 'B08', zone: 'B', floor: 'level1', slot_type: 'standard', is_active: true, occupancy_status: 'reserved', notes: 'Reserved for scheduled afternoon slot', created_at: '2026-10-10T00:00:00Z', updated_at: '2026-10-10T00:00:00Z' },
  { id: 'slot-b09', label: 'B09', zone: 'B', floor: 'level1', slot_type: 'standard', is_active: true, occupancy_status: 'available', notes: 'South wing bay', created_at: '2026-10-10T00:00:00Z', updated_at: '2026-10-10T00:00:00Z' },
  { id: 'slot-b10', label: 'B10', zone: 'B', floor: 'level1', slot_type: 'compact', is_active: true, occupancy_status: 'available', notes: 'South wing bay', created_at: '2026-10-10T00:00:00Z', updated_at: '2026-10-10T00:00:00Z' },

  // ZONE C (Level 2 / Extended Stay & Economy)
  { id: 'slot-c01', label: 'C01', zone: 'C', floor: 'level2', slot_type: 'standard', is_active: true, occupancy_status: 'available', notes: 'Economy long-term bay', created_at: '2026-10-10T00:00:00Z', updated_at: '2026-10-10T00:00:00Z' },
  { id: 'slot-c02', label: 'C02', zone: 'C', floor: 'level2', slot_type: 'standard', is_active: true, occupancy_status: 'available', notes: 'Economy long-term bay', created_at: '2026-10-10T00:00:00Z', updated_at: '2026-10-10T00:00:00Z' },
  { id: 'slot-c03', label: 'C03', zone: 'C', floor: 'level2', slot_type: 'standard', is_active: true, occupancy_status: 'available', notes: 'Economy long-term bay', created_at: '2026-10-10T00:00:00Z', updated_at: '2026-10-10T00:00:00Z' },
  { id: 'slot-c04', label: 'C04', zone: 'C', floor: 'level2', slot_type: 'standard', is_active: true, occupancy_status: 'occupied', notes: 'Economy long-term bay', created_at: '2026-10-10T00:00:00Z', updated_at: '2026-10-10T00:00:00Z' },
  { id: 'slot-c05', label: 'C05', zone: 'C', floor: 'level2', slot_type: 'compact', is_active: true, occupancy_status: 'available', notes: 'West corridor bay', created_at: '2026-10-10T00:00:00Z', updated_at: '2026-10-10T00:00:00Z' },
  { id: 'slot-c06', label: 'C06', zone: 'C', floor: 'level2', slot_type: 'standard', is_active: true, occupancy_status: 'available', notes: 'West corridor bay', created_at: '2026-10-10T00:00:00Z', updated_at: '2026-10-10T00:00:00Z' },
  { id: 'slot-c07', label: 'C07', zone: 'C', floor: 'level2', slot_type: 'standard', is_active: false, occupancy_status: 'maintenance', notes: 'CCTV camera inspection underway', created_at: '2026-10-10T00:00:00Z', updated_at: '2026-10-10T00:00:00Z' },
  { id: 'slot-c08', label: 'C08', zone: 'C', floor: 'level2', slot_type: 'standard', is_active: true, occupancy_status: 'available', notes: 'East corridor bay', created_at: '2026-10-10T00:00:00Z', updated_at: '2026-10-10T00:00:00Z' },
]

export const DEMO_PROFILES: Record<string, Profile> = {
  'demo-admin-id': {
    id: 'demo-admin-id',
    display_name: 'System Administrator',
    username: 'admin',
    role: 'admin',
    created_at: '2026-10-10T00:00:00Z',
    updated_at: '2026-10-10T00:00:00Z',
  },
  'demo-customer-id': {
    id: 'demo-customer-id',
    display_name: 'Demo Driver',
    username: 'customer',
    role: 'user',
    created_at: '2026-10-10T00:00:00Z',
    updated_at: '2026-10-10T00:00:00Z',
  },
}

const STORAGE_KEYS = {
  SLOTS: 'parksense_demo_slots_v2',
  BOOKINGS: 'parksense_demo_bookings_v2',
  EVENTS: 'parksense_demo_events_v2',
  AUTH: 'parksense_demo_auth_user_v2',
  SESSIONS: 'parksense_demo_sessions_v1',
}

type StoreListener = () => void

class DemoStore {
  private slots: ParkingSlot[] = []
  private bookings: Booking[] = []
  private events: ParkingEvent[] = []
  private sessions: ParkingSession[] = []
  private currentUser: Profile | null = null
  private listeners: Set<StoreListener> = new Set()
  private broadcastChannel: BroadcastChannel | null = null

  constructor() {
    this.loadState()
    if (typeof window !== 'undefined') {
      // Listen to cross-tab storage changes
      window.addEventListener('storage', (e) => {
        if (e.key && Object.values(STORAGE_KEYS).includes(e.key)) {
          this.loadState()
          this.notifyListeners()
        }
      })

      // Cross-tab BroadcastChannel for instantaneous sync
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          this.broadcastChannel = new BroadcastChannel('parksense_realtime_sync')
          this.broadcastChannel.onmessage = () => {
            this.loadState()
            this.notifyListeners()
          }
        }
      } catch {
        // Fallback gracefully if BroadcastChannel is blocked
      }
    }
  }

  public subscribe(listener: StoreListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  public notifyListeners() {
    this.listeners.forEach((fn) => {
      try {
        fn()
      } catch (err) {
        console.error('Error in demoStore subscriber', err)
      }
    })
  }

  private loadState() {
    try {
      const savedSlots = localStorage.getItem(STORAGE_KEYS.SLOTS)
      // Migrate old slots that lack a floor field
      const rawSlots: ParkingSlot[] = savedSlots ? JSON.parse(savedSlots) : INITIAL_SEEDED_SLOTS.map((s) => ({ ...s }))
      this.slots = rawSlots.map((s) => ({
        ...s,
        floor: s.floor ?? (s.zone === 'A' ? 'ground' : s.zone === 'B' ? 'level1' : 'level2'),
      }))

      const savedBookings = localStorage.getItem(STORAGE_KEYS.BOOKINGS)
      this.bookings = savedBookings ? JSON.parse(savedBookings) : []

      const savedEvents = localStorage.getItem(STORAGE_KEYS.EVENTS)
      this.events = savedEvents
        ? JSON.parse(savedEvents)
        : [
            {
              id: 'ev-01',
              actor_id: null,
              parking_slot_id: 'slot-a01',
              booking_id: null,
              event_type: 'slot_created',
              metadata: { description: 'Facility initialized with 28 managed bays' },
              created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
            },
            {
              id: 'ev-02',
              actor_id: null,
              parking_slot_id: 'slot-a02',
              booking_id: null,
              event_type: 'slot_occupied',
              metadata: { slot_label: 'A02', is_simulated: true, description: 'Bay A02 occupied by vehicle' },
              created_at: new Date(Date.now() - 3600000).toISOString(),
            },
          ]

      const savedAuth = localStorage.getItem(STORAGE_KEYS.AUTH)
      this.currentUser = savedAuth ? JSON.parse(savedAuth) : null

      const savedSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS)
      this.sessions = savedSessions ? JSON.parse(savedSessions) : []
    } catch {
      this.slots = INITIAL_SEEDED_SLOTS.map((s) => ({ ...s }))
      this.bookings = []
      this.events = []
      this.sessions = []
      this.currentUser = null
    }
  }

  private saveState(broadcast = true) {
    try {
      localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(this.slots))
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(this.bookings))
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(this.events))
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(this.sessions))
      if (this.currentUser) {
        localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(this.currentUser))
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH)
      }

      // Notify local listeners
      this.notifyListeners()

      // Broadcast across tabs and window
      if (broadcast && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('parksense_data_sync', { detail: { timestamp: Date.now() } }))
        try {
          this.broadcastChannel?.postMessage({ type: 'SYNC', timestamp: Date.now() })
        } catch {
          // ignore
        }
      }
    } catch {
      // Storage unavailable fallback
    }
  }

  // --- Authentication Operations ---
  loginDemo(username: 'admin' | 'customer'): Profile {
    const profile = username === 'admin' ? DEMO_PROFILES['demo-admin-id'] : DEMO_PROFILES['demo-customer-id']
    this.currentUser = profile
    this.saveState()
    return profile
  }

  getCurrentUser(): Profile | null {
    return this.currentUser
  }

  logoutDemo() {
    this.currentUser = null
    this.saveState()
  }

  // --- Parking Session (Check-in / Check-out) ---

  /**
   * Returns the single active (not checked-out) session for a user,
   * or null if none exists.
   */
  getActiveSession(userId: string): ParkingSession | null {
    const session = this.sessions.find(
      (s) => s.user_id === userId && s.checked_out_at === null
    )
    if (!session) return null
    return {
      ...session,
      parking_slot: this.slots.find((sl) => sl.id === session.parking_slot_id),
    }
  }

  /**
   * Check a user into a bay. Fails if:
   * - Bay does not exist or is not active
   * - Bay is already occupied
   * - User already has an active session
   */
  checkIn(params: { parking_slot_id: string; vehicle_plate?: string }): ParkingSession {
    if (!this.currentUser) throw new Error('Not authenticated')

    const existing = this.getActiveSession(this.currentUser.id)
    if (existing) {
      throw new Error(
        `You are already checked into Bay ${existing.parking_slot?.label ?? existing.parking_slot_id}. Check out first.`
      )
    }

    const slot = this.slots.find((s) => s.id === params.parking_slot_id)
    if (!slot) throw new Error('Parking bay not found')
    if (!slot.is_active) throw new Error('Parking bay is currently out of service')
    if (slot.occupancy_status === 'occupied') {
      throw new Error('Bay is already occupied — check-in rejected to prevent double occupancy')
    }

    // Mark bay occupied
    slot.occupancy_status = 'occupied'
    slot.updated_at = new Date().toISOString()

    // If the user has a confirmed booking for this slot near current time, complete it
    const now = Date.now()
    const matchingBooking = this.bookings.find(
      (b) =>
        b.user_id === this.currentUser!.id &&
        b.parking_slot_id === params.parking_slot_id &&
        b.status === 'confirmed' &&
        Math.abs(new Date(b.start_time).getTime() - now) < 7200000
    )
    if (matchingBooking) {
      matchingBooking.status = 'completed'
      matchingBooking.updated_at = new Date().toISOString()
    }

    const session: ParkingSession = {
      id: `sess-${Date.now()}`,
      user_id: this.currentUser.id,
      parking_slot_id: params.parking_slot_id,
      checked_in_at: new Date().toISOString(),
      checked_out_at: null,
      vehicle_plate: params.vehicle_plate ?? null,
    }
    this.sessions.unshift(session)

    this.events.unshift({
      id: `ev-${Date.now()}`,
      actor_id: this.currentUser.id,
      parking_slot_id: slot.id,
      booking_id: matchingBooking?.id ?? null,
      event_type: 'check_in',
      metadata: {
        slot_label: slot.label,
        floor: slot.floor,
        vehicle_plate: params.vehicle_plate ?? null,
        reservation_id: matchingBooking?.id ?? null,
      },
      created_at: new Date().toISOString(),
    })

    this.saveState()
    return { ...session, parking_slot: { ...slot } }
  }

  /**
   * Check a user out of their current active session.
   * Only the session owner (or admin) may do this.
   */
  checkOut(sessionId: string): ParkingSession {
    if (!this.currentUser) throw new Error('Not authenticated')

    const session = this.sessions.find((s) => s.id === sessionId)
    if (!session) throw new Error('Parking session not found')
    if (session.checked_out_at) throw new Error('Session already closed')

    // Ownership check: only the session owner or admin can check out
    if (session.user_id !== this.currentUser.id && this.currentUser.role !== 'admin') {
      throw new Error('Not authorised to check out this session')
    }

    session.checked_out_at = new Date().toISOString()

    // Release the bay
    const slot = this.slots.find((s) => s.id === session.parking_slot_id)
    if (slot && slot.occupancy_status === 'occupied') {
      slot.occupancy_status = 'available'
      slot.is_active = true
      slot.updated_at = new Date().toISOString()
    }

    this.events.unshift({
      id: `ev-${Date.now()}`,
      actor_id: this.currentUser.id,
      parking_slot_id: session.parking_slot_id,
      booking_id: null,
      event_type: 'check_out',
      metadata: {
        slot_label: slot?.label,
        floor: slot?.floor,
        duration_minutes: slot
          ? Math.round((Date.now() - new Date(session.checked_in_at).getTime()) / 60000)
          : null,
      },
      created_at: new Date().toISOString(),
    })

    this.saveState()
    return { ...session, parking_slot: slot ? { ...slot } : undefined }
  }

  /** All sessions (for admin view) */
  getAllSessions(): ParkingSession[] {
    return this.sessions.map((s) => ({
      ...s,
      parking_slot: this.slots.find((sl) => sl.id === s.parking_slot_id),
    }))
  }

  // --- Slots Operations ---
  getSlots(): ParkingSlot[] {
    return [...this.slots]
  }

  getSlotById(id: string): ParkingSlot | undefined {
    return this.slots.find((s) => s.id === id)
  }

  updateSlotStatus(id: string, newStatus: OccupancyStatus): ParkingSlot {
    const slot = this.slots.find((s) => s.id === id)
    if (!slot) throw new Error('Slot not found')

    // Safety guard: do not overwrite active customer session unless checked out
    const activeSession = this.sessions.find(
      (s) => s.parking_slot_id === id && s.checked_out_at === null
    )
    if (activeSession && newStatus !== 'occupied') {
      throw new Error(
        `Cannot change Bay ${slot.label} status to '${newStatus}' while customer session is active. Customer must check out first.`
      )
    }

    const oldStatus = slot.occupancy_status
    slot.occupancy_status = newStatus
    // Critical bugfix: keep is_active strictly in sync with occupancy_status
    slot.is_active = newStatus !== 'maintenance'
    slot.updated_at = new Date().toISOString()

    // Add activity event
    const eventType = newStatus === 'occupied' ? 'slot_occupied' : newStatus === 'available' ? 'slot_vacated' : 'slot_status_changed'
    this.events.unshift({
      id: `ev-${Date.now()}`,
      actor_id: this.currentUser?.id || null,
      parking_slot_id: id,
      booking_id: null,
      event_type: eventType,
      metadata: { previous_status: oldStatus, new_status: newStatus, is_simulated: true },
      created_at: new Date().toISOString(),
    })

    this.saveState()
    return { ...slot }
  }

  toggleSlotActive(id: string, isActive: boolean): ParkingSlot {
    const slot = this.slots.find((s) => s.id === id)
    if (!slot) throw new Error('Slot not found')

    // Safety guard: do not deactivate a slot with active customer session
    if (!isActive) {
      const activeSession = this.sessions.find(
        (s) => s.parking_slot_id === id && s.checked_out_at === null
      )
      if (activeSession) {
        throw new Error(
          `Cannot deactivate Bay ${slot.label} while customer session is active. Customer must check out first.`
        )
      }
    }

    slot.is_active = isActive
    if (!isActive) slot.occupancy_status = 'maintenance'
    else if (slot.occupancy_status === 'maintenance') slot.occupancy_status = 'available'
    slot.updated_at = new Date().toISOString()

    this.saveState()
    return { ...slot }
  }

  // --- Bookings Operations ---
  createBooking(params: {
    parking_slot_id: string
    start_time: string
    end_time: string
    vehicle_plate?: string
    notes?: string
  }): Booking {
    const slot = this.slots.find((s) => s.id === params.parking_slot_id)
    if (!slot) throw new Error('Parking bay not found')
    if (!slot.is_active || slot.occupancy_status === 'maintenance') {
      throw new Error('Parking bay is currently out of service')
    }

    // Concurrency / conflict check
    const startTime = new Date(params.start_time).getTime()
    const endTime = new Date(params.end_time).getTime()
    const now = Date.now()

    if (startTime < now - 300000) {
      throw new Error('Start time must be in the future')
    }
    if (endTime <= startTime) {
      throw new Error('End time must be after start time')
    }

    // 1. Conflict on the requested bay with other confirmed reservations
    const hasConflict = this.bookings.some((b) => {
      if (b.parking_slot_id !== params.parking_slot_id || b.status !== 'confirmed') return false
      const bStart = new Date(b.start_time).getTime()
      const bEnd = new Date(b.end_time).getTime()
      return Math.max(startTime, bStart) < Math.min(endTime, bEnd)
    })

    if (hasConflict) {
      throw new Error('This parking space has already been reserved for the requested time window.')
    }

    // 2. Prevent customer from double-booking overlapping reservations for themselves
    const userId = this.currentUser?.id || 'demo-customer-id'
    const userConflict = this.bookings.some((b) => {
      if (b.user_id !== userId || b.status !== 'confirmed') return false
      const bStart = new Date(b.start_time).getTime()
      const bEnd = new Date(b.end_time).getTime()
      return Math.max(startTime, bStart) < Math.min(endTime, bEnd)
    })

    if (userConflict) {
      throw new Error('You already have another active reservation during this time window.')
    }

    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      user_id: userId,
      parking_slot_id: params.parking_slot_id,
      start_time: params.start_time,
      end_time: params.end_time,
      status: 'confirmed',
      vehicle_plate: params.vehicle_plate || null,
      notes: params.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      parking_slot: slot,
      profile: this.currentUser || DEMO_PROFILES['demo-customer-id'],
    }

    this.bookings.unshift(newBooking)

    // Mark slot reserved (distinct from physical occupancy 'occupied')
    if (slot.occupancy_status === 'available') {
      slot.occupancy_status = 'reserved'
    }

    this.events.unshift({
      id: `ev-${Date.now()}`,
      actor_id: this.currentUser?.id || null,
      parking_slot_id: slot.id,
      booking_id: newBooking.id,
      event_type: 'booking_created',
      metadata: { slot_label: slot.label, start_time: params.start_time, end_time: params.end_time },
      created_at: new Date().toISOString(),
    })

    this.saveState()
    return newBooking
  }

  cancelBooking(bookingId: string): void {
    const booking = this.bookings.find((b) => b.id === bookingId)
    if (!booking) throw new Error('Booking not found')

    if (this.currentUser && booking.user_id !== this.currentUser.id && this.currentUser.role !== 'admin') {
      throw new Error('Unauthorized to cancel this booking')
    }

    booking.status = 'cancelled'
    booking.updated_at = new Date().toISOString()

    // Restore slot to available if was marked reserved
    const slot = this.slots.find((s) => s.id === booking.parking_slot_id)
    if (slot && slot.occupancy_status === 'reserved') {
      slot.occupancy_status = 'available'
    }

    this.events.unshift({
      id: `ev-${Date.now()}`,
      actor_id: this.currentUser?.id || null,
      parking_slot_id: booking.parking_slot_id,
      booking_id: booking.id,
      event_type: 'booking_cancelled',
      metadata: { slot_label: slot?.label },
      created_at: new Date().toISOString(),
    })

    this.saveState()
  }

  completeBooking(bookingId: string): void {
    const booking = this.bookings.find((b) => b.id === bookingId)
    if (!booking) throw new Error('Booking not found')

    booking.status = 'completed'
    booking.updated_at = new Date().toISOString()
    this.saveState()
  }

  getBookings(userId?: string): Booking[] {
    const now = Date.now()
    // Auto-update expired bookings where end_time has passed
    for (const b of this.bookings) {
      if (b.status === 'confirmed' && new Date(b.end_time).getTime() < now) {
        b.status = 'expired'
        b.updated_at = new Date().toISOString()
      }
    }

    const list = userId ? this.bookings.filter((b) => b.user_id === userId) : this.bookings
    return list.map((b) => ({
      ...b,
      parking_slot: this.slots.find((s) => s.id === b.parking_slot_id),
      profile: DEMO_PROFILES[b.user_id] || this.currentUser,
    }))
  }

  getBookingById(id: string): Booking | undefined {
    const b = this.bookings.find((b) => b.id === id)
    if (!b) return undefined
    return {
      ...b,
      parking_slot: this.slots.find((s) => s.id === b.parking_slot_id),
      profile: DEMO_PROFILES[b.user_id] || this.currentUser,
    }
  }

  getEvents(limit = 10): ParkingEvent[] {
    return this.events.slice(0, limit).map((ev) => ({
      ...ev,
      parking_slot: this.slots.find((s) => s.id === ev.parking_slot_id),
      actor: ev.actor_id ? DEMO_PROFILES[ev.actor_id] : undefined,
    }))
  }

  // Demo Reset Function for presentation resets
  resetDemoData(): void {
    this.slots = INITIAL_SEEDED_SLOTS.map((s) => ({ ...s }))
    this.bookings = []
    this.events = []
    this.sessions = []
    this.saveState()
  }
}

export const demoStore = new DemoStore()
export const subscribeToStore = (listener: () => void) => demoStore.subscribe(listener)
