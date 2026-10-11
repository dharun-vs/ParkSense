/**
 * FloorParkingLayout — Reference-Faithful Parking Plan matching Screen 3:
 *   - 3 Floor Selector Cards with live bay and availability metrics
 *   - 2 opposing parallel bay rows with center Entrance / Exit circulation lane
 *   - Clean, light surface styling matching the executive ParkSense design language
 *   - Right-side status legend & primary Check In / Reserve action controls
 *   - Find My Car highlighting and active session management
 *   - Fully responsive, bounded layout with zero overlapping elements
 */
import React, { useState, useMemo, useEffect } from 'react'
import type { ParkingSlot, ParkingSession, OccupancyStatus } from '@/types/database'
import { FACILITY_FLOORS, type FloorId } from '@/types/database'
import { Button } from '@/components/ui/Button'
import {
  Zap,
  Accessibility,
  ShieldAlert,
  Car,
  MapPin,
  LogIn,
  LogOut,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowDown,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getParkingStatusTheme, PARKING_STATUS_THEMES } from '@/lib/statusColors'
import { ReserveBayModal } from '@/components/parking/ReserveBayModal'

interface FloorParkingLayoutProps {
  slots: ParkingSlot[]
  activeSession: ParkingSession | null
  isAdmin?: boolean
  onCheckIn: (slot: ParkingSlot) => Promise<void>
  onCheckOut: () => Promise<void>
  /** If set, override the displayed floor (e.g. for Find My Car) */
  forceFloor?: FloorId
  /** When true the highlighted bay pulses (Find My Car mode) */
  highlightSlotId?: string
  onAdminUpdateStatus?: (slotId: string, status: OccupancyStatus) => Promise<void>
  isUpdatingStatus?: boolean
}

