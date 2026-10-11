/**
 * sessionService — Check-in / Check-out for physical parking sessions.
 *
 * In demo mode (no Supabase) this uses demoStore.
 * When Supabase is configured, operations would target a `parking_sessions`
 * table (not yet implemented server-side); demo fallback is always used for now.
 */
import { demoStore } from '@/lib/demoStore'
import type { ParkingSession } from '@/types/database'

export async function getActiveSession(userId: string): Promise<ParkingSession | null> {
  return demoStore.getActiveSession(userId)
}

export async function checkIn(params: {
  parking_slot_id: string
  vehicle_plate?: string
}): Promise<ParkingSession> {
  return demoStore.checkIn(params)
}

export async function checkOut(sessionId: string): Promise<ParkingSession> {
  return demoStore.checkOut(sessionId)
}

export async function getAllSessions(): Promise<ParkingSession[]> {
  return demoStore.getAllSessions()
}
