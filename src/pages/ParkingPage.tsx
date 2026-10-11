import React, { useEffect, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { fetchAllSlots, simulateOccupancyChange, subscribeToParkingChanges } from '@/features/parking/parkingService'
import { getActiveSession, checkIn, checkOut } from '@/features/parking/sessionService'
import { FloorParkingLayout } from '@/components/parking/FloorParkingLayout'
import { useAuth } from '@/features/auth/AuthContext'
import type { ParkingSlot, ParkingSession, OccupancyStatus } from '@/types/database'
import { type FloorId } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { MapPin, RefreshCw, AlertCircle, MapPinOff } from 'lucide-react'

interface FindMyCarState {
  findMyCar?: boolean
  floorId?: FloorId
  slotId?: string
}

export const ParkingPage: React.FC = () => {
  const { user, isAdmin } = useAuth()
  const location = useLocation()
  const navState = (location.state ?? {}) as FindMyCarState

  const [slots, setSlots] = useState<ParkingSlot[]>([])
  const [activeSession, setActiveSession] = useState<ParkingSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Find My Car state (forwarded from dashboard)
  const [findMyCarActive, setFindMyCarActive] = useState(navState.findMyCar ?? false)
  const [forceFloor, setForceFloor] = useState<FloorId | undefined>(navState.floorId)
  const [highlightSlotId, setHighlightSlotId] = useState<string | undefined>(navState.slotId)

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true)
      setError(null)
      const [slotsData, sessionData] = await Promise.all([
        fetchAllSlots().catch(() => []),
        user ? getActiveSession(user.id).catch(() => null) : Promise.resolve(null),
      ])
      setSlots(slotsData)
      setActiveSession(sessionData)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load parking data.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadData()
    const unsubscribe = subscribeToParkingChanges(() => {
      loadData(true)
    })
    return () => unsubscribe()
  }, [loadData])

  const handleCheckIn = async (slot: ParkingSlot) => {
    await checkIn({ parking_slot_id: slot.id })
    await loadData()
  }

  const handleCheckOut = async () => {
    if (!activeSession) return
    await checkOut(activeSession.id)
    await loadData()
    // Clear Find My Car state since session is closed
    setFindMyCarActive(false)
    setForceFloor(undefined)
    setHighlightSlotId(undefined)
  }

  const handleAdminUpdateStatus = async (slotId: string, status: OccupancyStatus) => {
    await simulateOccupancyChange(slotId, status)
    setSlots((prev) =>
      prev.map((s) =>
        s.id === slotId ? { ...s, occupancy_status: status, is_active: status !== 'maintenance' } : s
      )
    )
  }

  const activateFindMyCar = () => {
    if (!activeSession?.parking_slot) {
      return
    }
    setFindMyCarActive(true)
    setForceFloor(activeSession.parking_slot.floor)
    setHighlightSlotId(activeSession.parking_slot_id)
  }

  const clearFindMyCar = () => {
    setFindMyCarActive(false)
    setForceFloor(undefined)
    setHighlightSlotId(undefined)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D] tracking-tight">
              Parking
            </h1>
            <h2 className="text-slate-400 font-normal text-lg sm:text-xl">
              · Campus Parking
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Select a floor and find an available space
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Find My Car button */}
          {activeSession && !findMyCarActive && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<MapPin className="w-4 h-4 text-yellow-500" />}
              onClick={activateFindMyCar}
            >
              Find My Car
            </Button>
          )}
          {findMyCarActive && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<MapPinOff className="w-4 h-4 text-charcoal-400" />}
              onClick={clearFindMyCar}
            >
              Clear Highlight
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData()}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Find My Car banner */}
      {findMyCarActive && activeSession?.parking_slot && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 text-yellow-600" />
          </div>
          <div>
            <p className="font-bold text-sm text-yellow-900">Find My Car</p>
            <p className="text-xs text-yellow-700">
              Your vehicle is at Bay <strong>{activeSession.parking_slot.label}</strong> on{' '}
              <strong>{activeSession.parking_slot.floor === 'ground' ? 'Ground Floor' : activeSession.parking_slot.floor === 'level1' ? 'Level 1' : 'Level 2'}</strong>.
              It is highlighted in the layout below.
            </p>
          </div>
          <button className="ml-auto text-yellow-600 hover:text-yellow-800" onClick={clearFindMyCar}>
            <AlertCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* No active session, Find My Car requested */}
      {findMyCarActive && !activeSession && (
        <div className="bg-charcoal-50 border border-charcoal-200 rounded-xl p-4 text-xs text-charcoal-600 flex items-center gap-2">
          <MapPinOff className="w-4 h-4 text-charcoal-400 shrink-0" />
          <span>No active parking session. Check in to a bay first.</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => loadData()} className="font-semibold underline ml-2">Retry</button>
        </div>
      )}

      {/* Loading */}
      {isLoading && slots.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-charcoal-400 gap-2">
          <div className="w-8 h-8 border-2 border-[#165DFB] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading parking facility…</p>
        </div>
      ) : (
        <FloorParkingLayout
          slots={slots}
          activeSession={activeSession}
          isAdmin={isAdmin}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          forceFloor={forceFloor}
          highlightSlotId={highlightSlotId}
          onAdminUpdateStatus={handleAdminUpdateStatus}
        />
      )}
    </div>
  )
}
