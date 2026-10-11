import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { fetchBookingById, cancelBooking } from '@/features/bookings/bookingService'
import type { Booking } from '@/types/database'
import {
  formatDateTime,
  isBookingCancellable,
  BOOKING_STATUS_BADGE,
  BOOKING_STATUS_LABELS,
} from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Modal'
import {
  ArrowLeft,
  CalendarCheck2,
  Clock,
  Car,
  AlertCircle,
  FileText,
  MapPin,
  XCircle,
} from 'lucide-react'

export const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const loadBooking = async () => {
    if (!id) return
    try {
      setIsLoading(true)
      setError(null)
      const data = await fetchBookingById(id)
      setBooking(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Booking not found.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBooking()
  }, [id])

  const handleConfirmCancel = async () => {
    if (!booking) return
    try {
      setIsCancelling(true)
      await cancelBooking(booking.id)
      setCancelModalOpen(false)
      loadBooking()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not cancel booking.')
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-charcoal-400 gap-2">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Loading reservation details...</p>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-charcoal-900">Reservation Not Found</h2>
        <p className="text-xs text-charcoal-500">{error || 'This booking could not be loaded.'}</p>
        <Link to="/bookings">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Bookings
          </Button>
        </Link>
      </div>
    )
  }

  const canCancel = isBookingCancellable(booking)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Navigation header */}
      <div className="flex items-center justify-between">
        <Link
          to="/bookings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-600 hover:text-emerald-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Bookings</span>
        </Link>
        <span className={BOOKING_STATUS_BADGE[booking.status]}>
          {BOOKING_STATUS_LABELS[booking.status]}
        </span>
      </div>

      {/* Main details card */}
      <div className="bg-white rounded-2xl border border-charcoal-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-charcoal-100 gap-4">
          <div>
            <h1 className="text-2xl font-black text-charcoal-900 tracking-tight">
              Parking Space {booking.parking_slot?.label || '—'}
            </h1>
            <p className="text-xs text-charcoal-500 mt-1">
              Booking Ref: <span className="font-mono text-charcoal-700">{booking.id}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelModalOpen(true)}
                className="text-red-600 border-red-200 hover:bg-red-50"
                leftIcon={<XCircle className="w-4 h-4" />}
              >
                Cancel Reservation
              </Button>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-charcoal-50/70 p-4 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-400 block">
              Start Time
            </span>
            <div className="flex items-center gap-2 font-semibold text-charcoal-800 text-sm">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>{formatDateTime(booking.start_time)}</span>
            </div>
          </div>

          <div className="bg-charcoal-50/70 p-4 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-400 block">
              End Time
            </span>
            <div className="flex items-center gap-2 font-semibold text-charcoal-800 text-sm">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>{formatDateTime(booking.end_time)}</span>
            </div>
          </div>

          <div className="bg-charcoal-50/70 p-4 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-400 block">
              Location / Zone
            </span>
            <div className="flex items-center gap-2 font-semibold text-charcoal-800 text-sm">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>
                Zone {booking.parking_slot?.zone || 'A'} • Slot {booking.parking_slot?.label}
              </span>
            </div>
          </div>

          <div className="bg-charcoal-50/70 p-4 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-400 block">
              Vehicle Registered
            </span>
            <div className="flex items-center gap-2 font-semibold text-charcoal-800 text-sm">
              <Car className="w-4 h-4 text-emerald-600" />
              <span className="font-mono">{booking.vehicle_plate || 'Not specified'}</span>
            </div>
          </div>
        </div>

        {booking.notes && (
          <div className="rounded-xl border border-charcoal-200 bg-charcoal-50/40 p-4 space-y-1">
            <span className="text-xs font-semibold text-charcoal-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-charcoal-500" />
              User Reservation Notes
            </span>
            <p className="text-xs text-charcoal-600 leading-relaxed">{booking.notes}</p>
          </div>
        )}

        <div className="text-[11px] text-charcoal-400 pt-4 border-t border-charcoal-100 flex items-center justify-between">
          <span>Booked on {formatDateTime(booking.created_at)}</span>
          <span>Status: {booking.status.toUpperCase()}</span>
        </div>
      </div>

      <ConfirmDialog
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Reservation"
        message="Are you sure you want to cancel this booking? This action will immediately release the space for other drivers."
        confirmLabel="Yes, Cancel Booking"
        isDanger={true}
        isLoading={isCancelling}
      />
    </div>
  )
}
