import React from 'react'
import type { ParkingSlot, OccupancyStatus } from '@/types/database'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { OCCUPANCY_LABELS, OCCUPANCY_BADGE_CLASS } from '@/lib/utils'
import { CheckCircle2, AlertTriangle, Car, Clock, Shield } from 'lucide-react'

interface SlotDetailModalProps {
  slot: ParkingSlot | null
  isOpen: boolean
  onClose: () => void
  onReserve?: (slot: ParkingSlot) => void
  isAdmin?: boolean
  onUpdateStatus?: (slotId: string, status: OccupancyStatus) => Promise<void>
  isUpdatingStatus?: boolean
}

export const SlotDetailModal: React.FC<SlotDetailModalProps> = ({
  slot,
  isOpen,
  onClose,
  onReserve,
  isAdmin = false,
  onUpdateStatus,
  isUpdatingStatus = false,
}) => {
  if (!slot) return null

  const effectiveStatus = !slot.is_active ? 'maintenance' : slot.occupancy_status

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Parking Space ${slot.label}`}>
      <div className="space-y-5">
        {/* Header summary */}
        <div className="flex items-center justify-between pb-4 border-b border-charcoal-100">
          <div>
            <span className="text-2xl font-black text-charcoal-900">{slot.label}</span>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Zone {slot.zone} • {slot.slot_type.toUpperCase()}
            </p>
          </div>
          <span className={OCCUPANCY_BADGE_CLASS[effectiveStatus]}>
            {OCCUPANCY_LABELS[effectiveStatus]}
          </span>
        </div>

        {/* Details list */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg bg-charcoal-50 p-2.5">
            <span className="text-charcoal-400 block font-medium">Zone / Floor</span>
            <span className="text-charcoal-800 font-semibold text-sm">Zone {slot.zone}</span>
          </div>
          <div className="rounded-lg bg-charcoal-50 p-2.5">
            <span className="text-charcoal-400 block font-medium">Slot Type</span>
            <span className="text-charcoal-800 font-semibold text-sm capitalize">
              {slot.slot_type}
            </span>
          </div>
          <div className="rounded-lg bg-charcoal-50 p-2.5">
            <span className="text-charcoal-400 block font-medium">Operational Status</span>
            <span className="text-charcoal-800 font-semibold text-sm">
              {slot.is_active ? 'Active' : 'Deactivated'}
            </span>
          </div>
          <div className="rounded-lg bg-charcoal-50 p-2.5">
            <span className="text-charcoal-400 block font-medium">Hardware Sensor</span>
            <span className="text-charcoal-500 font-medium text-xs">Simulated Status</span>
          </div>
        </div>

        {slot.notes && (
          <div className="rounded-lg border border-charcoal-200 bg-charcoal-50/50 p-3 text-xs text-charcoal-600">
            <strong className="block text-charcoal-700 mb-0.5">Location Notes:</strong>
            {slot.notes}
          </div>
        )}

        {/* Admin Occupancy Simulation Controls */}
        {isAdmin && onUpdateStatus && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
              <Shield className="w-3.5 h-3.5 text-emerald-700" />
              <span>Admin Status Simulator</span>
            </div>
            <p className="text-[11px] text-charcoal-500">
              Simulate sensor reading or manual barrier update for demonstration.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={slot.occupancy_status === 'available' ? 'primary' : 'outline'}
                size="sm"
                isLoading={isUpdatingStatus}
                onClick={() => onUpdateStatus(slot.id, 'available')}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              >
                Available
              </Button>
              <Button
                variant={slot.occupancy_status === 'occupied' ? 'primary' : 'outline'}
                size="sm"
                isLoading={isUpdatingStatus}
                onClick={() => onUpdateStatus(slot.id, 'occupied')}
                leftIcon={<Car className="w-3.5 h-3.5 text-red-500" />}
              >
                Occupied
              </Button>
              <Button
                variant={slot.occupancy_status === 'maintenance' ? 'primary' : 'outline'}
                size="sm"
                isLoading={isUpdatingStatus}
                onClick={() => onUpdateStatus(slot.id, 'maintenance')}
                leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
              >
                Service
              </Button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-charcoal-100">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          {effectiveStatus === 'available' && onReserve && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose()
                onReserve(slot)
              }}
              leftIcon={<Clock className="w-4 h-4" />}
            >
              Reserve Slot
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
