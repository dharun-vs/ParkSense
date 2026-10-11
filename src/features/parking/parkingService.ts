import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { ParkingSlot, OccupancyStatus } from '@/types/database'
import { demoStore } from '@/lib/demoStore'

export async function fetchAllSlots(): Promise<ParkingSlot[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('parking_slots')
      .select('*')
      .order('zone')
      .order('label')

    if (error) throw error
    return data as ParkingSlot[]
  } else {
    return demoStore.getSlots()
  }
}

export async function fetchActiveSlots(): Promise<ParkingSlot[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('parking_slots')
      .select('*')
      .eq('is_active', true)
      .order('zone')
      .order('label')

    if (error) throw error
    return data as ParkingSlot[]
  } else {
    return demoStore.getSlots().filter((s) => s.is_active)
  }
}

export async function fetchSlotById(id: string): Promise<ParkingSlot> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('parking_slots')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as ParkingSlot
  } else {
    const s = demoStore.getSlotById(id)
    if (!s) throw new Error('Parking bay not found')
    return s
  }
}

export async function createSlot(slot: {
  label: string
  zone: string
  floor?: 'ground' | 'level1' | 'level2'
  slot_type: string
  is_active: boolean
  notes?: string
}): Promise<ParkingSlot> {
  const floor: 'ground' | 'level1' | 'level2' =
    slot.floor ?? (slot.zone === 'A' ? 'ground' : slot.zone === 'B' ? 'level1' : 'level2')

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('parking_slots')
      .insert({ ...slot, floor })
      .select()
      .single()

    if (error) throw error
    return data as ParkingSlot
  } else {
    const newSlot: ParkingSlot = {
      id: `slot-${Date.now()}`,
      label: slot.label,
      zone: slot.zone,
      floor,
      slot_type: slot.slot_type,
      is_active: slot.is_active,
      occupancy_status: 'available',
      notes: slot.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const slots = demoStore.getSlots()
    slots.push(newSlot)
    return newSlot
  }
}

export async function updateSlot(
  id: string,
  updates: Partial<{
    label: string
    zone: string
    floor: 'ground' | 'level1' | 'level2'
    slot_type: string
    is_active: boolean
    notes: string
  }>
): Promise<ParkingSlot> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('parking_slots')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as ParkingSlot
  } else {
    const s = demoStore.getSlotById(id)
    if (!s) throw new Error('Slot not found')
    if (updates.label !== undefined) s.label = updates.label
    if (updates.zone !== undefined) s.zone = updates.zone
    if (updates.floor !== undefined) s.floor = updates.floor
    if (updates.slot_type !== undefined) s.slot_type = updates.slot_type
    if (updates.is_active !== undefined) demoStore.toggleSlotActive(id, updates.is_active)
    if (updates.notes !== undefined) s.notes = updates.notes
    s.updated_at = new Date().toISOString()
    return s
  }
}

// Simulate occupancy change (Admin only)
export async function simulateOccupancyChange(
  slotId: string,
  newStatus: OccupancyStatus
): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.rpc('admin_update_slot_occupancy', {
      p_slot_id: slotId,
      p_new_status: newStatus,
    })

    if (error) throw error
  } else {
    demoStore.updateSlotStatus(slotId, newStatus)
  }
}

export function subscribeToParkingChanges(callback: () => void): () => void {
  return demoStore.subscribe(callback)
}
