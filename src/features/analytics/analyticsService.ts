import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { ParkingEvent } from '@/types/database'
import { demoStore } from '@/lib/demoStore'

export async function fetchRecentEvents(limit = 20): Promise<ParkingEvent[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('parking_events')
      .select('*, parking_slot:parking_slots(id, label, zone), actor:profiles(id, display_name)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as ParkingEvent[]
  } else {
    return demoStore.getEvents(limit)
  }
}

export async function fetchAnalyticsStats() {
  if (isSupabaseConfigured) {
    const { data: bookings, error: bError } = await supabase
      .from('bookings')
      .select('status, created_at')

    if (bError) throw bError

    const { data: slots, error: sError } = await supabase
      .from('parking_slots')
      .select('id, label, zone, occupancy_status, is_active')

    if (sError) throw sError

    return { bookings: bookings ?? [], slots: slots ?? [] }
  } else {
    const bookings = demoStore.getBookings().map((b) => ({
      status: b.status,
      created_at: b.created_at,
    }))
    const slots = demoStore.getSlots().map((s) => ({
      id: s.id,
      label: s.label,
      zone: s.zone,
      occupancy_status: s.occupancy_status,
      is_active: s.is_active,
    }))
    return { bookings, slots }
  }
}

export function subscribeToEventChanges(callback: () => void): () => void {
  return demoStore.subscribe(callback)
}
