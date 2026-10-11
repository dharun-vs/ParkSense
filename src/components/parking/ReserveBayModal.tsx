import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createBooking } from '@/features/bookings/bookingService'
import type { ParkingSlot } from '@/types/database'
import { FACILITY_FLOORS } from '@/types/database'
import { Calendar, Clock, Car, AlertCircle, CheckCircle2, Shield, Info } from 'lucide-react'
import { format, addHours, setMinutes, setSeconds, addMinutes } from 'date-fns'

interface ReserveBayModalProps {
  isOpen: boolean
  onClose: () => void
  slot: ParkingSlot | null
  onSuccess: () => void
}

export const ReserveBayModal: React.FC<ReserveBayModalProps> = ({
  isOpen,
  onClose,
  slot,
  onSuccess,
}) => {
  // Compute sensible default times (next top of hour, +2 hours duration)
  const getDefaultTimes = () => {
    const now = new Date()
    const nextHour = addHours(setSeconds(setMinutes(now, 0), 0), 1)
    const end = addHours(nextHour, 2)
    return {
      date: format(nextHour, 'yyyy-MM-dd'),
      startTime: format(nextHour, 'HH:mm'),
      endTime: format(end, 'HH:mm'),
    }
  }

  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [durationPreset, setDurationPreset] = useState<number | 'custom'>(2)
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  // Reset defaults when opened
  useEffect(() => {
    if (isOpen) {
      const def = getDefaultTimes()
      setDate(def.date)
      setStartTime(def.startTime)
      setEndTime(def.endTime)
      setDurationPreset(2)
      setVehiclePlate('')
      setNotes('')
      setError(null)
      setIsSuccess(false)
    }
  }, [isOpen])

  // Adjust end time when duration preset changes
  const handlePresetChange = (hours: number) => {
    setDurationPreset(hours)
    if (!startTime || !date) return
    try {
      const [sh, sm] = startTime.split(':').map(Number)
      const startObj = new Date(`${date}T${startTime}:00`)
      const endObj = addHours(startObj, hours)
      setEndTime(format(endObj, 'HH:mm'))
    } catch {
      // ignore
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slot) return

    if (!slot.is_active || slot.occupancy_status === 'maintenance') {
      setError('This parking bay is currently out of service and cannot be reserved.')
      return
    }

    setError(null)

    // Build ISO timestamps
    const startIso = `${date}T${startTime}:00`
    const endIso = `${date}T${endTime}:00`

    const startDate = new Date(startIso)
    const endDate = new Date(endIso)
    const now = new Date()

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setError('Please provide valid reservation dates and times.')
      return
    }

    if (startDate.getTime() < now.getTime() - 60000) {
      setError('Reservation start time must be in the future.')
      return
    }

    if (endDate.getTime() <= startDate.getTime()) {
      setError('Reservation end time must be after start time.')
      return
    }

    try {
      setIsLoading(true)
      await createBooking({
        parking_slot_id: slot.id,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        vehicle_plate: vehiclePlate.trim().toUpperCase() || undefined,
        notes: notes.trim() || undefined,
      })

      setIsSuccess(true)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reservation failed. Please choose another time.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  if (!slot) return null

  const floorDef = FACILITY_FLOORS.find((f) => f.id === slot.floor)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Reserve Bay ${slot.label}`}>
      {isSuccess ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#ecfdf3] text-[#16A765] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-charcoal-900">Reservation Confirmed!</h3>
          <p className="text-xs text-charcoal-500 max-w-xs mx-auto">
            Bay <strong>{slot.label}</strong> has been reserved for your scheduled time window. You can view it under My Reservations.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Bay Context Card */}
          <div className="bg-[#f0f5fc] border border-[#c3d8f3] rounded-xl p-3 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#154E9B] tracking-wider block">Target Bay</span>
              <span className="text-base font-black font-mono text-[#08264B]">
                Bay {slot.label} · {floorDef?.label ?? slot.floor}
              </span>
              <span className="text-charcoal-500 block capitalize text-[11px] mt-0.5">
                Zone {slot.zone} · {slot.slot_type} stall
              </span>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white text-[#1263F1] border border-[#c3d8f3]">
                Campus Parking
              </span>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Reservation Date</label>
            <Input
              type="date"
              value={date}
              min={format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Duration Presets */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1.5">Duration</label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 4, 8].map((hrs) => (
                <button
                  key={hrs}
                  type="button"
                  onClick={() => handlePresetChange(hrs)}
                  className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    durationPreset === hrs
                      ? 'bg-[#08264B] text-white border-[#08264B] shadow-xs'
                      : 'bg-white text-charcoal-700 border-charcoal-200 hover:bg-charcoal-50'
                  }`}
                >
                  {hrs} {hrs === 1 ? 'Hour' : 'Hours'}
                </button>
              ))}
            </div>
          </div>

          {/* Start and End Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Start Time</label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value)
                  if (typeof durationPreset === 'number') {
                    try {
                      const startObj = new Date(`${date}T${e.target.value}:00`)
                      const endObj = addHours(startObj, durationPreset)
                      setEndTime(format(endObj, 'HH:mm'))
                    } catch {
                      // ignore
                    }
                  }
                }}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">End Time</label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value)
                  setDurationPreset('custom')
                }}
                required
              />
            </div>
          </div>

          {/* Vehicle License Plate */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Vehicle Plate Number <span className="text-charcoal-400 font-normal">(Optional)</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. KA-01-AB-1234"
              value={vehiclePlate}
              onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Special Instructions <span className="text-charcoal-400 font-normal">(Optional)</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Visiting engineering building"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Information Notice matching reference design */}
          <div className="text-xs text-[#0B1B3D] bg-[#EFF6FF] p-3 rounded-xl border border-[#BFDBFE] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#165DFB] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Your space will be reserved for {durationPreset === 'custom' ? 'your selected duration' : `${durationPreset} hours`}. You'll be notified when it's time to check in.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading} className="rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
              className="bg-[#165DFB] hover:bg-[#1249c7] text-white font-semibold rounded-xl"
            >
              Confirm Reservation
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