export const FloorParkingLayout: React.FC<FloorParkingLayoutProps> = ({
  slots,
  activeSession,
  isAdmin = false,
  onCheckIn,
  onCheckOut,
  forceFloor,
  highlightSlotId,
  onAdminUpdateStatus,
  isUpdatingStatus = false,
}) => {
  const [activeFloor, setActiveFloor] = useState<FloorId>(
    forceFloor ?? (activeSession?.parking_slot?.floor ?? 'ground')
  )
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Reservation modal state
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false)
  const [slotToReserve, setSlotToReserve] = useState<ParkingSlot | null>(null)

  // Keep selectedSlot reference in sync with authoritative slots prop
  useEffect(() => {
    if (selectedSlot) {
      const refreshed = slots.find((s) => s.id === selectedSlot.id)
      if (refreshed) {
        setSelectedSlot(refreshed)
      }
    }
  }, [slots, selectedSlot])

  // When forceFloor changes (e.g. Find My Car trigger), update active tab
  useEffect(() => {
    if (forceFloor) {
      setActiveFloor(forceFloor)
      if (highlightSlotId) {
        const s = slots.find((sl) => sl.id === highlightSlotId)
        if (s) setSelectedSlot(s)
      }
    }
  }, [forceFloor, highlightSlotId, slots])

  const floorSlots = useMemo(
    () => slots.filter((s) => s.floor === activeFloor),
    [slots, activeFloor]
  )

  const currentFloor = FACILITY_FLOORS.find((f) => f.id === activeFloor)!

  // Divide bays into two opposing parallel rows matching the reference layout
  const { row1, row2 } = useMemo(() => {
    const half = Math.ceil(floorSlots.length / 2)
    return {
      row1: floorSlots.slice(0, half),
      row2: floorSlots.slice(half),
    }
  }, [floorSlots])

  const handleSelectBay = (slot: ParkingSlot) => {
    setSelectedSlot(slot)
    setError(null)
    setSuccess(null)
  }

  const handleCheckIn = async () => {
    if (!selectedSlot) return
    setIsCheckingIn(true)
    setError(null)
    try {
      await onCheckIn(selectedSlot)
      setSuccess(`Checked in to Bay ${selectedSlot.label}. Welcome!`)
      setSelectedSlot(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-in failed')
    } finally {
      setIsCheckingIn(false)
    }
  }

  const handleCheckOut = async () => {
    setIsCheckingOut(true)
    setError(null)
    try {
      await onCheckOut()
      setSuccess('Checked out successfully. Bay released.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-out failed')
    } finally {
      setIsCheckingOut(false)
    }
  }

  // Render individual parking bay card matching the reference design
  const renderBay = (slot: ParkingSlot) => {
    const isSelected = selectedSlot?.id === slot.id
    const isHighlighted = highlightSlotId === slot.id
    const isMyBay = activeSession?.parking_slot_id === slot.id
    const theme = getParkingStatusTheme(slot)
    const isMaintenance = theme.key === 'maintenance'
    const isOccupied = theme.key === 'occupied'
    const isReserved = theme.key === 'reserved'

    let cardBg = theme.tileClasses
    let icon = <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />

    if (isOccupied) {
      icon = <Car className="w-5 h-5 text-[#DC2626]" />
    } else if (isReserved) {
      icon = <Clock className="w-5 h-5 text-[#2563EB]" />
    } else if (isMaintenance) {
      icon = <ShieldAlert className="w-5 h-5 text-[#CA8A04]" />
    }

    if (isSelected) {
      cardBg = cn(theme.tileClasses, 'ring-2 ring-[#165DFB] shadow-md')
    } else if (isHighlighted || isMyBay) {
      cardBg = cn(theme.tileClasses, 'ring-2 ring-yellow-400 shadow-md')
    }

    return (
      <button
        key={slot.id}
        type="button"
        onClick={() => handleSelectBay(slot)}
        className={cn(
          'flex flex-col items-center justify-between p-2 rounded-xl border transition-all cursor-pointer select-none min-w-[62px] sm:min-w-[72px] h-24 hover:scale-[1.02] shadow-2xs',
          cardBg
        )}
        title={`Bay ${slot.label} — ${slot.occupancy_status}`}
        data-status={theme.key}
        data-bay={slot.label}
      >
        <div className="w-full flex items-center justify-between px-0.5">
          <span className="text-xs font-bold font-mono tracking-tight">{slot.label}</span>
          <div className="flex items-center gap-0.5">
            {slot.slot_type === 'ev' && <Zap className="w-2.5 h-2.5 text-emerald-500 shrink-0" />}
            {slot.slot_type === 'accessible' && <Accessibility className="w-2.5 h-2.5 text-blue-500 shrink-0" />}
          </div>
        </div>

        <div className="my-auto flex items-center justify-center">
          {icon}
        </div>

        <span className="text-[10px] font-bold capitalize">
          {theme.shortLabel}
        </span>
      </button>
    )
  }

  const effectiveSelectedStatus = selectedSlot
    ? !selectedSlot.is_active
      ? 'maintenance'
      : selectedSlot.occupancy_status
    : null

  const isUserInSelectedBay = selectedSlot && activeSession?.parking_slot_id === selectedSlot.id
  const userHasActiveSession = activeSession !== null && !isUserInSelectedBay

  return (
    <div className="space-y-5">
      {/* ── Floor Selector Cards matching Screen 3 ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {FACILITY_FLOORS.map((floor) => {
          const fSlots = slots.filter((s) => s.floor === floor.id && s.is_active)
          const fAvail = fSlots.filter((s) => s.occupancy_status === 'available').length
          const isActive = activeFloor === floor.id
          return (
            <button
              key={floor.id}
              type="button"
              onClick={() => {
                setActiveFloor(floor.id)
                setSelectedSlot(null)
                setError(null)
                setSuccess(null)
              }}
              className={cn(
                'flex flex-col items-start p-3.5 rounded-xl text-left transition-all cursor-pointer select-none',
                isActive
                  ? 'border-2 border-[#165DFB] bg-[#EFF6FF] shadow-xs'
                  : 'border border-slate-200 bg-white hover:bg-slate-50'
              )}
            >
              <span className="font-bold text-sm text-[#0B1B3D]">{floor.label}</span>
              <span className="text-xs text-slate-500 mt-0.5">
                {fSlots.length} bays · <strong className="text-[#10B981]">{fAvail} available</strong>
              </span>
            </button>
          )
        })}
      </div>

      {/* Notifications */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-auto text-emerald-600 hover:text-emerald-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Main Parking Blueprint Card matching Reference Screen 3 ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Parking Plan (Opposing Parallel Rows + Center Aisle) */}
          <div className="lg:col-span-3 bg-slate-50/80 rounded-2xl border border-slate-200 p-5 overflow-x-auto">
            {/* Floor indicator header matching test assertion */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200/80 min-w-[560px]">
              <span className="text-xs font-bold text-[#0B1B3D] tracking-tight">
                {currentFloor.label} — Zone {currentFloor.zone}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {currentFloor.bayRange} · Campus Parking
              </span>
            </div>

            {/* Top Row */}
            <div className="flex gap-2.5 justify-start sm:justify-between min-w-[560px] pb-2">
              {row1.map(renderBay)}
            </div>

            {/* Center Driving Aisle with Entrance / Exit indicator */}
            <div className="my-3 py-2 px-4 rounded-xl bg-white border border-dashed border-slate-200 flex items-center justify-center gap-3 min-w-[560px]">
              <ArrowDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                Entrance / Exit
              </span>
              <ArrowDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Bottom Row */}
            <div className="flex gap-2.5 justify-start sm:justify-between min-w-[560px] pt-2">
              {row2.map(renderBay)}
            </div>
          </div>

          {/* Right Column: Legend & Action Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Legend */}
            <div className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-200/80">
              <span className="text-xs font-bold text-[#0B1B3D] uppercase tracking-wider block">
                Status Legend
              </span>
              <div className="space-y-2 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#16A34A] shrink-0" title="#16A34A" data-status-color="#16A34A" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#DC2626] shrink-0" title="#DC2626" data-status-color="#DC2626" />
                  <span>Occupied</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#2563EB] shrink-0" title="#2563EB" data-status-color="#2563EB" />
                  <span>Reserved</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#EAB308] shrink-0" title="#EAB308" data-status-color="#EAB308" />
                  <span>Out of Service</span>
                </div>
              </div>
            </div>

            {/* Contextual Actions */}
            <div className="space-y-3">
              {selectedSlot ? (
                <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-bold uppercase text-slate-400 block">Selected Bay</span>
                      <h3 className="text-xl font-black text-[#0B1B3D] font-mono">Bay {selectedSlot.label}</h3>
                    </div>
                    <span
                      data-testid="selected-bay-badge"
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full capitalize',
                        getParkingStatusTheme(effectiveSelectedStatus).badgeClasses
                      )}
                    >
                      {getParkingStatusTheme(effectiveSelectedStatus).label}
                    </span>
                  </div>

                  {isUserInSelectedBay ? (
                    <Button
                      variant="outline"
                      size="md"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50"
                      onClick={handleCheckOut}
                      isLoading={isCheckingOut}
                      leftIcon={<LogOut className="w-4 h-4" />}
                    >
                      Check Out
                    </Button>
                  ) : effectiveSelectedStatus === 'available' ? (
                    <div className="space-y-2">
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full bg-[#165DFB] hover:bg-[#1249c7] text-white"
                        onClick={handleCheckIn}
                        isLoading={isCheckingIn}
                        disabled={userHasActiveSession}
                      >
                        Check In
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-slate-200 text-[#0B1B3D]"
                        onClick={() => {
                          setSlotToReserve(selectedSlot)
                          setIsReserveModalOpen(true)
                        }}
                        leftIcon={<Calendar className="w-3.5 h-3.5 text-[#165DFB]" />}
                      >
                        Reserve in Advance
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-slate-200 text-slate-600"
                        onClick={() => {
                          setSlotToReserve(selectedSlot)
                          setIsReserveModalOpen(true)
                        }}
                        leftIcon={<Calendar className="w-3.5 h-3.5 text-[#165DFB]" />}
                      >
                        Reserve Upcoming Time
                      </Button>
                    </div>
                  )}

                  {/* Admin controls */}
                  {isAdmin && onAdminUpdateStatus && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Admin Simulator</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(['available', 'occupied', 'reserved', 'maintenance'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            disabled={isUpdatingStatus}
                            onClick={() => onAdminUpdateStatus(selectedSlot.id, st)}
                            className={cn(
                              'text-[10px] font-bold py-1 px-2 rounded-lg border transition-all capitalize',
                              effectiveSelectedStatus === st
                                ? 'bg-[#0B1B3D] text-white border-[#0B1B3D]'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            )}
                          >
                            {st === 'maintenance' ? 'Service' : st}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : activeSession ? (
                <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-[#165DFB]" />
                    <div>
                      <p className="text-xs font-bold text-[#0B1B3D]">Your Active Session</p>
                      <p className="text-[11px] text-[#165DFB]">Bay {activeSession.parking_slot?.label ?? activeSession.parking_slot_id}</p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full bg-[#165DFB] hover:bg-[#1249c7] text-white"
                    onClick={handleCheckOut}
                    isLoading={isCheckingOut}
                  >
                    Check Out
                  </Button>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  <MapPin className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                  Select a bay to check in or reserve.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Advance Reservation Modal */}
      <ReserveBayModal
        isOpen={isReserveModalOpen}
        onClose={() => {
          setIsReserveModalOpen(false)
          setSlotToReserve(null)
        }}
        slot={slotToReserve}
        onSuccess={() => {
          setSuccess(`Bay ${slotToReserve?.label} successfully reserved!`)
        }}
      />
    </div>
  )
}
