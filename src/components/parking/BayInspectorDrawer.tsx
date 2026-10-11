import React from 'react'
import type { ParkingSlot, OccupancyStatus } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { OCCUPANCY_LABELS, OCCUPANCY_BADGE_CLASS } from '@/lib/utils'
import {
  X,
  Zap,
  Accessibility,
  CheckCircle2,
  Car,
  Clock,
  AlertTriangle,
  CalendarCheck,
  Shield,
  Layers,
} from 'lucide-react'

interface BayInspectorDrawerProps {
  slot: ParkingSlot | null
  onClose: () => void
  onReserve: (slot: ParkingSlot) => void
  isAdmin?: boolean
  onUpdateStatus?: (slotId: string, status: OccupancyStatus) => Promise<void>
  isUpdatingStatus?: boolean
}

export const BayInspectorDrawer: React.FC<BayInspectorDrawerProps> = ({
  slot,
  onClose,
  onReserve,
  isAdmin = false,
  onUpdateStatus,
  isUpdatingStatus = false,
}) => {
  if (!slot) return null

  const effectiveStatus = !slot.is_active ? 'maintenance' : slot.occupancy_status

  return (
    <div className="bg-white rounded-2xl border border-charcoal-200 shadow-lg p-5 space-y-5 animate-slide-in">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-charcoal-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-charcoal-900 font-mono tracking-tight">
              Bay {slot.label}
            </h2>
            <span className={OCCUPANCY_BADGE_CLASS[effectiveStatus]}>
              {OCCUPANCY_LABELS[effectiveStatus]}
            </span>
          </div>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Zone {slot.zone} • {slot.slot_type.toUpperCase()} SPECIFICATION
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-charcoal-400 hover:text-charcoal-800 rounded-lg hover:bg-charcoal-100 transition-colors"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Feature Pills */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-charcoal-50 p-2.5 rounded-lg border border-charcoal-100">
          <span className="text-[10px] uppercase font-bold text-charcoal-400 block">Facility Level</span>
          <span className="font-semibold text-charcoal-800 mt-0.5 block">
            {slot.zone === 'A' ? 'Ground Floor (Level 0)' : slot.zone === 'B' ? 'Level 1 (General)' : 'Level 2 (Economy)'}
          </span>
        </div>

        <div className="bg-charcoal-50 p-2.5 rounded-lg border border-charcoal-100">
          <span className="text-[10px] uppercase font-bold text-charcoal-400 block">Equipment & Type</span>
          <span className="font-semibold text-charcoal-800 mt-0.5 flex items-center gap-1.5 capitalize">
            {slot.slot_type === 'ev' && <Zap className="w-3.5 h-3.5 text-emerald-600" />}
            {slot.slot_type === 'accessible' && <Accessibility className="w-3.5 h-3.5 text-blue-600" />}
            {slot.slot_type}
          </span>
        </div>
      </div>

      {slot.notes && (
        <div className="rounded-lg bg-charcoal-50 border border-charcoal-200/60 p-3 text-xs text-charcoal-600">
          <strong className="block text-charcoal-700 font-semibold mb-0.5">Location Note:</strong>
          {slot.notes}
        </div>
      )}

      {/* Customer Reservation Action */}
      {effectiveStatus === 'available' ? (
        <div className="pt-2">
          <Button
            variant="primary"
            size="md"
            className="w-full shadow-sm"
            onClick={() => onReserve(slot)}
            leftIcon={<CalendarCheck className="w-4 h-4" />}
          >
            Reserve Bay {slot.label}
          </Button>
          <p className="text-[11px] text-charcoal-400 text-center mt-2">
            Instant booking confirmation with zero cancellation penalties.
          </p>
        </div>
      ) : effectiveStatus === 'occupied' ? (
        <div className="rounded-xl bg-red-50/70 border border-red-200 p-3.5 text-xs text-red-900 flex items-center gap-2.5">
          <Car className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <span className="font-bold block">Vehicle Currently Parked</span>
            <span className="text-[11px] text-red-700">This bay cannot be booked until the vehicle departs.</span>
          </div>
        </div>
      ) : effectiveStatus === 'reserved' ? (
        <div className="rounded-xl bg-blue-50/70 border border-blue-200 p-3.5 text-xs text-blue-900 flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <span className="font-bold block">Active Reservation Confirmed</span>
            <span className="text-[11px] text-blue-700">Reserved by customer for upcoming parking window.</span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-charcoal-100 border border-charcoal-300 p-3.5 text-xs text-charcoal-700 flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold block">Bay Temporarily Out of Service</span>
            <span className="text-[11px] text-charcoal-500">Undergoing routine maintenance or sensor recalibration.</span>
          </div>
        </div>
      )}

      {/* Admin Simulation Tool inside Inspector */}
      {isAdmin && onUpdateStatus && (
        <div className="pt-4 border-t border-charcoal-200 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
            <Shield className="w-3.5 h-3.5 text-emerald-700" />
            <span>Admin Status Simulator</span>
          </div>
          <p className="text-[11px] text-charcoal-500">
            Simulate sensor readings for academic evaluation:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={slot.occupancy_status === 'available' ? 'primary' : 'outline'}
              size="sm"
              disabled={isUpdatingStatus}
              onClick={() => onUpdateStatus(slot.id, 'available')}
              className="text-[11px] py-1"
            >
              Available
            </Button>
            <Button
              variant={slot.occupancy_status === 'occupied' ? 'primary' : 'outline'}
              size="sm"
              disabled={isUpdatingStatus}
              onClick={() => onUpdateStatus(slot.id, 'occupied')}
              className="text-[11px] py-1 text-red-700 border-red-200 hover:bg-red-50"
            >
              Occupied
            </Button>
            <Button
              variant={slot.occupancy_status === 'maintenance' ? 'primary' : 'outline'}
              size="sm"
              disabled={isUpdatingStatus}
              onClick={() => onUpdateStatus(slot.id, 'maintenance')}
              className="text-[11px] py-1 text-amber-700 border-amber-200 hover:bg-amber-50"
            >
              Service
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
