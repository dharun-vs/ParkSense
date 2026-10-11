import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Booking, BookingStatus } from '@/types/database'
import { demoStore } from '@/lib/demoStore'

export async function createBooking(booking: {
  parking_slot_id: string
  start_time: string
  end_time: string
  vehicle_plate?: string
  notes?: string
}): Promise<Booking> {
  if (isSupabaseConfigured) {
    // Transactional RPC prevents race conditions and double bookings
    const { data, error } = await supabase.rpc('create_booking', {
      p_slot_id: booking.parking_slot_id,
      p_start_time: booking.start_time,
      p_end_time: booking.end_time,
      p_vehicle_plate: booking.vehicle_plate ?? null,
      p_notes: booking.notes ?? null,
    })

    if (error) throw error
    return data as Booking
  } else {
    return demoStore.createBooking(booking)
  }
}

export async function fetchMyBookings(): Promise<Booking[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, parking_slot:parking_slots(*)')
      .order('start_time', { ascending: false })
      .limit(100)

    if (error) throw error
    return data as Booking[]
  } else {
    const user = demoStore.getCurrentUser()
    return demoStore.getBookings(user?.id)
  }
}

export async function fetchBookingById(id: string): Promise<Booking> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, parking_slot:parking_slots(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Booking
  } else {
    const b = demoStore.getBookingById(id)
    if (!b) throw new Error('Booking not found')
    return b
  }
}

export async function cancelBooking(bookingId: string): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.rpc('cancel_booking', {
      p_booking_id: bookingId,
    })

    if (error) throw error
  } else {
    demoStore.cancelBooking(bookingId)
  }
}

// Admin: fetch all bookings with user profiles
export async function fetchAllBookings(filters?: {
  status?: BookingStatus
  from?: string
  to?: string
}): Promise<Booking[]> {
  if (isSupabaseConfigured) {
    let query = supabase
      .from('bookings')
      .select('*, parking_slot:parking_slots(*), profile:profiles(id, display_name, role)')
      .order('created_at', { ascending: false })
      .limit(200)

    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.from) query = query.gte('start_time', filters.from)
    if (filters?.to) query = query.lte('end_time', filters.to)

    const { data, error } = await query
    if (error) throw error
    return data as Booking[]
  } else {
    let all = demoStore.getBookings()
    if (filters?.status) all = all.filter((b) => b.status === filters.status)
    return all
  }
}

export function subscribeToBookingChanges(callback: () => void): () => void {
  return demoStore.subscribe(callback)
}

// Admin: mark booking as completed
export async function completeBooking(bookingId: string): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', bookingId)

    if (error) throw error
  } else {
    demoStore.completeBooking(bookingId)
  }
}
