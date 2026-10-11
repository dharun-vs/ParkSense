import React, { useState } from 'react'
import type { ParkingSlot } from '@/types/database'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createBooking } from '@/features/bookings/bookingService'
import { useAuth } from '@/features/auth/AuthContext'
import { Clock, Calendar, Car, AlertCircle, CheckCircle2 } from 'lucide-react'
import { format, addHours, addMinutes } from 'date-fns'

interface BookingModalProps {
  slot: ParkingSlot | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export const BookingModal: React.FC<BookingModalProps> = ({
  slot,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Default start: 10 minutes from now, rounded to nearest 5 mins
  const now = new Date()
  const defaultStart = addMinutes(now, 10)
  const defaultEnd = addHours(defaultStart, 2)

  // Format datetime-local strings
  const formatInputDate = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm")

  const [startTime, setStartTime] = useState(formatInputDate(defaultStart))
  const [endTime, setEndTime] = useState(formatInputDate(defaultEnd))
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [notes, setNotes] = useState('')

  if (!slot) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!user) {
      setErrorMessage('You must be signed in to make a parking reservation.')
      return
    }

    const startDate = new Date(startTime)
    const endDate = new Date(endTime)

    if (startDate <= new Date()) {
      setErrorMessage('Start time must be in the future.')
      return
    }

    if (endDate <= startDate) {
      setErrorMessage('End time must be after the reservation start time.')
      return
    }

    try {
      setIsSubmitting(true)
      await createBooking({
        parking_slot_id: slot.id,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        vehicle_plate: vehiclePlate.trim() || undefined,
        notes: notes.trim() || undefined,
      })

      setSuccessMessage('Reservation confirmed successfully! Your parking space is reserved.')
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to book slot. It may have already been reserved.'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Reserve Parking Space ${slot.label}`}>
      {successMessage ? (
        <div className="py-6 flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-charcoal-900">Reservation Successful</h3>
          <p className="text-xs text-charcoal-500 max-w-sm">{successMessage}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg bg-emerald-50/60 border border-emerald-200/80 p-3 flex items-center justify-between text-xs text-emerald-900">
            <div>
              <span className="font-bold text-sm block">Slot {slot.label}</span>
              <span>Zone {slot.zone} • {slot.slot_type.toUpperCase()}</span>
            </div>
            <span className="bg-emerald-600 text-white font-medium px-2 py-0.5 rounded text-[11px]">
              Ready for Reservation
            </span>
          </div>

          {errorMessage && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Start Time
              </label>
              <Input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                min={formatInputDate(new Date())}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                End Time
              </label>
              <Input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                min={startTime}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Vehicle License Plate (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g. KA-01-AB-1234"
              value={vehiclePlate}
              onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
              leftIcon={<Car className="w-4 h-4" />}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Special Notes / Instructions (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g. Needs EV charging or wide clearance"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-charcoal-100">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              leftIcon={<Clock className="w-4 h-4" />}
            >
              Confirm Reservation
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
